<?php

namespace Tests\Feature\Tenant;

use App\Models\Tenant\AiChatSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AiChatSessionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->otherUser = User::factory()->create();

        // Bypass tenancy middleware and migrate tenant tables into the default testing DB
        $this->withoutMiddleware();
        $this->artisan('migrate', ['--path' => 'database/migrations/tenant']);
    }

    public function test_user_can_only_see_their_own_sessions_in_index()
    {
        AiChatSession::create([
            'id' => Str::uuid(),
            'user_id' => $this->user->id,
            'title' => 'My Session 1',
            'messages' => [],
        ]);

        AiChatSession::create([
            'id' => Str::uuid(),
            'user_id' => $this->otherUser->id,
            'title' => 'Other Session',
            'messages' => [],
        ]);

        $response = $this->actingAs($this->user)->getJson(route('tenant.chats.index', ['tenant' => 'test']));

        $response->assertStatus(200);
        $response->assertJsonCount(1);
        $response->assertJsonFragment(['title' => 'My Session 1']);
        $response->assertJsonMissing(['title' => 'Other Session']);
    }

    public function test_ownership_enforced_on_show_update_and_destroy()
    {
        $session = AiChatSession::create([
            'id' => Str::uuid(),
            'user_id' => $this->user->id,
            'title' => 'My Session',
            'messages' => [],
        ]);

        // Show
        $showResponse = $this->actingAs($this->otherUser)->getJson(route('tenant.chats.show', ['tenant' => 'test', 'chatSession' => $session->id]));
        $showResponse->assertStatus(403);

        // Update
        $updateResponse = $this->actingAs($this->otherUser)->patchJson(route('tenant.chats.update', ['tenant' => 'test', 'chatSession' => $session->id]), [
            'title' => 'Hacked Title'
        ]);
        $updateResponse->assertStatus(403);

        // Destroy
        $destroyResponse = $this->actingAs($this->otherUser)->deleteJson(route('tenant.chats.destroy', ['tenant' => 'test', 'chatSession' => $session->id]));
        $destroyResponse->assertStatus(403);

        // Verify it still exists and wasn't changed
        $this->assertDatabaseHas('ai_chat_sessions', [
            'id' => $session->id,
            'title' => 'My Session'
        ]);
    }

    public function test_user_can_hard_delete_their_session()
    {
        $session = AiChatSession::create([
            'id' => Str::uuid(),
            'user_id' => $this->user->id,
            'title' => 'Session to delete',
            'messages' => [],
        ]);

        $this->assertDatabaseHas('ai_chat_sessions', ['id' => $session->id]);

        $response = $this->actingAs($this->user)->deleteJson(route('tenant.chats.destroy', ['tenant' => 'test', 'chatSession' => $session->id]));
        
        $response->assertStatus(204);
        $this->assertDatabaseMissing('ai_chat_sessions', ['id' => $session->id]);
    }
}
