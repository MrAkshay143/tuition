<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentLifecycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_lock_and_unlock_student()
    {
        $admin = User::factory()->create(['role' => 'admin', 'active' => true]);
        $student = User::factory()->create(['role' => 'student', 'active' => true]);

        $response = $this->actingAs($admin)
            ->postJson("/api/v1/students/{$student->id}/lock");

        $response->assertStatus(200);
        $this->assertFalse($student->fresh()->active);

        $response = $this->actingAs($admin)
            ->postJson("/api/v1/students/{$student->id}/unlock");

        $response->assertStatus(200);
        $this->assertTrue($student->fresh()->active);
    }

    public function test_admin_can_suspend_and_activate_student()
    {
        $admin = User::factory()->create(['role' => 'admin', 'active' => true]);
        $student = User::factory()->create(['role' => 'student', 'active' => true]);

        $response = $this->actingAs($admin)
            ->postJson("/api/v1/students/{$student->id}/suspend");

        $response->assertStatus(200);
        $this->assertFalse($student->fresh()->active);

        $response = $this->actingAs($admin)
            ->postJson("/api/v1/students/{$student->id}/activate");

        $response->assertStatus(200);
        $this->assertTrue($student->fresh()->active);
    }
}
