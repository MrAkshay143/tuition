<?php

namespace App\Http\Middleware;

use App\Domains\Core\Models\UserSession;
use Closure;
use Illuminate\Http\Request;

// Update user active timestamp and IP address on authenticated requests
class UpdateLastActive
{
    public function handle(Request $request, Closure $next): mixed
    {
        $response = $next($request);

        try {
            if ($user = $request->user()) {
                $deviceId = $request->header('X-Device-ID');
                if ($deviceId) {
                    UserSession::where('user_id', $user->id)
                        ->where('device_id', $deviceId)
                        ->update([
                            'last_activity_at' => now(),
                            'last_activity_ip' => $request->ip(),
                        ]);
                } else {
                    UserSession::where('user_id', $user->id)
                        ->active()
                        ->update([
                            'last_activity_at' => now(),
                            'last_activity_ip' => $request->ip(),
                        ]);
                }
            }
        } catch (\Throwable $e) {
            // Silently swallow session activity update exceptions to guarantee zero API disruptions
        }

        return $response;
    }
}
