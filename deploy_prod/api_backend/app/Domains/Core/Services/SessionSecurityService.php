<?php

namespace App\Domains\Core\Services;

use App\Domains\Core\Models\User;
use App\Domains\Core\Models\UserSession;
use App\Domains\Core\Enums\UserSessionStatus;
use App\Domains\Settings\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SessionSecurityService
{
    public function __construct(
        protected FingerprintScorer $scorer,
        protected ImpossibleTravelService $travelService,
        protected ConcurrentSessionService $concurrentService
    ) {}

    /**
     * Bind session on user login or token generation.
     */
    public function bindSession(User $user, Request $request, string $plainToken): UserSession
    {
        $deviceId = $request->header('X-Device-ID', (string) Str::uuid());
        $fingerprint = $request->header('X-Browser-Fingerprint');
        $timezone = $request->header('X-Timezone', 'UTC');
        $language = $request->header('X-Language', 'en');
        $appVersion = $request->header('X-App-Version', '1.0.0');

        $userAgent = $request->userAgent() ?? '';
        $ip = $request->ip() ?? '127.0.0.1';

        $browserDetails = $this->parseUserAgent($userAgent);
        $fingerprintHash = $fingerprint ? hash('sha256', $fingerprint) : null;
        $sessionHash = hash('sha256', $plainToken);

        $idleMinutes = (int) Setting::get('session_idle_timeout_minutes', 120);
        $absoluteDays = (int) Setting::get('session_absolute_timeout_days', 30);

        $isNewDevice = UserSession::where('user_id', $user->id)->where('device_id', $deviceId)->doesntExist();

        // Deactivate existing session on same device if present
        UserSession::where('user_id', $user->id)
            ->where('device_id', $deviceId)
            ->where('status', UserSessionStatus::ACTIVE->value)
            ->update([
                'status'     => UserSessionStatus::REVOKED->value,
                'revoked_at' => now(),
            ]);

        $session = UserSession::create([
            'uuid'                 => (string) Str::uuid(),
            'user_id'              => $user->id,
            'session_hash'         => $sessionHash,
            'device_id'            => $deviceId,
            'device_name'          => $browserDetails['device_name'],
            'device_type'          => $browserDetails['device_type'],
            'login_source'         => $request->header('X-Login-Source', 'web'),
            'browser'              => $browserDetails['browser'],
            'browser_version'      => $browserDetails['browser_version'],
            'operating_system'     => $browserDetails['os'],
            'os_version'           => $browserDetails['os_version'],
            'platform'             => $browserDetails['platform'],
            'fingerprint_hash'     => $fingerprintHash,
            'user_agent'           => $userAgent,
            'ip_address'           => $ip,
            'last_activity_ip'     => $ip,
            'status'               => UserSessionStatus::ACTIVE->value,
            'risk_score'           => 0,
            'risk_level'           => 'low',
            'login_at'             => now(),
            'last_activity_at'     => now(),
            'last_request_at'      => now(),
            'last_validation_at'   => now(),
            'expires_at'           => now()->addMinutes($idleMinutes),
            'absolute_expires_at'  => now()->addDays($absoluteDays),
            'remember_device_until'=> $request->boolean('remember_me') ? now()->addDays(30) : null,
        ]);

        if ($isNewDevice) {
            try {
                \App\Models\Notification::create([
                    'user_id' => $user->id,
                    'title'   => 'New Device Login Detected',
                    'body'    => "Your account was logged in from {$browserDetails['device_name']} (IP: {$ip}). If this wasn't you, please revoke the session immediately.",
                    'type'    => 'security',
                    'data'    => ['device_id' => $deviceId, 'ip' => $ip, 'browser' => $browserDetails['device_name']],
                ]);
            } catch (\Throwable $e) {
                // Ignore if notification table schema varies
            }
        }

        return $session;
    }

    /**
     * Parse User-Agent string to extract device metadata.
     */
    public function parseUserAgent(string $ua): array
    {
        $browser = 'Unknown Browser';
        $browserVersion = '1.0';
        $os = 'Unknown OS';
        $osVersion = '1.0';
        $platform = 'Desktop';
        $deviceType = 'desktop';

        if (preg_match('/(tablet|ipad|playbook)|(android(?!.*mobile))/i', $ua)) {
            $deviceType = 'tablet';
            $platform = 'Tablet';
        } elseif (preg_match('/(android|bb\d+|meego).+mobile|iphone|ipod|blackberry|iemobile|opera mini/i', $ua)) {
            $deviceType = 'mobile';
            $platform = 'Mobile';
        }

        if (preg_match('/Chrome\/([0-9\.]+)/i', $ua, $m)) {
            $browser = 'Chrome';
            $browserVersion = $m[1];
        } elseif (preg_match('/Firefox\/([0-9\.]+)/i', $ua, $m)) {
            $browser = 'Firefox';
            $browserVersion = $m[1];
        } elseif (preg_match('/Safari\/([0-9\.]+)/i', $ua, $m) && !str_contains($ua, 'Chrome')) {
            $browser = 'Safari';
            $browserVersion = $m[1];
        } elseif (preg_match('/Edg\/([0-9\.]+)/i', $ua, $m)) {
            $browser = 'Edge';
            $browserVersion = $m[1];
        }

        if (preg_match('/Windows NT ([0-9\.]+)/i', $ua, $m)) {
            $os = 'Windows';
            $osVersion = $m[1];
        } elseif (preg_match('/Mac OS X ([0-9_\.]+)/i', $ua, $m)) {
            $os = 'macOS';
            $osVersion = str_replace('_', '.', $m[1]);
        } elseif (preg_match('/Android ([0-9\.]+)/i', $ua, $m)) {
            $os = 'Android';
            $osVersion = $m[1];
        } elseif (preg_match('/CPU (iPhone )?OS ([0-9_\.]+) like Mac OS X/i', $ua, $m)) {
            $os = 'iOS';
            $osVersion = str_replace('_', '.', $m[2]);
        } elseif (preg_match('/Linux/i', $ua)) {
            $os = 'Linux';
        }

        $deviceName = "{$browser} on {$os}";

        return [
            'browser'         => $browser,
            'browser_version' => $browserVersion,
            'os'              => $os,
            'os_version'      => $osVersion,
            'platform'        => $platform,
            'device_type'     => $deviceType,
            'device_name'     => $deviceName,
        ];
    }
}
