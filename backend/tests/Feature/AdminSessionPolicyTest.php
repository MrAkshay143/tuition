<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

class AdminSessionPolicyTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_update_session_security_policies_and_per_user_overrides()
    {
        $admin = User::create([
            'name'     => 'Admin Policy User',
            'email'    => 'adminpolicy@test.com',
            'password' => bcrypt('password'),
            'role'     => 'admin',
            'active'   => true,
        ]);

        $student = User::create([
            'name'     => 'Target Student',
            'email'    => 'targetstudent@test.com',
            'password' => bcrypt('password'),
            'role'     => 'student',
            'active'   => true,
        ]);

        Sanctum::actingAs($admin, ['*']);

        // Update global policies
        $response = $this->putJson('/api/v1/admin/security/session-policies', [
            'session_limit_student' => 2,
            'policy_student'        => 'REMOVE_LEAST_RECENT',
        ]);
        $response->assertStatus(200);

        // Update user override
        $responseOverride = $this->putJson("/api/v1/admin/security/user-override/{$student->id}", [
            'max_sessions'          => 5,
            'enforcement_policy'    => 'DENY_NEW',
            'inherit_global_policy' => false,
        ]);

        $responseOverride->assertStatus(200);
        $this->assertDatabaseHas('users', [
            'id'                    => $student->id,
            'max_sessions'          => 5,
            'enforcement_policy'    => 'DENY_NEW',
            'inherit_global_policy' => false,
        ]);
    }
}
