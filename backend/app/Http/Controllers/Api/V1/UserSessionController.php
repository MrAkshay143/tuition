<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\ApiController;
use App\Domains\Core\Models\UserSession;
use App\Domains\Core\Enums\UserSessionStatus;
use App\Domains\Core\Services\ConcurrentSessionService;
use Illuminate\Http\Request;

class UserSessionController extends ApiController
{
    /**
     * GET /api/v1/sessions
     * List active sessions for authenticated user.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $currentDeviceId = $request->header('X-Device-ID');

        $sessions = UserSession::where('user_id', $user->id)
            ->active()
            ->orderBy('last_activity_at', 'desc')
            ->get()
            ->map(function ($s) use ($currentDeviceId) {
                return [
                    'id'            => $s->id,
                    'uuid'          => $s->uuid,
                    'device_name'   => $s->device_name,
                    'device_type'   => $s->device_type,
                    'browser'       => $s->browser,
                    'operating_system' => $s->operating_system,
                    'platform'      => $s->platform,
                    'ip_address'    => $s->ip_address,
                    'last_activity_ip' => $s->last_activity_ip,
                    'country'       => $s->country,
                    'city'          => $s->city,
                    'status'        => $s->status->value,
                    'is_current'    => $currentDeviceId && $s->device_id === $currentDeviceId,
                    'is_trusted'    => (bool) $s->is_trusted,
                    'login_at'      => $s->login_at?->toIso8601String(),
                    'last_activity_at' => $s->last_activity_at?->toIso8601String(),
                ];
            });

        return $this->success($sessions);
    }

    /**
     * GET /api/v1/security/me
     * Returns security metadata for current session and user profile.
     */
    public function me(Request $request)
    {
        $user = $request->user();
        $currentDeviceId = $request->header('X-Device-ID');
        $concurrentService = app(ConcurrentSessionService::class);

        $currentSession = null;
        if ($currentDeviceId) {
            $currentSession = UserSession::where('user_id', $user->id)
                ->where('device_id', $currentDeviceId)
                ->active()
                ->first();
        }

        $activeCount = UserSession::where('user_id', $user->id)->active()->count();

        return response()->json([
            'current_device' => $currentSession ? [
                'uuid'         => $currentSession->uuid,
                'device_name'  => $currentSession->device_name,
                'device_type'  => $currentSession->device_type,
                'browser'      => $currentSession->browser,
                'os'           => $currentSession->operating_system,
                'ip'           => $currentSession->ip_address,
                'is_trusted'   => (bool) $currentSession->is_trusted,
                'last_activity'=> $currentSession->last_activity_at?->toIso8601String(),
            ] : null,
            'max_sessions'        => $concurrentService->resolveMaxSessions($user),
            'active_sessions'     => $activeCount,
            'policy'              => $concurrentService->resolvePolicy($user)->value,
            'trusted'             => $currentSession ? (bool)$currentSession->is_trusted : false,
            'last_login'          => $user->last_login_at?->toIso8601String(),
            'password_changed_at' => $user->password_changed_at?->toIso8601String(),
            'security_updated_at' => $user->security_updated_at?->toIso8601String(),
        ]);
    }

    /**
     * POST /api/v1/sessions/revoke-other
     * Logout all other device sessions.
     */
    public function revokeOther(Request $request)
    {
        $user = $request->user();
        $currentDeviceId = $request->header('X-Device-ID');

        UserSession::where('user_id', $user->id)
            ->where('status', UserSessionStatus::ACTIVE->value)
            ->when($currentDeviceId, fn($q) => $q->where('device_id', '!=', $currentDeviceId))
            ->update([
                'status'     => UserSessionStatus::REVOKED->value,
                'revoked_at' => now(),
            ]);

        return $this->success(null, 'All other sessions have been revoked.');
    }

    /**
     * DELETE /api/v1/sessions/{uuid}
     * Revoke specific device session.
     */
    public function destroy(Request $request, string $uuid)
    {
        $user = $request->user();
        $session = UserSession::where('user_id', $user->id)->where('uuid', $uuid)->firstOrFail();

        $session->update([
            'status'     => UserSessionStatus::REVOKED->value,
            'revoked_at' => now(),
        ]);

        return $this->success(null, 'Session revoked successfully.');
    }

    /**
     * PUT /api/v1/sessions/{uuid}
     * Rename device label.
     */
    public function update(Request $request, string $uuid)
    {
        $request->validate(['device_name' => 'required|string|max:100']);
        $user = $request->user();
        $session = UserSession::where('user_id', $user->id)->where('uuid', $uuid)->firstOrFail();

        $session->update(['device_name' => $request->device_name]);

        return response()->json(['message' => 'Device renamed successfully.', 'data' => $session]);
    }

    /**
     * POST /api/v1/sessions/{uuid}/trust
     * Toggle trusted device flag.
     */
    public function toggleTrust(Request $request, string $uuid)
    {
        $user = $request->user();
        $session = UserSession::where('user_id', $user->id)->where('uuid', $uuid)->firstOrFail();

        $session->update([
            'is_trusted'    => !$session->is_trusted,
            'trusted_until' => !$session->is_trusted ? now()->addDays(30) : null,
        ]);

        return response()->json([
            'message'    => $session->is_trusted ? 'Device marked as trusted.' : 'Device trust removed.',
            'is_trusted' => (bool) $session->is_trusted,
        ]);
    }
}
