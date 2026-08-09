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

        // 1. Force Developer Profile (Passport Wizard) completion first
        $hasProfile = $user->globalProfile !== null;
        if (!$hasProfile) {
            return redirect()->route('onboarding.show');
        }

        // 2. Force Workspace connection (creating or joining a studio) second
        $belongsToStudio = $user->ownedStudios()->exists() || $user->joinedStudios()->exists();
        if (!$belongsToStudio) {
            return redirect()->route('onboarding.fork');
        }

        return $next($request);
    }
}
