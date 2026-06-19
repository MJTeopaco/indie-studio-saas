<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreGlobalProfileRequest;
use App\Models\Position;
use App\Models\Skill;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class OnboardingController extends Controller
{
    /**
     * Show the Fork in the road screen.
     */
    public function fork()
    {
        return Inertia::render('Onboarding/Fork');
    }

    /**
     * Show the Developer Onboarding Wizard.
     */
    public function show()
    {
        // Inject positions and skills (grouped by category)
        return Inertia::render('Onboarding/Wizard', [
            'positions' => Position::orderBy('name')->get(['id', 'name']),
            'skills'    => Skill::orderBy('category')->orderBy('name')
                ->get(['id', 'name', 'category'])
                ->groupBy('category'),
        ]);
    }

    /**
     * Store the developer profile.
     */
    public function store(StoreGlobalProfileRequest $request)
    {
        $user = $request->user();

        DB::transaction(function () use ($request, $user) {
            // 1. Create the global profile
            $profile = $user->globalProfile()->create([
                'position_id' => $request->position_id,
                'experience_years' => $request->experience_years,
                'open_to_invitations' => $request->open_to_invitations,
                'timezone' => $request->timezone,
                'max_hours_per_week' => $request->max_hours_per_week,
            ]);

            // 2. Attach the skills to the pivot table
            // We need to map the incoming skills array to the format sync() expects:
            // [ skill_id => ['proficiency_level' => X], ... ]
            $syncData = collect($request->skills)->mapWithKeys(function ($skill) {
                return [$skill['id'] => ['proficiency_level' => $skill['proficiency_level']]];
            })->toArray();

            $profile->skills()->sync($syncData);
        });

        return redirect()->route('dashboard');
    }
}
