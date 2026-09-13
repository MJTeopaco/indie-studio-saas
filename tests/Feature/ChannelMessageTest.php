<?php

namespace Tests\Feature;

use App\Models\Tenant\ChannelMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ChannelMessageTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected User $otherUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['name' => 'Alice Dev', 'email' => 'alice@test.io']);
        $this->otherUser = User::factory()->create(['name' => 'Bob Lead', 'email' => 'bob@test.io']);

        // Bypass tenancy middleware and migrate tenant tables into testing DB
        $this->withoutMiddleware();
        $this->artisan('migrate', ['--path' => 'database/migrations/tenant']);
    }

    public function test_user_can_send_message_to_channel(): void
    {
        $response = $this->actingAs($this->user)->postJson(
            route('tenant.channels.messages.store', ['tenant' => 'test-studio', 'channelId' => 'ch-general']),
            ['body' => 'Hello everyone from test!']
        );

        $response->assertStatus(201);
        $response->assertJsonPath('message.text', 'Hello everyone from test!');
        $response->assertJsonPath('message.channel_id', 'ch-general');
        $response->assertJsonPath('message.sender', 'Alice Dev');
        $response->assertJsonPath('message.isSelf', true);

        $this->assertDatabaseHas('channel_messages', [
            'channel_id' => 'ch-general',
            'body' => 'Hello everyone from test!',
            'user_id' => $this->user->id,
        ]);
    }

    public function test_cannot_send_empty_message_without_attachments(): void
    {
        $response = $this->actingAs($this->user)->postJson(
            route('tenant.channels.messages.store', ['tenant' => 'test-studio', 'channelId' => 'ch-general']),
            ['body' => '']
        );

        $response->assertStatus(422);
        $response->assertJsonPath('message', 'Message body or file attachment is required.');
    }

    public function test_user_can_send_message_with_photo_attachment(): void
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->create('architecture.png', 100, 'image/png');

        $response = $this->actingAs($this->user)->post(
            route('tenant.channels.messages.store', ['tenant' => 'test-studio', 'channelId' => 'ch-dev']),
            [
                'body' => 'Check this architecture screenshot',
                'file' => $file,
            ]
        );

        $response->assertStatus(201);
        $response->assertJsonPath('message.text', 'Check this architecture screenshot');
        $response->assertJsonCount(1, 'message.attachments');
        $response->assertJsonPath('message.attachments.0.name', 'architecture.png');
        $response->assertJsonPath('message.attachments.0.type', 'image');
    }

    public function test_user_can_mention_another_user(): void
    {
        $response = $this->actingAs($this->user)->postJson(
            route('tenant.channels.messages.store', ['tenant' => 'test-studio', 'channelId' => 'ch-dev']),
            [
                'body' => "Hey @{$this->otherUser->name}, can you review this code?",
                'mentions' => [$this->otherUser->id],
            ]
        );

        $response->assertStatus(201);
        $response->assertJsonPath('message.mentions.0', $this->otherUser->id);

        $this->assertDatabaseHas('channel_messages', [
            'channel_id' => 'ch-dev',
            'user_id' => $this->user->id,
        ]);
    }

    public function test_user_can_send_email_notification_for_chat(): void
    {
        Mail::fake();

        $response = $this->actingAs($this->user)->postJson(
            route('tenant.channels.messages.email', ['tenant' => 'test-studio', 'channelId' => 'ch-general']),
            [
                'recipient_email' => 'partner@company.com',
                'message_text' => 'Important sprint update for stakeholder review.',
            ]
        );

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
    }

    public function test_user_can_retrieve_channel_messages(): void
    {
        ChannelMessage::create([
            'channel_id' => 'ch-sprint',
            'user_id' => $this->otherUser->id,
            'sender_name' => $this->otherUser->name,
            'sender_role' => 'Leader',
            'body' => 'Sprint kickoff today!',
        ]);

        $response = $this->actingAs($this->user)->getJson(
            route('tenant.channels.messages.index', ['tenant' => 'test-studio', 'channelId' => 'ch-sprint'])
        );

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'messages');
        $response->assertJsonPath('messages.0.text', 'Sprint kickoff today!');
        $response->assertJsonPath('messages.0.isSelf', false);
    }

    public function test_polling_supports_after_id(): void
    {
        $msg1 = ChannelMessage::create([
            'channel_id' => 'ch-dev',
            'user_id' => $this->user->id,
            'sender_name' => 'Alice',
            'sender_role' => 'Member',
            'body' => 'First message',
        ]);

        $msg2 = ChannelMessage::create([
            'channel_id' => 'ch-dev',
            'user_id' => $this->otherUser->id,
            'sender_name' => 'Bob',
            'sender_role' => 'Leader',
            'body' => 'Second message',
        ]);

        // Polling with after_id should only return messages with id > $msg1->id
        $response = $this->actingAs($this->user)->getJson(
            route('tenant.channels.messages.index', ['tenant' => 'test-studio', 'channelId' => 'ch-dev', 'after_id' => $msg1->id])
        );

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'messages');
        $response->assertJsonPath('messages.0.text', 'Second message');
        $response->assertJsonPath('last_id', $msg2->id);
    }

    public function test_incoming_dm_and_mention_generate_notifications(): void
    {
        // 1. DM from otherUser to user
        $dmChannel = "dm-{$this->user->id}_{$this->otherUser->id}";
        ChannelMessage::create([
            'channel_id' => $dmChannel,
            'user_id' => $this->otherUser->id,
            'sender_name' => $this->otherUser->name,
            'sender_role' => 'Leader',
            'body' => 'Private DM to you!',
        ]);

        // 2. Mention of user in channel
        ChannelMessage::create([
            'channel_id' => 'ch-general',
            'user_id' => $this->otherUser->id,
            'sender_name' => $this->otherUser->name,
            'sender_role' => 'Leader',
            'body' => "Hey @{$this->user->name}, need your input on UI",
            'mentions' => [$this->user->id],
        ]);

        // Act as user and call inbox endpoint
        $response = $this->actingAs($this->user)->get(
            route('tenant.inbox', ['tenant' => 'test-studio'])
        );

        $response->assertStatus(200);
        $notifications = $response->viewData('page')['props']['notifications'] ?? [];

        $hasDmNotif = collect($notifications)->contains(fn ($n) => ($n['type'] ?? '') === 'direct_message');
        $hasMentionNotif = collect($notifications)->contains(fn ($n) => ($n['type'] ?? '') === 'channel_mention');

        $this->assertTrue($hasDmNotif, 'Expected direct message notification for user');
        $this->assertTrue($hasMentionNotif, 'Expected channel mention notification for user');
    }

    public function test_user_can_reply_to_message(): void
    {
        $original = ChannelMessage::create([
            'channel_id' => 'ch-general',
            'user_id' => $this->otherUser->id,
            'sender_name' => $this->otherUser->name,
            'sender_role' => 'Leader',
            'body' => 'Can someone look into bug #42?',
        ]);

        $response = $this->actingAs($this->user)->postJson(
            route('tenant.channels.messages.store', ['tenant' => 'test-studio', 'channelId' => 'ch-general']),
            [
                'body' => 'I am looking into it now.',
                'reply_to_id' => $original->id,
            ]
        );

        $response->assertStatus(201);
        $response->assertJsonPath('message.text', 'I am looking into it now.');
        $response->assertJsonPath('message.reply_to.id', $original->id);
        $response->assertJsonPath('message.reply_to.sender', $this->otherUser->name);
        $response->assertJsonPath('message.reply_to.text', 'Can someone look into bug #42?');
    }

    public function test_user_can_unsend_own_message_for_everyone_shows_placeholder(): void
    {
        $message = ChannelMessage::create([
            'channel_id' => 'ch-general',
            'user_id' => $this->user->id,
            'sender_name' => $this->user->name,
            'sender_role' => 'Member',
            'body' => 'Mistake message to be unsent',
        ]);

        $response = $this->actingAs($this->user)->deleteJson(
            route('tenant.channels.messages.destroy', [
                'tenant' => 'test-studio',
                'channelId' => 'ch-general',
                'message' => $message->id,
                'scope' => 'everyone',
            ])
        );

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('scope', 'everyone');
        $response->assertJsonPath('item.is_unsent', true);
        $response->assertJsonPath('item.text', 'You unsent a message');

        // Message is still in database with is_unsent = true
        $this->assertDatabaseHas('channel_messages', [
            'id' => $message->id,
            'is_unsent' => true,
        ]);

        // When other user views it, they see "[Sender] unsent a message"
        $bobView = $this->actingAs($this->otherUser)->getJson(
            route('tenant.channels.messages.index', ['tenant' => 'test-studio', 'channelId' => 'ch-general'])
        );
        $bobView->assertStatus(200);
        $bobView->assertJsonFragment([
            'id' => $message->id,
            'is_unsent' => true,
            'text' => 'Alice Dev unsent a message',
            'isSelf' => false,
        ]);
    }

    public function test_other_user_cannot_unsend_message_of_others_for_everyone(): void
    {
        $message = ChannelMessage::create([
            'channel_id' => 'ch-general',
            'user_id' => $this->user->id,
            'sender_name' => $this->user->name,
            'body' => 'Original message from Alice',
        ]);

        // Bob tries to unsend Alice's message for everyone
        $response = $this->actingAs($this->otherUser)->deleteJson(
            route('tenant.channels.messages.destroy', [
                'tenant' => 'test-studio',
                'channelId' => 'ch-general',
                'message' => $message->id,
                'scope' => 'everyone',
            ])
        );

        $response->assertStatus(403);
        $response->assertJsonPath('message', 'You cannot unsend another user\'s message for everyone. You can only unsend it for yourself.');

        // Alice's message is intact in database and not unsent
        $this->assertDatabaseHas('channel_messages', [
            'id' => $message->id,
            'body' => 'Original message from Alice',
            'is_unsent' => false,
        ]);
    }

    public function test_user_can_toggle_pin_message(): void
    {
        $message = ChannelMessage::create([
            'channel_id' => 'ch-general',
            'user_id' => $this->user->id,
            'sender_name' => $this->user->name,
            'sender_role' => 'Member',
            'body' => 'Important announcement for sprint',
            'is_pinned' => false,
        ]);

        $response = $this->actingAs($this->user)->postJson(
            route('tenant.channels.messages.pin', [
                'tenant' => 'test-studio',
                'channelId' => 'ch-general',
                'message' => $message->id,
            ])
        );

        $response->assertStatus(200);
        $response->assertJsonPath('is_pinned', true);
        $this->assertDatabaseHas('channel_messages', [
            'id' => $message->id,
            'is_pinned' => true,
        ]);

        // Toggle unpin
        $unpinRes = $this->actingAs($this->user)->postJson(
            route('tenant.channels.messages.pin', [
                'tenant' => 'test-studio',
                'channelId' => 'ch-general',
                'message' => $message->id,
            ])
        );

        $unpinRes->assertStatus(200);
        $unpinRes->assertJsonPath('is_pinned', false);
    }

    public function test_user_can_retrieve_channel_assets(): void
    {
        ChannelMessage::create([
            'channel_id' => 'ch-general',
            'user_id' => $this->user->id,
            'sender_name' => $this->user->name,
            'body' => 'Check our repo: https://github.com/SprintStudio/test and docs at https://docs.sprintstudio.io/v1',
            'attachments' => [
                [
                    'url' => '/studio/test-studio/attachments/test.png',
                    'name' => 'mockup.png',
                    'type' => 'image',
                    'size' => 1024,
                    'extension' => 'png',
                ],
                [
                    'url' => '/studio/test-studio/attachments/spec.pdf',
                    'name' => 'spec.pdf',
                    'type' => 'file',
                    'size' => 2048,
                    'extension' => 'pdf',
                ],
            ],
        ]);

        $response = $this->actingAs($this->user)->getJson(
            route('tenant.channels.assets', ['tenant' => 'test-studio', 'channelId' => 'ch-general'])
        );

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'media');
        $response->assertJsonCount(1, 'files');
        $response->assertJsonCount(2, 'links');
    }

    public function test_user_can_unsend_message_for_me_only(): void
    {
        $message = ChannelMessage::create([
            'channel_id' => 'ch-general',
            'user_id' => $this->otherUser->id,
            'sender_name' => $this->otherUser->name,
            'body' => 'Shared secret note',
        ]);

        $response = $this->actingAs($this->user)->deleteJson(
            route('tenant.channels.messages.destroy', [
                'tenant' => 'test-studio',
                'channelId' => 'ch-general',
                'message' => $message->id,
                'scope' => 'for_me',
            ])
        );

        $response->assertStatus(200);
        $response->assertJsonPath('scope', 'for_me');
        $response->assertJsonPath('success', true);

        // Record still in DB
        $this->assertDatabaseHas('channel_messages', ['id' => $message->id]);

        // Alice cannot see it
        $aliceView = $this->actingAs($this->user)->getJson(
            route('tenant.channels.messages.index', ['tenant' => 'test-studio', 'channelId' => 'ch-general'])
        );
        $aliceView->assertJsonMissing(['id' => $message->id]);

        // Bob can still see it
        $bobView = $this->actingAs($this->otherUser)->getJson(
            route('tenant.channels.messages.index', ['tenant' => 'test-studio', 'channelId' => 'ch-general'])
        );
        $bobView->assertJsonFragment(['id' => $message->id]);
    }

    public function test_assets_includes_pinned_messages(): void
    {
        $message = ChannelMessage::create([
            'channel_id' => 'ch-dev',
            'user_id' => $this->user->id,
            'sender_name' => $this->user->name,
            'body' => 'Sprint architecture guidelines',
            'is_pinned' => true,
            'pinned_at' => now(),
        ]);

        $response = $this->actingAs($this->user)->getJson(
            route('tenant.channels.assets', ['tenant' => 'test-studio', 'channelId' => 'ch-dev'])
        );

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'pinned');
        $response->assertJsonPath('pinned.0.id', $message->id);
    }

    public function test_user_can_retrieve_channels_activity(): void
    {
        ChannelMessage::create([
            'channel_id' => 'ch-dev',
            'user_id' => $this->otherUser->id,
            'sender_name' => $this->otherUser->name,
            'body' => 'Need help on database indexing',
        ]);

        $response = $this->actingAs($this->user)->getJson(
            route('tenant.channels.activity', ['tenant' => 'test-studio'])
        );

        $response->assertStatus(200);
        $response->assertJsonStructure(['unread_counts', 'activity', 'notifications']);
        $this->assertGreaterThanOrEqual(1, $response->json('unread_counts.ch-dev'));
    }

    public function test_cannot_pin_unsent_message(): void
    {
        $message = ChannelMessage::create([
            'channel_id' => 'ch-general',
            'user_id' => $this->user->id,
            'sender_name' => $this->user->name,
            'body' => 'Secret note',
            'is_unsent' => true,
        ]);

        $response = $this->actingAs($this->user)->postJson(
            route('tenant.channels.messages.pin', [
                'tenant' => 'test-studio',
                'channelId' => 'ch-general',
                'message' => $message->id,
            ])
        );

        $response->assertStatus(404);
        $response->assertJsonPath('message', 'Message not found or has been unsent.');
    }

    public function test_assets_excludes_unsent_messages(): void
    {
        ChannelMessage::create([
            'channel_id' => 'ch-general',
            'user_id' => $this->user->id,
            'sender_name' => $this->user->name,
            'body' => 'Check https://example.com',
            'is_unsent' => true,
            'attachments' => [
                ['url' => '/test.png', 'name' => 'test.png', 'type' => 'image', 'size' => 100],
            ],
        ]);

        $response = $this->actingAs($this->user)->getJson(
            route('tenant.channels.assets', ['tenant' => 'test-studio', 'channelId' => 'ch-general'])
        );

        $response->assertStatus(200);
        $response->assertJsonCount(0, 'media');
        $response->assertJsonCount(0, 'files');
        $response->assertJsonCount(0, 'links');
    }
}
