<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureMlEngineSecret
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $secret = env('ML_ENGINE_SECRET');

        if (! $secret || $request->header('X-ML-Engine-Secret') !== $secret) {
            return response()->json(['message' => 'Unauthorized ML Engine request'], 401);
        }

        return $next($request);
    }
}
