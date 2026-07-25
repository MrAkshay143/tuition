<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Domains\Core\Models\UserSession;

class ConcurrentSessionTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_login_on_second_device_revokes_first_session_under_replace_current_policy()
    {
        $student = User::create([
            'name'     => 'Concurrent Student',
            'email'    => 'student@test.com',
            'password' => bcrypt('password'),
            'role'     => 'student',
            'active'   => true,
        ]);

        // First Device Login
        $this->postJson('/api/v1/auth/login', [
            'email'    => 'student@test.com',
            'password' => 'password',
        ], ['X-Device-ID' => 'device-1']);

        $this->assertDatabaseHas('user_sessions', [
            'user_id'   => $student->id,
            'device_id' => 'device-1',
            'status'    => 'ACTIVE',
        ]);

        // Second Device Login
        $this->postJson('/api/v1/auth/login', [
            'email'    => 'student@test.com',
            'password' => 'password',
        ], ['X-Device-ID' => 'device-2']);

        // First session revoked, second session active
        $this->assertDatabaseHas('user_sessions', [
            'user_id'   => $student->id,
            'device_id' => 'device-1',
            'status'    => 'REVOKED',
        ]);

        $this->assertDatabaseHas('user_sessions', [
            'user_id'   => $student->id,
            'device_id' => 'device-2',
            'status'    => 'ACTIVE',
        ]);
    }
}
