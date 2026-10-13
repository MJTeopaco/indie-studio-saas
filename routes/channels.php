<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

/**
 * Workspace / Studio-wide private channel for live notifications, presence, and task updates.
 */
Broadcast::channel('studio.{studioId}', function (User $user, string $studioId) {
    if ($user->role === User::ROLE_ADMIN) {
        return true;
    }

    return $user->ownedStudios()->where('id', $studioId)->exists()
        || $user->joinedStudios()->where('studio_id', $studioId)->exists();
});

/**
 * Channel-specific private channel for real-time chat messages, pin updates, and deletions.
 */
Broadcast::channel('studio.{studioId}.channel.{channelId}', function (User $user, string $studioId, string $channelId) {
    if ($user->role === User::ROLE_ADMIN) {
        return true;
    }

    return $user->ownedStudios()->where('id', $studioId)->exists()
        || $user->joinedStudios()->where('studio_id', $studioId)->exists();
});
