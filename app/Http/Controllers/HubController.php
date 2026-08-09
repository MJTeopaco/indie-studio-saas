<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStudioRequest;
use App\Http\Requests\JoinStudioRequest;
use App\Models\Studio;
use App\Models\StudioInvitation;
use Illuminate\Http\Request;

class HubController extends Controller
{
    /**
     * Create a new Studio from the Hub.
     */
    public function createStudio(StoreStudioRequest $request)
    {
        $user = $request->user();

        // 1. Create the studio
        $studio = Studio::create([
            'name' => $request->studio_name,
            'owner_id' => $user->id,
        ]);

        // 2. Add to central members list
        $user->joinedStudios()->attach($studio->id, ['role' => 'owner']);

        // Redirect back to the Hub (Dashboard) so the new card appears.
        return redirect()->route('dashboard');
    }

    /**
     * Join an existing Studio using an invitation code from the Hub.
     */
    public function joinStudio(JoinStudioRequest $request)
    {
        $user = $request->user();

        // Find valid invitation
        $invitation = StudioInvitation::valid()->where('token', strtoupper($request->invitation_code))->first();

        if (!$invitation) {
            return back()->withErrors([
                'invitation_code' => 'Invalid or expired code.',
            ]);
        }

        $studio = Studio::findOrFail($invitation->studio_id);

        // Mark as used
        $invitation->markAsUsed();

        // Add to central members list
        $user->joinedStudios()->syncWithoutDetaching([
            $studio->id => ['role' => 'member']
        ]);

        // Redirect to the path-based tenant dashboard
        return redirect()->route('tenant.dashboard', ['tenant' => $studio->id]);
    }

    /**
     * Generate an invitation code for a Studio.
     */
    public function generateInvite(Studio $studio, Request $request)
    {
        // Ensure user is owner of the studio
        if ($studio->owner_id !== $request->user()->id) {
            abort(403);
        }

        // Generate a simple 8-character alphanumeric code
        $token = strtoupper(\Illuminate\Support\Str::random(8));

        $studio->invitations()->create([
            'token' => $token,
            'expires_at' => now()->addDays(7),
        ]);

        return response()->json(['code' => $token]);
    }
}
