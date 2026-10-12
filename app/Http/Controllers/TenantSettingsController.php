<?php

namespace App\Http\Controllers;

use App\Models\Studio;
use App\Models\StudioInvitation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class TenantSettingsController extends Controller
{
    /**
     * Display the Studio Settings view with studio details, members, and invite codes.
     */
    public function index(Request $request): Response
    {
        $tenantId = tenant('id');
        $studio = Studio::with(['owner', 'users'])->find($tenantId);

        $currentUser = $request->user();
        $isOwner = $studio ? $studio->owner_id === $currentUser->id : false;

        $currentMembership = $studio ? $studio->users->firstWhere('id', $currentUser->id) : null;
        $currentUserRole = $isOwner ? 'owner' : ($currentMembership->pivot->role ?? 'member');
        $canManage = in_array($currentUserRole, ['owner', 'leader', 'manager']);

        $members = collect();
        if ($studio && $studio->users) {
            $members = $studio->users->map(function ($u) use ($studio) {
                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'avatar' => $u->avatar,
                    'role' => $u->id === $studio->owner_id ? 'owner' : ($u->pivot->role ?? 'member'),
                    'working_status' => $u->pivot->working_status ?? $u->working_status ?? 'active',
                    'joined_at' => $u->pivot->created_at ? $u->pivot->created_at->diffForHumans() : 'Active',
                ];
            });
        }

        $invitations = collect();
        if ($studio) {
            $invitations = $studio->invitations()
                ->latest()
                ->take(10)
                ->get()
                ->map(function ($inv) {
                    $isUsed = !is_null($inv->used_at);
                    $isExpired = $inv->expires_at ? $inv->expires_at->isPast() : false;
                    return [
                        'id' => $inv->id,
                        'token' => $inv->token,
                        'expires_at' => $inv->expires_at ? $inv->expires_at->format('M d, Y') : null,
                        'is_expired' => $isExpired,
                        'is_used' => $isUsed,
                        'status' => $isUsed ? 'Used' : ($isExpired ? 'Expired' : 'Active'),
                        'created_at' => $inv->created_at ? $inv->created_at->diffForHumans() : null,
                    ];
                });
        }

        return Inertia::render('Tenant/Settings', [
            'studio' => [
                'id' => $studio->id,
                'name' => $studio->name,
                'owner' => $studio->owner ? [
                    'id' => $studio->owner->id,
                    'name' => $studio->owner->name,
                    'email' => $studio->owner->email,
                ] : null,
                'created_at' => $studio->created_at ? $studio->created_at->format('M d, Y') : null,
            ],
            'members' => $members,
            'invitations' => $invitations,
            'canManage' => $canManage,
            'isOwner' => $isOwner,
            'currentUserRole' => $currentUserRole,
        ]);
    }

    /**
     * Generate a new 8-character invitation code for this studio.
     */
    public function generateInvite(Request $request): RedirectResponse
    {
        $tenantId = tenant('id');
        $studio = Studio::findOrFail($tenantId);

        $currentUser = $request->user();
        $isOwner = $studio->owner_id === $currentUser->id;
        $currentMembership = $studio->users()->where('user_id', $currentUser->id)->first();
        $isLeader = $currentMembership && in_array($currentMembership->pivot->role, ['leader', 'manager']);

        if (! $isOwner && ! $isLeader) {
            abort(403, 'Unauthorized to generate invitation codes for this studio.');
        }

        $token = strtoupper(Str::random(8));

        $studio->invitations()->create([
            'token' => $token,
            'expires_at' => now()->addDays(7),
        ]);

        return back()->with('success', "New invite code {$token} generated successfully.");
    }

    /**
     * Update studio details (name).
     */
    public function update(Request $request): RedirectResponse
    {
        $tenantId = tenant('id');
        $studio = Studio::findOrFail($tenantId);

        if ($studio->owner_id !== $request->user()->id) {
            abort(403, 'Only the Studio Owner can update workspace settings.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100',
        ]);

        $studio->update([
            'name' => $validated['name'],
        ]);

        return back()->with('success', 'Studio details updated successfully.');
    }
}
