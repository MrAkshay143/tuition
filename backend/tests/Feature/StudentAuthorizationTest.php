<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_cannot_lock_student()
    {
        $teacher = User::factory()->create(['role' => 'teacher', 'active' => true]);
        $student = User::factory()->create(['role' => 'student', 'active' => true]);

        $response = $this->actingAs($teacher)
            ->postJson("/api/v1/students/{$student->id}/lock");

        $response->assertStatus(403);
    }

    public function test_student_cannot_lock_other_students()
    {
        $student1 = User::factory()->create(['role' => 'student', 'active' => true]);
        $student2 = User::factory()->create(['role' => 'student', 'active' => true]);

        $response = $this->actingAs($student1)
            ->postJson("/api/v1/students/{$student2->id}/lock");

        $response->assertStatus(403);
    }
}
