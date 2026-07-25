<?php

namespace App\Domains\Core\Services;

use App\Domains\Core\Models\User;
use App\Domains\Core\Models\UserSession;
use App\Domains\Core\Enums\UserSessionStatus;
use App\Domains\Core\Enums\ConcurrentSessionPolicy;
use App\Domains\Settings\Models\Setting;
use Illuminate\Http\Request;

class ConcurrentSessionService
{
    /**
     * Resolve effective max sessions limit for a user.
     * Hierarchy: Per-User Override -> Role Default -> Global Default
     */
    public function resolveMaxSessions(User $user): int
    {
        // 1. Per-User Override
        if (!$user->inherit_global_policy && $user->max_sessions !== null) {
            return $user->max_sessions;
        }

        // 2. Role Default
        $roleDefaults = [
            'student'     => (int) Setting::get('session_limit_student', 1),
            'teacher'     => (int) Setting::get('session_limit_teacher', 3),
            'admin'       => (int) Setting::get('session_limit_admin', 2),
            'super_admin' => 999999, // Unlimited
        ];

        if (isset($roleDefaults[$user->role])) {
            return $roleDefaults[$user->role];
        }

        // 3. Global Default
        return (int) Setting::get('session_limit_global', 1);
    }

    /**
     * Resolve effective concurrent session enforcement policy.
     * Hierarchy: Per-User Override -> Role Default -> Global Default
     */
    public function resolvePolicy(User $user): ConcurrentSessionPolicy
    {
        // 1. Per-User Override
        if (!$user->inherit_global_policy && !empty($user->enforcement_policy)) {
            return ConcurrentSessionPolicy::from($user->enforcement_policy);
        }

        // 2. Role Default
        $rolePolicies = [
            'student' => ConcurrentSessionPolicy::from(Setting::get('policy_student', ConcurrentSessionPolicy::REPLACE_CURRENT->value)),
            'teacher' => ConcurrentSessionPolicy::from(Setting::get('policy_teacher', ConcurrentSessionPolicy::REMOVE_LEAST_RECENT->value)),
            'admin'   => ConcurrentSessionPolicy::from(Setting::get('policy_admin', ConcurrentSessionPolicy::PROMPT_USER->value)),
        ];

        if (isset($rolePolicies[$user->role])) {
            return $rolePolicies[$user->role];
        }

        // 3. Global Default
        $global = Setting::get('policy_global', ConcurrentSessionPolicy::REPLACE_CURRENT->value);
        return ConcurrentSessionPolicy::from($global);
    }

    /**
     * Evaluate and enforce session limits upon new login request.
     * Returns true if login is allowed, false if rejected.
     */
    public function enforce(User $user, Request $request, string $deviceId): bool
    {
        $maxSessions = $this->resolveMaxSessions($user);
        if ($maxSessions >= 999999) {
            return true; // Unlimited
        }

        $activeSessions = UserSession::where('user_id', $user->id)
            ->active()
            ->get();

        // If current device already has active session, count is within limit
        $existingDeviceSession = $activeSessions->firstWhere('device_id', $deviceId);
        if ($existingDeviceSession) {
            return true;
        }

        if ($activeSessions->count() < $maxSessions) {
            return true;
        }

        $policy = $this->resolvePolicy($user);

        switch ($policy) {
            case ConcurrentSessionPolicy::REPLACE_CURRENT:
                // Immediately revoke all existing sessions (Ideal for Students)
                foreach ($activeSessions as $session) {
                    $session->update([
                        'status'     => UserSessionStatus::REVOKED->value,
                        'revoked_at' => now(),
                    ]);
                }
                return true;

            case ConcurrentSessionPolicy::DENY_NEW:
                // Reject new login if max limit reached
                return false;

            case ConcurrentSessionPolicy::PROMPT_USER:
                // Check if user confirmed replacement via request flag
                if ($request->boolean('replace_existing')) {
                    foreach ($activeSessions as $session) {
                        $session->update([
                            'status'     => UserSessionStatus::REVOKED->value,
                            'revoked_at' => now(),
                        ]);
                    }
                    return true;
                }
                return false;

            case ConcurrentSessionPolicy::REMOVE_LEAST_RECENT:
                // Revoke least recently active sessions to make space
                $toRevokeCount = ($activeSessions->count() - $maxSessions) + 1;
                $oldestSessions = $activeSessions->sortBy('last_activity_at')->take($toRevokeCount);
                foreach ($oldestSessions as $session) {
                    $session->update([
                        'status'     => UserSessionStatus::REVOKED->value,
                        'revoked_at' => now(),
                    ]);
                }
                return true;
        }

        return true;
    }
}
