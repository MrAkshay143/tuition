<?php

namespace Tests\Feature;

use App\Models\User;
use App\Domains\Core\Models\UserSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentDeviceTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_force_logout_student_devices()
    {
        $admin = User::factory()->create(['role' => 'admin', 'active' => true]);
        $student = User::factory()->create(['role' => 'student', 'active' => true]);

        UserSession::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $student->id,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0',
            'session_hash' => 'hash_test_id_1',
            'device_id' => 'device_id_uuid_1',
            'status' => 'ACTIVE',
        ]);

        $response = $this->actingAs($admin)
            ->postJson("/api/v1/students/{$student->id}/force-logout");

        $response->assertStatus(200);
        $this->assertEquals(\App\Domains\Core\Enums\UserSessionStatus::REVOKED, $student->userSessions()->first()->status);
    }
}
