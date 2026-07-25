<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * RoleMiddleware — restricts routes by user role.
 * Usage: ->middleware('role:teacher') or ->middleware('role:admin,teacher')
 */
class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): mixed
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, $roles)) {
            return response()->json(['message' => 'Access denied. Insufficient permissions.'], 403);
        }

        return $next($request);
    }
}
