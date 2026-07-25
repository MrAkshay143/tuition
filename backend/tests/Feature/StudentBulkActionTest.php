<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentBulkActionTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_perform_bulk_actions_on_students()
    {
        $admin = User::factory()->create(['role' => 'admin', 'active' => true]);
        $student1 = User::factory()->create(['role' => 'student', 'active' => true]);
        $student2 = User::factory()->create(['role' => 'student', 'active' => true]);

        // Bulk Suspend
        $response = $this->actingAs($admin)->postJson("/api/v1/students/bulk/suspend", [
            'student_ids' => [$student1->id, $student2->id]
        ]);
        $response->assertStatus(200);

        $this->assertFalse($student1->fresh()->active);
        $this->assertFalse($student2->fresh()->active);

        // Bulk Activate
        $response = $this->actingAs($admin)->postJson("/api/v1/students/bulk/activate", [
            'student_ids' => [$student1->id, $student2->id]
        ]);
        $response->assertStatus(200);

        $this->assertTrue($student1->fresh()->active);
        $this->assertTrue($student2->fresh()->active);
    }
}
