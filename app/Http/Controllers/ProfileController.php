<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Models\LeaveRequest;
use App\Models\Position;
use App\Models\Skill;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form with skills, positions, and workspaces.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $user->checkAndResolveLeaveStatus();

        // Also check joined studios for expired leave
        DB::table('studio_members')
            ->where('user_id', $user->id)
            ->where('working_status', 'on_leave')
            ->whereNotNull('leave_end_date')
            ->where('leave_end_date', '<', now()->toDateString())
            ->update([
                'working_status' => 'active',
                'leave_start_date' => null,
                'leave_end_date' => null,
                'leave_request_status' => 'none',
                'updated_at' => now(),
            ]);

        $globalProfile = $user->globalProfile()
            ->with(['position', 'skills'])
            ->first();

        $pendingLeaveRequests = LeaveRequest::where('user_id', $user->id)
            ->where('status', 'pending')
            ->get()
            ->keyBy('studio_id');

        $joinedStudios = $user->joinedStudios()
            ->get(['tenants.id', 'tenants.name', 'tenants.owner_id'])
            ->map(function ($studio) use ($pendingLeaveRequests) {
                $pendingReq = $pendingLeaveRequests->get($studio->id);
                return [
                    'id' => $studio->id,
                    'name' => $studio->name,
                    'is_owner' => $studio->pivot->role === 'owner',
                    'role' => $studio->pivot->role ?? 'member',
                    'working_status' => $studio->pivot->working_status ?? 'active',
                    'leave_start_date' => $studio->pivot->leave_start_date,
                    'leave_end_date' => $studio->pivot->leave_end_date,
                    'leave_request_status' => $pendingReq ? 'pending' : ($studio->pivot->leave_request_status ?? 'none'),
                    'pending_leave_request' => $pendingReq ? [
                        'id' => $pendingReq->id,
                        'leave_start_date' => $pendingReq->leave_start_date ? $pendingReq->leave_start_date->format('Y-m-d') : null,
                        'leave_end_date' => $pendingReq->leave_end_date ? $pendingReq->leave_end_date->format('Y-m-d') : null,
                        'reason' => $pendingReq->reason,
                        'requester_role' => $pendingReq->requester_role,
                        'created_at' => $pendingReq->created_at ? $pendingReq->created_at->diffForHumans() : null,
                    ] : null,
                ];
            });

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => session('status'),
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'working_status' => $user->working_status ?? 'active',
                'leave_start_date' => $user->leave_start_date ? $user->leave_start_date->format('Y-m-d') : null,
                'leave_end_date' => $user->leave_end_date ? $user->leave_end_date->format('Y-m-d') : null,
                'role' => $user->role,
            ],
            'profile' => $globalProfile ? [
                'id' => $globalProfile->id,
                'position_id' => $globalProfile->position_id,
                'position_name' => $globalProfile->position?->name ?? 'Software Engineer',
                'experience_years' => $globalProfile->experience_years,
                'open_to_invitations' => $globalProfile->open_to_invitations,
                'skills' => $globalProfile->skills->map(function ($skill) {
                    return [
                        'id' => $skill->id,
                        'name' => $skill->name,
                        'category' => $skill->category,
                        'proficiency_level' => $skill->pivot->proficiency_level ?? 3,
                    ];
                }),
            ] : null,
            'positions' => Position::orderBy('name')->get(['id', 'name']),
            'availableSkills' => Skill::orderBy('category')->orderBy('name')
                ->get(['id', 'name', 'category'])
                ->groupBy('category'),
            'joinedStudios' => $joinedStudios,
        ]);
    }

    /**
     * Update the user's personal profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $user->fill($request->safe()->only(['name', 'email']));

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        if ($request->filled('position_id') && $user->globalProfile) {
            $user->globalProfile->update([
                'position_id' => $request->position_id,
            ]);
        }

        return Redirect::route('profile.edit')->with('status', 'profile-updated');
    }

    /**
     * Upload and update user avatar.
     */
    public function updateAvatar(Request $request): RedirectResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $user = $request->user();

        // Delete previous avatar file if stored locally
        if ($user->avatar && str_starts_with($user->avatar, '/storage/avatars/')) {
            $oldPath = str_replace('/storage/', '', $user->avatar);
            Storage::disk('public')->delete($oldPath);
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $user->avatar = Storage::url($path);
        $user->save();

        return Redirect::route('profile.edit')->with('status', 'avatar-updated');
    }

    /**
     * Remove user avatar.
     */
    public function destroyAvatar(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->avatar && str_starts_with($user->avatar, '/storage/avatars/')) {
            $oldPath = str_replace('/storage/', '', $user->avatar);
            Storage::disk('public')->delete($oldPath);
        }

        $user->avatar = null;
        $user->save();

        return Redirect::route('profile.edit')->with('status', 'avatar-removed');
    }

    /**
     * Update developer skill matrix.
     */
    public function updateSkills(Request $request): RedirectResponse
    {
        $request->validate([
            'skills' => ['required', 'array'],
            'skills.*.id' => ['required', 'exists:skills,id'],
            'skills.*.proficiency_level' => ['required', 'integer', 'between:1,5'],
        ]);

        $user = $request->user();
        $profile = $user->globalProfile;

        if ($profile) {
            $syncData = collect($request->skills)->mapWithKeys(function ($skill) {
                return [$skill['id'] => ['proficiency_level' => $skill['proficiency_level']]];
            })->toArray();

            $profile->skills()->sync($syncData);
        }

        return Redirect::route('profile.edit')->with('status', 'skills-updated');
    }

    /**
     * Update user working status (active, on_leave, emergency) globally or per studio.
     * Enforces governance:
     * - Member: 'On Leave' is subject to approval by Team Leader or Studio Owner.
     * - Team Leader: 'On Leave' is subject to approval by Studio Owner ONLY.
     * - Studio Owner: Applies immediately.
     */
    public function updateWorkingStatus(Request $request): RedirectResponse
    {
        $request->validate([
            'status' => ['required', 'string', 'in:active,on_leave,emergency'],
            'scope' => ['required', 'string', 'in:all,specific'],
            'studio_id' => ['nullable', 'string', 'required_if:scope,specific'],
            'leave_start_date' => ['nullable', 'date'],
            'leave_end_date' => ['nullable', 'date', 'after_or_equal:leave_start_date'],
            'leave_reason' => ['nullable', 'string', 'max:500'],
        ]);

        $user = $request->user();
        $status = $request->status;
        $leaveStart = $status === 'on_leave' ? ($request->leave_start_date ?: now()->toDateString()) : null;
        $leaveEnd = $status === 'on_leave' ? $request->leave_end_date : null;
        $leaveReason = $request->leave_reason;

        if ($request->scope === 'specific') {
            $member = DB::table('studio_members')
                ->where('user_id', $user->id)
                ->where('studio_id', $request->studio_id)
                ->first();

            if (! $member) {
                return back()->withErrors(['studio_id' => 'You are not a member of this studio.']);
            }

            $role = $member->role ?? 'member';
            $isOwner = $role === 'owner';
            $isLeader = in_array($role, ['leader', 'manager']);

            if ($status === 'on_leave') {
                if ($isOwner) {
                    // Owner direct update: no approval required
                    LeaveRequest::where('user_id', $user->id)
                        ->where('studio_id', $request->studio_id)
                        ->where('status', 'pending')
                        ->update(['status' => 'cancelled']);

                    DB::table('studio_members')
                        ->where('user_id', $user->id)
                        ->where('studio_id', $request->studio_id)
                        ->update([
                            'working_status' => 'on_leave',
                            'leave_start_date' => $leaveStart,
                            'leave_end_date' => $leaveEnd,
                            'leave_request_status' => 'none',
                            'updated_at' => now(),
                        ]);

                    $user->working_status = 'on_leave';
                    $user->leave_start_date = $leaveStart;
                    $user->leave_end_date = $leaveEnd;
                    $user->save();

                    return Redirect::route('profile.edit')->with('status', 'working-status-updated:Working status updated to On Leave.');
                }

                // Member or Leader: submit leave request for approval
                LeaveRequest::where('user_id', $user->id)
                    ->where('studio_id', $request->studio_id)
                    ->where('status', 'pending')
                    ->update(['status' => 'cancelled']);

                LeaveRequest::create([
                    'studio_id' => $request->studio_id,
                    'user_id' => $user->id,
                    'requester_role' => $isLeader ? 'leader' : 'member',
                    'leave_start_date' => $leaveStart,
                    'leave_end_date' => $leaveEnd,
                    'reason' => $leaveReason,
                    'status' => 'pending',
                ]);

                DB::table('studio_members')
                    ->where('user_id', $user->id)
                    ->where('studio_id', $request->studio_id)
                    ->update([
                        'leave_request_status' => 'pending',
                        'updated_at' => now(),
                    ]);

                $approverText = $isLeader ? 'Studio Owner' : 'Team Lead or Studio Owner';

                return Redirect::route('profile.edit')->with('status', "leave-request-submitted:Your leave request has been submitted for approval by your {$approverText}.");
            }

            // Status is active or emergency: direct update, cancel any pending requests
            LeaveRequest::where('user_id', $user->id)
                ->where('studio_id', $request->studio_id)
                ->where('status', 'pending')
                ->update(['status' => 'cancelled']);

            DB::table('studio_members')
                ->where('user_id', $user->id)
                ->where('studio_id', $request->studio_id)
                ->update([
                    'working_status' => $status,
                    'leave_start_date' => null,
                    'leave_end_date' => null,
                    'leave_request_status' => 'none',
                    'updated_at' => now(),
                ]);

            $user->working_status = $status;
            $user->leave_start_date = null;
            $user->leave_end_date = null;
            $user->save();

            return Redirect::route('profile.edit')->with('status', 'working-status-updated:Working status updated successfully.');
        }

        // Scope: ALL workspaces
        $joined = DB::table('studio_members')
            ->where('user_id', $user->id)
            ->get();

        $submittedForApprovalCount = 0;
        $directUpdatedCount = 0;

        foreach ($joined as $membership) {
            $role = $membership->role ?? 'member';
            $isOwner = $role === 'owner';
            $isLeader = in_array($role, ['leader', 'manager']);

            if ($status === 'on_leave') {
                if ($isOwner) {
                    LeaveRequest::where('user_id', $user->id)
                        ->where('studio_id', $membership->studio_id)
                        ->where('status', 'pending')
                        ->update(['status' => 'cancelled']);

                    DB::table('studio_members')
                        ->where('id', $membership->id)
                        ->update([
                            'working_status' => 'on_leave',
                            'leave_start_date' => $leaveStart,
                            'leave_end_date' => $leaveEnd,
                            'leave_request_status' => 'none',
                            'updated_at' => now(),
                        ]);
                    $directUpdatedCount++;
                } else {
                    LeaveRequest::where('user_id', $user->id)
                        ->where('studio_id', $membership->studio_id)
                        ->where('status', 'pending')
                        ->update(['status' => 'cancelled']);

                    LeaveRequest::create([
                        'studio_id' => $membership->studio_id,
                        'user_id' => $user->id,
                        'requester_role' => $isLeader ? 'leader' : 'member',
                        'leave_start_date' => $leaveStart,
                        'leave_end_date' => $leaveEnd,
                        'reason' => $leaveReason,
                        'status' => 'pending',
                    ]);

                    DB::table('studio_members')
                        ->where('id', $membership->id)
                        ->update([
                            'leave_request_status' => 'pending',
                            'updated_at' => now(),
                        ]);
                    $submittedForApprovalCount++;
                }
            } else {
                LeaveRequest::where('user_id', $user->id)
                    ->where('studio_id', $membership->studio_id)
                    ->where('status', 'pending')
                    ->update(['status' => 'cancelled']);

                DB::table('studio_members')
                    ->where('id', $membership->id)
                    ->update([
                        'working_status' => $status,
                        'leave_start_date' => null,
                        'leave_end_date' => null,
                        'leave_request_status' => 'none',
                        'updated_at' => now(),
                    ]);
                $directUpdatedCount++;
            }
        }

        if ($status !== 'on_leave' || $directUpdatedCount > 0) {
            $user->working_status = $status;
            $user->leave_start_date = $status === 'on_leave' ? $leaveStart : null;
            $user->leave_end_date = $status === 'on_leave' ? $leaveEnd : null;
            $user->save();
        }

        if ($submittedForApprovalCount > 0) {
            return Redirect::route('profile.edit')->with(
                'status',
                "leave-request-submitted:Leave request submitted for approval across {$submittedForApprovalCount} workspace(s)."
            );
        }

        return Redirect::route('profile.edit')->with('status', 'working-status-updated:Working status updated across all workspaces.');
    }

    /**
     * Cancel an active pending leave request.
     */
    public function cancelLeaveRequest(Request $request, int $id): RedirectResponse
    {
        $leaveReq = LeaveRequest::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->where('status', 'pending')
            ->firstOrFail();

        $leaveReq->update(['status' => 'cancelled']);

        DB::table('studio_members')
            ->where('user_id', $request->user()->id)
            ->where('studio_id', $leaveReq->studio_id)
            ->update([
                'leave_request_status' => 'none',
                'updated_at' => now(),
            ]);

        return Redirect::route('profile.edit')->with('status', 'leave-request-cancelled:Leave request has been withdrawn.');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
