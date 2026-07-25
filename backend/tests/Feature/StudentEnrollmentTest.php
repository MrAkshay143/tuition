<?php

namespace Tests\Feature;

use App\Models\User;
use App\Domains\Course\Models\Course;
use App\Domains\Core\Models\Batch;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentEnrollmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_assign_and_remove_courses()
    {
        $admin = User::factory()->create(['role' => 'admin', 'active' => true]);
        $student = User::factory()->create(['role' => 'student', 'active' => true]);
        $course = Course::create([
            'title' => 'Test Course',
            'description' => 'Test course description',
            'status' => 'published',
            'teacher_id' => $admin->id,
        ]);

        $response = $this->actingAs($admin)
            ->postJson("/api/v1/students/{$student->id}/assign-course", [
                'course_ids' => [$course->id]
            ]);

        $response->assertStatus(200);
        $this->assertEquals(1, \App\Domains\Learning\Models\Enrollment::where('user_id', $student->id)->count());

        $response = $this->actingAs($admin)
            ->postJson("/api/v1/students/{$student->id}/remove-course", [
                'course_ids' => [$course->id]
            ]);

        $response->assertStatus(200);
        $this->assertEquals(0, \App\Domains\Learning\Models\Enrollment::where('user_id', $student->id)->count());
    }

    public function test_admin_can_assign_and_remove_batches()
    {
        $admin = User::factory()->create(['role' => 'admin', 'active' => true]);
        $student = User::factory()->create(['role' => 'student', 'active' => true]);
        $course = \App\Domains\Course\Models\Course::create([
            'title' => 'Test Course',
            'status' => 'published',
        ]);
        $batch = Batch::create([
            'name' => 'Batch Test',
            'code' => 'BATCH-TEST-CODE',
            'is_active' => true,
            'teacher_id' => $admin->id,
            'course_id' => $course->id,
        ]);

        $response = $this->actingAs($admin)
            ->postJson("/api/v1/students/{$student->id}/assign-batch", [
                'batch_ids' => [$batch->id]
            ]);

        $response->assertStatus(200);
        $this->assertEquals(1, $student->batches()->count());

        $response = $this->actingAs($admin)
            ->postJson("/api/v1/students/{$student->id}/remove-batch", [
                'batch_ids' => [$batch->id]
            ]);

        $response->assertStatus(200);
        $this->assertEquals(0, $student->batches()->count());
    }
}

