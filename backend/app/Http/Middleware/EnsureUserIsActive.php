<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

// Reject disabled user accounts with 403 response
class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): mixed
    {
        if ($request->user() && !$request->user()->active) {
            return response()->json(['message' => 'Your account has been disabled. Contact admin.'], 403);
        }

        return $next($request);
    }
}
