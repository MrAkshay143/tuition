<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Domains\Course\Models\Course;
use Laravel\Sanctum\Sanctum;

class AdminAcademicManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_all_courses_and_transfer_ownership()
    {
        $admin = User::create(['name' => 'Admin User', 'email' => 'admin@test.com', 'password' => bcrypt('password'), 'role' => 'admin', 'active' => true]);
        $teacherA = User::create(['name' => 'Teacher A', 'email' => 't1@test.com', 'password' => bcrypt('password'), 'role' => 'teacher', 'active' => true]);
        $teacherB = User::create(['name' => 'Teacher B', 'email' => 't2@test.com', 'password' => bcrypt('password'), 'role' => 'teacher', 'active' => true]);

        $course = Course::create(['title' => 'Test Course', 'teacher_id' => $teacherA->id]);

        Sanctum::actingAs($admin, ['*']);

        $response = $this->putJson("/api/v1/courses/{$course->id}", [
            'teacher_id' => $teacherB->id,
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('courses', [
            'id' => $course->id,
            'teacher_id' => $teacherB->id,
        ]);
    }
}
