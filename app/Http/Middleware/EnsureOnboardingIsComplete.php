<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureOnboardingIsComplete
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Condition 1: Have they completed the Developer Profile Wizard?
        $hasProfile = $user->globalProfile !== null;

        // Condition 2: Have they created a Studio instead?
        $ownsStudio = $user->ownedStudios()->exists(); 

        // If they have done NEITHER, trap them in the onboarding funnel.
        if (!$hasProfile && !$ownsStudio) {
            // Redirect them to the initial "Fork in the Road" screen
            return redirect()->route('onboarding.fork'); 
        }

        return $next($request);
    }
}
