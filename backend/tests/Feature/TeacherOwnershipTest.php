<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Domains\Course\Models\Course;
use Laravel\Sanctum\Sanctum;

class TeacherOwnershipTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_can_only_view_their_owned_courses()
    {
        $teacher1 = User::create(['name' => 'Teacher 1', 'email' => 't1@test.com', 'password' => bcrypt('password'), 'role' => 'teacher', 'active' => true]);
        $teacher2 = User::create(['name' => 'Teacher 2', 'email' => 't2@test.com', 'password' => bcrypt('password'), 'role' => 'teacher', 'active' => true]);

        $course1 = Course::create(['teacher_id' => $teacher1->id, 'title' => 'Teacher 1 Course']);
        $course2 = Course::create(['teacher_id' => $teacher2->id, 'title' => 'Teacher 2 Course']);

        Sanctum::actingAs($teacher1, ['*']);

        $response = $this->getJson('/api/v1/courses');

        $response->assertStatus(200);
        $data = $response->json('data');
        
        $titles = collect($data)->pluck('title');
        $this->assertTrue($titles->contains('Teacher 1 Course'));
        $this->assertFalse($titles->contains('Teacher 2 Course'));
    }
}
