<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Setting;

class SecurityEnforcementMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // 1. IP Blocking Enforcement
        $blockedIpsSetting = Setting::get('blocked_ips', '');
        if (!empty($blockedIpsSetting)) {
            $blockedIps = array_filter(array_map('trim', explode(',', $blockedIpsSetting)));
            
            // Check if request IP is in the blocked list
            if (in_array($request->ip(), $blockedIps)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access Denied: Your IP address has been blocked due to suspicious activity.',
                    'errors' => 'IpBlocked'
                ], 403);
            }
        }

        // 2. Global Password Reset Enforcement
        $forceResetSince = Setting::get('force_password_reset_since');
        if ($forceResetSince) {
            $since = \Carbon\Carbon::parse($forceResetSince);
            $user = $request->user();
            $path = $request->path();
            
            // Allow access to auth routes so users can actually reset passwords
            $isAuthRoute = str_contains($path, 'login') 
                        || str_contains($path, 'logout') 
                        || str_contains($path, 'password') 
                        || str_contains($path, 'reset');

            if (!$isAuthRoute && $user && !$user->hasRole('admin')) {
                $changedAt = $user->password_changed_at;
                if (!$changedAt || \Carbon\Carbon::parse($changedAt)->lt($since)) {
                    $token = \Illuminate\Support\Facades\Cache::lock('lock_reset_token_' . $user->id, 10)->block(5, function () use ($user) {
                        $cacheKey = 'reset_token_' . $user->id;
                        $cachedToken = \Illuminate\Support\Facades\Cache::get($cacheKey);
                        if (!$cachedToken) {
                            $cachedToken = \Illuminate\Support\Facades\Password::broker()->createToken($user);
                            \Illuminate\Support\Facades\Cache::put($cacheKey, $cachedToken, 60 * 60); // Cache for 60 minutes
                        }
                        return $cachedToken;
                    });

                    return response()->json([
                        'success' => false,
                        'message' => 'Security Alert: A global security policy requires you to reset your password.',
                        'errors' => 'PasswordResetRequired',
                        'reset_token' => $token,
                        'email' => $user->email,
                    ], 403);
                }
            }
        }

        return $next($request);
    }
}
