<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\ApiController;
use App\Domains\Settings\Models\Setting;
use App\Domains\Core\Models\User;
use App\Domains\Core\Models\UserSession;
use App\Domains\Core\Enums\UserSessionStatus;
use Illuminate\Http\Request;

class SessionPolicyController extends ApiController
{
    /**
     * GET /api/v1/admin/security/session-policies
     * Retrieve current session limits, policies, and role defaults.
     */
    public function show()
    {
        return response()->json([
            'global' => [
                'session_limit_global'          => (int) Setting::get('session_limit_global', 1),
                'policy_global'                 => Setting::get('policy_global', 'REPLACE_CURRENT'),
                'session_idle_timeout_minutes'  => (int) Setting::get('session_idle_timeout_minutes', 120),
                'session_absolute_timeout_days' => (int) Setting::get('session_absolute_timeout_days', 30),
                'trusted_device_lifetime_days'  => (int) Setting::get('trusted_device_lifetime_days', 30),
                'max_trusted_devices'           => (int) Setting::get('max_trusted_devices', 5),
                'remember_device_enabled'       => filter_var(Setting::get('remember_device_enabled', true), FILTER_VALIDATE_BOOLEAN),
            ],
            'roles' => [
                'student' => [
                    'max_sessions' => (int) Setting::get('session_limit_student', 1),
                    'policy'       => Setting::get('policy_student', 'REPLACE_CURRENT'),
                ],
                'teacher' => [
                    'max_sessions' => (int) Setting::get('session_limit_teacher', 3),
                    'policy'       => Setting::get('policy_teacher', 'REMOVE_LEAST_RECENT'),
                ],
                'admin' => [
                    'max_sessions' => (int) Setting::get('session_limit_admin', 2),
                    'policy'       => Setting::get('policy_admin', 'PROMPT_USER'),
                ],
            ],
            'active_sessions_count'   => UserSession::active()->count(),
            'compromised_count'       => UserSession::where('status', UserSessionStatus::COMPROMISED->value)->count(),
        ]);
    }

    /**
     * PUT /api/v1/admin/security/session-policies
     * Save session limits & policy settings.
     */
    public function update(Request $request)
    {
        $data = $request->validate([
            'session_limit_student'         => 'sometimes|integer|min:1|max:50',
            'session_limit_teacher'         => 'sometimes|integer|min:1|max:50',
            'session_limit_admin'           => 'sometimes|integer|min:1|max:50',
            'policy_student'                => 'sometimes|string|in:REPLACE_CURRENT,DENY_NEW,PROMPT_USER,REMOVE_LEAST_RECENT',
            'policy_teacher'                => 'sometimes|string|in:REPLACE_CURRENT,DENY_NEW,PROMPT_USER,REMOVE_LEAST_RECENT',
            'policy_admin'                  => 'sometimes|string|in:REPLACE_CURRENT,DENY_NEW,PROMPT_USER,REMOVE_LEAST_RECENT',
            'session_idle_timeout_minutes'  => 'sometimes|integer|min:5|max:10080',
            'session_absolute_timeout_days' => 'sometimes|integer|min:1|max:365',
            'trusted_device_lifetime_days'  => 'sometimes|integer|min:1|max:365',
            'remember_device_enabled'       => 'sometimes|boolean',
        ]);

        foreach ($data as $key => $val) {
            Setting::set($key, is_bool($val) ? ($val ? 'true' : 'false') : (string)$val);
        }

        return response()->json([
            'message' => 'Session security policies updated successfully.',
        ]);
    }

    /**
     * PUT /api/v1/admin/security/user-override/{id}
     * Update individual user session limits and policy overrides.
     */
    public function updateUserOverride(Request $request, int $id)
    {
        $request->validate([
            'max_sessions'          => 'nullable|integer|min:1|max:100',
            'enforcement_policy'    => 'nullable|string|in:REPLACE_CURRENT,DENY_NEW,PROMPT_USER,REMOVE_LEAST_RECENT',
            'inherit_global_policy' => 'required|boolean',
        ]);

        $targetUser = User::findOrFail($id);
        $targetUser->update([
            'max_sessions'          => $request->max_sessions,
            'enforcement_policy'    => $request->enforcement_policy,
            'inherit_global_policy' => $request->inherit_global_policy,
        ]);

        return response()->json([
            'message' => "Session policy override updated for user {$targetUser->name}.",
            'user'    => [
                'id'                    => $targetUser->id,
                'name'                  => $targetUser->name,
                'max_sessions'          => $targetUser->max_sessions,
                'enforcement_policy'    => $targetUser->enforcement_policy,
                'inherit_global_policy' => (bool)$targetUser->inherit_global_policy,
            ],
        ]);
    }
}
