<?php

namespace App\Http\Controllers;

use App\Mail\ChannelMessageNotificationMail;
use App\Models\Studio;
use App\Models\Tenant\ChannelMessage;
use App\Models\Tenant\ChannelRead;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ChannelMessageController extends Controller
{
    /**
     * Fetch the latest messages for a channel.
     * Supports polling: accepts ?after_id=<last_seen_id> to return only new messages.
     *
     * GET /studio/{tenant}/channels/{channelId}/messages
     */
    public function index(Request $request): JsonResponse
    {
        $channelId = (string) $request->route('channelId');
        $afterId = $request->query('after_id');
        $user = $request->user();

        $query = ChannelMessage::where('channel_id', $channelId)
            ->where(function ($q) use ($user) {
                if ($user) {
                    $q->whereNull('deleted_for_user_ids')
                        ->orWhereJsonDoesntContain('deleted_for_user_ids', (int) $user->id);
                }
            })
            ->orderBy('id')
            ->limit(150);

        if ($afterId) {
            $query->where('id', '>', (int) $afterId);
        }

        $messages = $query->get()->map(fn (ChannelMessage $m) => $this->format($m, $user));

        $updatedMessages = [];
        if ($afterId) {
            $updatedMessages = ChannelMessage::where('channel_id', $channelId)
                ->where('id', '<=', (int) $afterId)
                ->where('updated_at', '>=', now()->subSeconds(30))
                ->where(function ($q) use ($user) {
                    if ($user) {
                        $q->whereNull('deleted_for_user_ids')
                            ->orWhereJsonDoesntContain('deleted_for_user_ids', (int) $user->id);
                    }
                })
                ->get()
                ->map(fn (ChannelMessage $m) => $this->format($m, $user));
        }

        $lastMessage = $messages->last();
        $lastId = is_array($lastMessage) ? ($lastMessage['id'] ?? null) : null;

        return response()->json([
            'messages' => $messages,
            'updated_messages' => $updatedMessages,
            'last_id' => $lastId ?? ($afterId ? (int) $afterId : null),
        ]);
    }

    /**
     * Send a new message to a channel (with optional file/photo upload and mentions).
     *
     * POST /studio/{tenant}/channels/{channelId}/messages
     */
    public function store(Request $request): JsonResponse
    {
        $channelId = (string) $request->route('channelId');

        $request->validate([
            'body' => ['nullable', 'string', 'max:4000'],
            'file' => ['nullable', 'file', 'max:20480'], // 20 MB max
            'files.*' => ['nullable', 'file', 'max:20480'],
            'mentions' => ['nullable'],
            'reply_to_id' => ['nullable', 'integer'],
            'forwarded_from' => ['nullable'],
        ]);

        $body = trim((string) $request->input('body', ''));
        $hasFile = $request->hasFile('file') || $request->hasFile('files');

        if ($body === '' && ! $hasFile) {
            return response()->json([
                'message' => 'Message body or file attachment is required.',
                'errors' => ['body' => ['Message cannot be empty without an attachment.']],
            ], 422);
        }

        $user = $request->user();
        $tenantId = tenant('id') ?? $request->route('tenant');

        // Resolve the sender's role in this studio
        $member = null;
        try {
            $member = DB::connection(config('tenancy.database.central_connection', 'central'))
                ->table('studio_members')
                ->where('studio_id', $tenantId)
                ->where('user_id', $user->id)
                ->first();
        } catch (\Throwable $e) {
            // Fallback gracefully
        }

        $role = $member?->role ?? ($user->role === User::ROLE_ADMIN ? 'leader' : 'member');

        // Process file attachments (photos, documents, archives)
        $attachments = [];
        $uploadedFiles = [];
        if ($request->hasFile('file')) {
            $uploadedFiles[] = $request->file('file');
        }
        if ($request->hasFile('files')) {
            $files = $request->file('files');
            if (is_array($files)) {
                $uploadedFiles = array_merge($uploadedFiles, $files);
            }
        }

        foreach ($uploadedFiles as $uploaded) {
            if ($uploaded && $uploaded->isValid()) {
                $origName = $uploaded->getClientOriginalName();
                $ext = strtolower($uploaded->getClientOriginalExtension());
                $isImage = in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']);
                $filename = $uploaded->hashName();
                $savedPath = $uploaded->storeAs("channel_attachments/{$tenantId}", $filename, 'public');
                $url = "/studio/{$tenantId}/attachments/channel_attachments/{$tenantId}/{$filename}";

                $attachments[] = [
                    'url' => $url,
                    'name' => $origName,
                    'type' => $isImage ? 'image' : 'file',
                    'size' => $uploaded->getSize(),
                    'extension' => $ext,
                ];
            }
        }

        // Process mentions
        $mentions = [];
        $rawMentions = $request->input('mentions');
        if (is_array($rawMentions)) {
            $mentions = array_map('intval', $rawMentions);
        } elseif (is_string($rawMentions)) {
            $decoded = json_decode($rawMentions, true);
            if (is_array($decoded)) {
                $mentions = array_map('intval', $decoded);
            }
        }

        // Also auto-detect @mentions in body if not explicitly provided
        if (empty($mentions) && preg_match_all('/@([a-zA-Z0-9_\.\-]+)/', $body, $matches)) {
            $mentionedNames = array_unique($matches[1]);
            try {
                $matchedUserIds = User::whereIn('name', $mentionedNames)
                    ->orWhereIn('email', $mentionedNames)
                    ->pluck('id')
                    ->all();
                $mentions = array_map('intval', $matchedUserIds);
            } catch (\Throwable $e) {
                // Ignore mention lookup errors
            }
        }

        // Process reply context
        $replyToSnapshot = null;
        $replyToId = $request->input('reply_to_id');
        if ($replyToId) {
            $parentMsg = ChannelMessage::find((int) $replyToId);
            if ($parentMsg) {
                $snippet = $parentMsg->body ?: (! empty($parentMsg->attachments) ? '[Attachment/Photo]' : 'Message');
                $replyToSnapshot = [
                    'id' => $parentMsg->id,
                    'sender' => $parentMsg->sender_name,
                    'text' => Str::limit($snippet, 100),
                ];
            }
        }

        // Process forwarded context
        $forwardedFrom = null;
        if ($request->filled('forwarded_from')) {
            $rawFwd = $request->input('forwarded_from');
            $forwardedFrom = is_string($rawFwd) ? json_decode($rawFwd, true) : $rawFwd;
        }

        $message = ChannelMessage::create([
            'channel_id' => $channelId,
            'user_id' => $user->id,
            'sender_name' => $user->name,
            'sender_role' => ucfirst($role),
            'body' => $body,
            'attachments' => ! empty($attachments) ? $attachments : null,
            'mentions' => ! empty($mentions) ? array_values(array_unique($mentions)) : null,
            'reply_to_id' => $replyToId ? (int) $replyToId : null,
            'reply_to' => $replyToSnapshot,
            'forwarded_from' => $forwardedFrom,
        ]);

        // Attempt asynchronous/safe email alert to mentioned users or DM recipient
        $this->notifyRecipientsViaEmail($message, $channelId, $tenantId, $user);

        return response()->json([
            'message' => $this->format($message, $user),
        ], 201);
    }

    /**
     * Send an email copy of a message or notification directly to a recipient.
     *
     * POST /studio/{tenant}/channels/{channelId}/email
     */
    public function emailMessage(Request $request): JsonResponse
    {
        $channelId = (string) $request->route('channelId');

        $validated = $request->validate([
            'recipient_email' => ['required', 'email'],
            'message_text' => ['nullable', 'string', 'max:5000'],
            'message_id' => ['nullable', 'integer'],
        ]);

        $user = $request->user();
        $tenantId = tenant('id') ?? $request->route('tenant');
        $studio = Studio::find($tenantId);
        $studioName = $studio?->name ?? 'SprintStudio';

        $bodyText = $validated['message_text'] ?? '';
        $attachmentsData = [];

        if (! empty($validated['message_id'])) {
            $msg = ChannelMessage::where('channel_id', $channelId)->find($validated['message_id']);
            if ($msg) {
                $bodyText = $msg->body;
                $attachmentsData = $msg->attachments ?? [];
            }
        }

        if (empty($bodyText)) {
            $bodyText = "Notification from {$user->name} in #{$channelId}";
        }

        $channelTitle = str_starts_with($channelId, 'ch-')
            ? '#'.str_replace('ch-', '', $channelId)
            : 'Direct Chat';

        $inboxUrl = url("/studio/{$tenantId}/inbox");

        try {
            Mail::to($validated['recipient_email'])->send(
                new ChannelMessageNotificationMail(
                    senderName: $user->name,
                    channelTitle: $channelTitle,
                    bodyText: $bodyText,
                    studioName: $studioName,
                    inboxUrl: $inboxUrl,
                    attachmentsData: $attachmentsData
                )
            );

            return response()->json([
                'success' => true,
                'message' => "Email sent to {$validated['recipient_email']}.",
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send email: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Sends email alerts for DM recipients or mentioned users safely in the background.
     */
    private function notifyRecipientsViaEmail(ChannelMessage $message, string $channelId, ?string $tenantId, User $sender): void
    {
        try {
            $recipientIds = [];

            // If it's a DM (dm-userA_userB or dm-userA-userB), notify the other user
            if (str_starts_with($channelId, 'dm-')) {
                $parts = explode('_', str_replace(['dm-', '-'], ['dm_', '_'], $channelId));
                foreach ($parts as $part) {
                    if (is_numeric($part) && (int) $part !== (int) $sender->id) {
                        $recipientIds[] = (int) $part;
                    }
                }
            }

            // Include explicitly mentioned users
            if (! empty($message->mentions)) {
                foreach ($message->mentions as $mId) {
                    if ((int) $mId !== (int) $sender->id) {
                        $recipientIds[] = (int) $mId;
                    }
                }
            }

            $recipientIds = array_unique($recipientIds);

            if (! empty($recipientIds)) {
                $recipients = User::whereIn('id', $recipientIds)->whereNotNull('email')->get();
                $studio = $tenantId ? Studio::find($tenantId) : null;
                $studioName = $studio?->name ?? 'SprintStudio';
                $channelTitle = str_starts_with($channelId, 'ch-') ? '#'.str_replace('ch-', '', $channelId) : 'Direct Message';
                $inboxUrl = url("/studio/{$tenantId}/inbox");

                foreach ($recipients as $recipient) {
                    Mail::to($recipient->email)->queue(
                        new ChannelMessageNotificationMail(
                            senderName: $sender->name,
                            channelTitle: $channelTitle,
                            bodyText: $message->body ?: '[Attachment/Photo]',
                            studioName: $studioName,
                            inboxUrl: $inboxUrl,
                            attachmentsData: $message->attachments ?? []
                        )
                    );
                }
            }
        } catch (\Throwable $e) {
            // Email failure should never break real-time chat
        }
    }

    /**
     * Securely serve a tenant attachment file (photos, documents, etc.).
     *
     * GET /studio/{tenant}/attachments/{path}
     */
    public function downloadAttachment(Request $request, string $path): mixed
    {
        if (str_contains($path, '..') || str_contains($path, '\\')) {
            abort(403, 'Invalid path');
        }

        $fullPath = storage_path("app/public/{$path}");

        // Also check with channel_attachments prefix if needed
        if (! file_exists($fullPath)) {
            $altPath = storage_path("app/public/channel_attachments/{$path}");
            if (file_exists($altPath)) {
                $fullPath = $altPath;
            }
        }

        // Also check if stored in default storage/app/public in tests
        if (! file_exists($fullPath)) {
            $basePublic = base_path("storage/app/public/{$path}");
            if (file_exists($basePublic)) {
                $fullPath = $basePublic;
            }
        }

        if (! file_exists($fullPath)) {
            abort(404, 'Attachment not found');
        }

        $mime = mime_content_type($fullPath) ?: 'application/octet-stream';
        $headers = [
            'Content-Type' => $mime,
            'Content-Disposition' => str_starts_with($mime, 'image/') ? 'inline' : 'attachment',
            'Cache-Control' => 'public, max-age=86400',
        ];

        return response()->file($fullPath, $headers);
    }

    /**
     * Unsend (delete) a message with scope options:
     * - 'everyone': Permanently removes the message for all participants (author or admin only).
     * - 'for_me': Hides the message from the current user's feed only.
     *
     * DELETE /studio/{tenant}/channels/{channelId}/messages/{message}
     */
    public function destroy(Request $request): JsonResponse
    {
        $channelId = (string) $request->route('channelId');
        $messageId = (int) $request->route('message');
        $user = $request->user();
        $scope = (string) ($request->input('scope') ?: $request->query('scope', 'everyone'));

        $message = ChannelMessage::where('channel_id', $channelId)->find($messageId);
        if (! $message) {
            return response()->json(['message' => 'Message not found.'], 404);
        }

        if ($scope === 'for_me') {
            $deletedFor = $message->deleted_for_user_ids ?? [];
            if (! in_array((int) $user->id, array_map('intval', $deletedFor))) {
                $deletedFor[] = (int) $user->id;
                $message->update(['deleted_for_user_ids' => array_values(array_unique($deletedFor))]);
            }

            return response()->json([
                'success' => true,
                'deleted_id' => $messageId,
                'scope' => 'for_me',
                'message' => 'Message deleted for you.',
            ]);
        }

        $isAuthor = (int) $message->user_id === (int) $user->id;

        if (! $isAuthor) {
            return response()->json([
                'message' => 'You cannot unsend another user\'s message for everyone. You can only unsend it for yourself.',
            ], 403);
        }

        $message->update([
            'is_unsent' => true,
            'unsent_at' => now(),
            'unsent_by_user_id' => $user->id,
            'unsent_by_name' => $user->name,
            'body' => '',
            'attachments' => [],
            'mentions' => [],
            'reply_to' => null,
            'reply_to_id' => null,
            'is_pinned' => false,
            'pinned_at' => null,
            'pinned_by_user_id' => null,
            'forwarded_from' => null,
        ]);

        return response()->json([
            'success' => true,
            'deleted_id' => $messageId,
            'scope' => 'everyone',
            'message' => 'Message unsent for everyone.',
            'item' => $this->format($message->fresh(), $user),
        ]);
    }

    /**
     * Toggle pin status for a message.
     * Pinned messages are visible to all users in the channel.
     *
     * POST /studio/{tenant}/channels/{channelId}/messages/{message}/pin
     */
    public function togglePin(Request $request): JsonResponse
    {
        $channelId = (string) $request->route('channelId');
        $messageId = (int) $request->route('message');
        $user = $request->user();

        $message = ChannelMessage::where('channel_id', $channelId)->find($messageId);
        if (! $message || $message->is_unsent) {
            return response()->json(['message' => 'Message not found or has been unsent.'], 404);
        }

        $newPinned = ! $message->is_pinned;
        $message->update([
            'is_pinned' => $newPinned,
            'pinned_at' => $newPinned ? now() : null,
            'pinned_by_user_id' => $newPinned ? $user->id : null,
        ]);

        return response()->json([
            'success' => true,
            'is_pinned' => $newPinned,
            'message' => $this->format($message, $user),
        ]);
    }

    /**
     * Return all shared media (images), documents/files, links, and pinned messages sent in this channel.
     *
     * GET /studio/{tenant}/channels/{channelId}/assets
     */
    public function assets(Request $request): JsonResponse
    {
        $channelId = (string) $request->route('channelId');
        $user = $request->user();

        $messages = ChannelMessage::where('channel_id', $channelId)
            ->where('is_unsent', false)
            ->where(function ($q) use ($user) {
                if ($user) {
                    $q->whereNull('deleted_for_user_ids')
                        ->orWhereJsonDoesntContain('deleted_for_user_ids', (int) $user->id);
                }
            })
            ->orderBy('created_at', 'desc')
            ->limit(300)
            ->get();

        $media = [];
        $files = [];
        $links = [];
        $pinned = [];

        foreach ($messages as $msg) {
            $formatted = $this->format($msg, $user);

            if ($msg->is_pinned) {
                $pinned[] = $formatted;
            }

            if (! empty($formatted['attachments'])) {
                foreach ($formatted['attachments'] as $att) {
                    $item = array_merge($att, [
                        'message_id' => $msg->id,
                        'sender' => $msg->sender_name,
                        'created_at' => $msg->created_at?->format('M j, g:i A'),
                    ]);
                    if (($att['type'] ?? '') === 'image') {
                        $media[] = $item;
                    } else {
                        $files[] = $item;
                    }
                }
            }

            // Detect URLs in message body
            if ($msg->body && preg_match_all('/https?:\/\/[^\s<]+[^<.,:;"\')\]\s]/i', $msg->body, $matches)) {
                foreach (array_unique($matches[0]) as $url) {
                    $host = parse_url($url, PHP_URL_HOST) ?: 'link';
                    $links[] = [
                        'url' => $url,
                        'domain' => $host,
                        'message_id' => $msg->id,
                        'sender' => $msg->sender_name,
                        'text_snippet' => Str::limit($msg->body, 60),
                        'created_at' => $msg->created_at?->format('M j, g:i A'),
                    ];
                }
            }
        }

        return response()->json([
            'channel_id' => $channelId,
            'media' => $media,
            'files' => $files,
            'links' => $links,
            'pinned' => $pinned,
        ]);
    }

    /**
     * Return active channels with their unread counts & latest message previews for this user.
     * Also returns fresh message notification items.
     *
     * GET /studio/{tenant}/channels-activity
     */
    public function activity(Request $request): JsonResponse
    {
        $user = $request->user();

        // Load current user's read receipts per channel
        $userReads = collect();
        if (Schema::hasTable('channel_reads')) {
            $userReads = ChannelRead::where('user_id', $user->id)->get()->keyBy('channel_id');
        }

        // 1. Fetch channel messages from last 5 days not deleted for this user
        $recentMessages = ChannelMessage::where('created_at', '>=', now()->subDays(5))
            ->where(function ($q) use ($user) {
                $q->whereNull('deleted_for_user_ids')
                    ->orWhereJsonDoesntContain('deleted_for_user_ids', (int) $user->id);
            })
            ->orderBy('created_at', 'desc')
            ->limit(150)
            ->get();

        $activityByChannel = [];
        $unreadCounts = [];

        foreach ($recentMessages as $msg) {
            $ch = $msg->channel_id;

            // For DMs, check current user is a participant
            if (str_starts_with($ch, 'dm-')) {
                $isParticipant = str_contains($ch, "_{$user->id}") || str_contains($ch, "dm-{$user->id}_")
                    || str_contains($ch, "-{$user->id}") || str_contains($ch, "dm-{$user->id}-");
                if (! $isParticipant) {
                    continue;
                }
            }

            if (! isset($activityByChannel[$ch])) {
                $snippet = $msg->is_unsent
                    ? "{$msg->sender_name} unsent a message"
                    : Str::limit($msg->body ?: '[Attachment]', 60);

                $activityByChannel[$ch] = [
                    'latest_message' => [
                        'id' => $msg->id,
                        'sender' => $msg->sender_name,
                        'body' => $snippet,
                        'time' => $msg->created_at?->diffForHumans(),
                        'raw_time' => $msg->created_at?->toIso8601String(),
                        'is_unsent' => (bool) $msg->is_unsent,
                        'user_id' => $msg->user_id,
                    ],
                    'count' => 0,
                ];
            }

            // Only increment unread counts if message is from someone else, not unsent, and not yet marked as read
            if (! $msg->is_unsent && (int) $msg->user_id !== (int) $user->id) {
                $userRead = $userReads->get($ch);
                $isRead = false;
                if ($userRead) {
                    if ($userRead->last_read_message_id && $msg->id <= $userRead->last_read_message_id) {
                        $isRead = true;
                    } elseif ($userRead->last_read_at && $msg->created_at <= $userRead->last_read_at) {
                        $isRead = true;
                    }
                }

                if (! $isRead) {
                    $activityByChannel[$ch]['count']++;
                    $unreadCounts[$ch] = ($unreadCounts[$ch] ?? 0) + 1;
                }
            }
        }

        // 2. Fetch fresh notifications from TenantDashboardController
        $dashboardController = app(TenantDashboardController::class);
        $notifications = $dashboardController->getMessageNotifications($user);

        return response()->json([
            'unread_counts' => $unreadCounts,
            'activity' => $activityByChannel,
            'notifications' => $notifications,
        ]);
    }

    /**
     * Mark a channel or direct message thread as read by the current user.
     *
     * POST /studio/{tenant}/channels/{channelId}/read
     */
    public function markRead(Request $request, string $channelId): JsonResponse
    {
        $user = $request->user();
        $latestMessageId = null;

        if (Schema::hasTable('channel_reads')) {
            $latestMessageId = ChannelMessage::where('channel_id', $channelId)->max('id') ?? 0;

            ChannelRead::updateOrCreate(
                [
                    'channel_id' => $channelId,
                    'user_id' => $user->id,
                ],
                [
                    'last_read_message_id' => $latestMessageId,
                    'last_read_at' => now(),
                ]
            );
        }

        return response()->json([
            'success' => true,
            'channel_id' => $channelId,
            'last_read_message_id' => $latestMessageId,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function format(ChannelMessage $m, mixed $currentUser): array
    {
        $tenantId = tenant('id') ?? request()->route('tenant') ?? 'indiecraft-studios';
        $attachments = array_map(function ($att) use ($tenantId) {
            if (is_array($att) && isset($att['url'])) {
                // Normalize any legacy http://.../storage/ URLs into the tenant attachment route
                if (str_contains($att['url'], '/storage/channel_attachments/')) {
                    $parts = explode('/storage/', $att['url']);
                    $subPath = $parts[1] ?? '';
                    $att['url'] = "/studio/{$tenantId}/attachments/{$subPath}";
                }
            }

            return $att;
        }, $m->attachments ?? []);

        $isUnsent = (bool) $m->is_unsent;
        $isSelf = $currentUser && (int) $m->user_id === (int) $currentUser->id;

        $text = $m->body;
        if ($isUnsent) {
            $text = $isSelf
                ? 'You unsent a message'
                : ($m->sender_name ? "{$m->sender_name} unsent a message" : 'This message was unsent');
        }

        return [
            'id' => $m->id,
            'channel_id' => $m->channel_id,
            'user_id' => $m->user_id,
            'sender' => $m->sender_name,
            'role' => $m->sender_role ?? 'Member',
            'text' => $text,
            'is_unsent' => $isUnsent,
            'unsent_at' => $m->unsent_at?->toIso8601String(),
            'unsent_by_name' => $m->unsent_by_name,
            'attachments' => $isUnsent ? [] : $attachments,
            'mentions' => $isUnsent ? [] : ($m->mentions ?? []),
            'reply_to' => $isUnsent ? null : $m->reply_to,
            'reply_to_id' => $isUnsent ? null : $m->reply_to_id,
            'is_pinned' => $isUnsent ? false : (bool) $m->is_pinned,
            'pinned_at' => $isUnsent ? null : $m->pinned_at?->toIso8601String(),
            'forwarded_from' => $isUnsent ? null : $m->forwarded_from,
            'deleted_for_user_ids' => $m->deleted_for_user_ids ?? [],
            'time' => $m->created_at?->format('g:i A') ?? 'Just now',
            'isSelf' => $isSelf,
        ];
    }
}
