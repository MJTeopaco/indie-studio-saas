<?php

namespace App\Http\Controllers;

use App\Models\Tenant\AiChatSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Str;

class AiChatSessionController extends Controller
{
    /**
     * Display a listing of the user's chat sessions.
     */
    public function index(): JsonResponse
    {
        $sessions = AiChatSession::where('user_id', auth()->id())
            ->orderBy('updated_at', 'desc')
            ->limit(50)
            ->get(['id', 'title', 'updated_at']); // No messages in list response

        return response()->json($sessions);
    }

    /**
     * Store a newly created chat session.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'nullable|string|max:255',
            'messages' => 'nullable|array',
        ]);

        $session = AiChatSession::create([
            'id'       => (string) Str::uuid(), // explicit; booted() is the fallback
            'user_id'  => auth()->id(),
            'title'    => $request->input('title', 'New Chat'),
            'messages' => $request->input('messages', []),
        ]);

        return response()->json($session, 201);
    }

    /**
     * Display the specified chat session.
     */
    public function show($chatSessionId): JsonResponse
    {
        $chatSession = AiChatSession::findOrFail($chatSessionId);
        abort_unless(auth()->id() == $chatSession->user_id, 403, 'Unauthorized access to chat session.');

        return response()->json($chatSession);
    }

    /**
     * Update the specified chat session.
     */
    public function update(Request $request, $chatSessionId): JsonResponse
    {
        $chatSession = AiChatSession::findOrFail($chatSessionId);
        abort_unless(auth()->id() == $chatSession->user_id, 403, 'Unauthorized access to chat session.');

        $request->validate([
            'title' => 'nullable|string|max:255',
            'messages' => 'nullable|array',
        ]);

        if ($request->has('title')) {
            $chatSession->title = $request->input('title');
        }
        
        if ($request->has('messages')) {
            $chatSession->messages = $request->input('messages');
        }

        $chatSession->save();

        return response()->json($chatSession);
    }

    /**
     * Remove the specified chat session from storage.
     */
    public function destroy($chatSessionId): Response
    {
        $chatSession = AiChatSession::findOrFail($chatSessionId);
        abort_unless(auth()->id() == $chatSession->user_id, 403, 'Unauthorized access to chat session.');

        $chatSession->delete();

        return response()->noContent();
    }
}
