<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Domains\Core\Models\UserSession;
use App\Domains\Core\Enums\UserSessionStatus;
use App\Domains\Core\Services\FingerprintScorer;
use App\Domains\Core\Services\SessionSecurityService;
use App\Domains\Settings\Models\Setting;
use Illuminate\Support\Facades\Log;

class ValidateSessionBinding
{
    public function __construct(
        protected FingerprintScorer $scorer,
        protected SessionSecurityService $securityService
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (!$user) {
            return $next($request);
        }

        // 1. Authenticate Token / Session Key
        $token = $request->bearerToken();
        if (!$token && $request->hasHeader('Authorization')) {
            $token = str_replace('Bearer ', '', $request->header('Authorization'));
        }

        if (!$token) {
            return $next($request);
        }

        $sessionHash = hash('sha256', $token);

        // 2. Session Exists
        $session = UserSession::where('user_id', $user->id)
            ->where('session_hash', $sessionHash)
            ->first();

        if (!$session) {
            // Re-check by device_id if active session exists
            $deviceId = $request->header('X-Device-ID');
            if ($deviceId) {
                $session = UserSession::where('user_id', $user->id)
                    ->where('device_id', $deviceId)
                    ->where('status', UserSessionStatus::ACTIVE->value)
                    ->first();
            }
        }

        if (!$session) {
            Log::warning("[Security] Session not found for token hash. User: {$user->id}");
            return $this->unauthorizedResponse();
        }

        // 3. Status Must Be ACTIVE
        if ($session->status !== UserSessionStatus::ACTIVE) {
            Log::warning("[Security] Session status is not ACTIVE. User: {$user->id}");
            return $this->unauthorizedResponse();
        }

        // 4. Session Version Check
        if ($session->created_at && $user->password_changed_at && $session->created_at->lt($user->password_changed_at)) {
            Log::warning("[Security] Session created before password change. User: {$user->id}");
            $session->update(['status' => UserSessionStatus::REVOKED->value, 'revoked_at' => now()]);
            return $this->unauthorizedResponse();
        }

        // 5. Force Logout Check
        if ($user->force_logout_at && $session->created_at && $session->created_at->lt($user->force_logout_at)) {
            Log::warning("[Security] Session created before force logout. User: {$user->id}");
            $session->update(['status' => UserSessionStatus::REVOKED->value, 'revoked_at' => now()]);
            return $this->unauthorizedResponse();
        }

        // 6. Timeout Check (Idle & Absolute)
        if ($session->isExpired()) {
            Log::warning("[Security] Session is expired. User: {$user->id}");
            $session->update(['status' => UserSessionStatus::EXPIRED->value]);
            return $this->unauthorizedResponse();
        }

        // 7. Device ID Match
        $incomingDeviceId = $request->header('X-Device-ID');
        if ($incomingDeviceId && $session->device_id !== $incomingDeviceId) {
            $session->update(['status' => UserSessionStatus::COMPROMISED->value, 'revoked_at' => now()]);
            Log::warning("[Security] Device ID Mismatch for User ID {$user->id}. Expected {$session->device_id}, got {$incomingDeviceId}");
            return $this->unauthorizedResponse();
        }

        // 8. Fingerprint Score Calculation
        $incomingFingerprint = $request->header('X-Browser-Fingerprint');
        if ($incomingFingerprint && $session->fingerprint_hash) {
            $incomingHash = hash('sha256', $incomingFingerprint);
            if ($incomingHash !== $session->fingerprint_hash) {
                $incomingDetails = $this->securityService->parseUserAgent($request->userAgent() ?? '');
                $incomingDetails['timezone'] = $request->header('X-Timezone');
                $incomingDetails['language'] = $request->header('X-Language');

                $storedDetails = [
                    'browser'          => $session->browser,
                    'browser_version'  => $session->browser_version,
                    'operating_system' => $session->operating_system,
                    'platform'         => $session->platform,
                    'user_agent'       => $session->user_agent,
                ];

                $score = $this->scorer->calculateScore($storedDetails, $incomingDetails);
                if (!$this->scorer->isAcceptable($score, 70)) {
                    $session->update([
                        'status'                  => UserSessionStatus::COMPROMISED->value,
                        'failed_validation_count' => $session->failed_validation_count + 1,
                        'revoked_at'              => now(),
                    ]);
                    Log::warning("[Security] Fingerprint match failed with score {$score}% for User ID {$user->id}");
                    return $this->unauthorizedResponse();
                }
            }
        }

        // 9. Risk Engine Evaluation
        $ip = $request->ip() ?? '127.0.0.1';
        if ($session->ip_address && $session->ip_address !== $ip) {
            $session->update([
                'last_activity_ip' => $ip,
                'risk_score'       => min(100, $session->risk_score + 10),
            ]);
        }

        // 10. Touch Last Activity
        $idleMinutes = (int) Setting::get('session_idle_timeout_minutes', 120);
        $session->update([
            'last_activity_at'   => now(),
            'last_request_at'    => now(),
            'last_activity_ip'   => $ip,
            'request_count'      => $session->request_count + 1,
            'expires_at'         => now()->addMinutes($idleMinutes),
        ]);

        // 11. Continue to Controller
        return $next($request);
    }

    protected function unauthorizedResponse(): Response
    {
        return response()->json([
            'success' => false,
            'message' => 'Session validation failed. Please sign in again.',
        ], 401);
    }
}
