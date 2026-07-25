<?php

namespace Tests\Feature;

use App\Models\User;
use App\Domains\Course\Models\Lesson;
use App\Domains\Course\Models\CourseChapter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LearningProgressTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMockingConsoleOutput();
    }

    public function test_student_can_update_lesson_progress(): void
    {
        $student = User::create([
            'name'     => 'Learning Student',
            'email'    => 'learner@example.com',
            'password' => bcrypt('password'),
            'role'     => 'student',
            'active'   => true,
        ]);

        $course = \App\Domains\Course\Models\Course::create([
            'title'      => 'Progression Course',
            'teacher_id' => 1,
            'status'     => 'published',
        ]);
        $module = \App\Domains\Course\Models\CourseModule::create([
            'course_id'  => $course->id,
            'title'      => 'Test Module',
            'sort_order' => 1
        ]);
        $chapter = CourseChapter::create([
            'module_id'  => $module->id,
            'title'      => 'Test Chapter',
            'sort_order' => 1,
        ]);

        $lesson = Lesson::create([
            'chapter_id'       => $chapter->id,
            'title'            => 'Intro to Calculus',
            'type'             => 'video',
            'duration_seconds' => 1000,
            'sort_order'       => 1,
        ]);

        \App\Domains\Learning\Models\Enrollment::create([
            'user_id'     => $student->id,
            'course_id'   => $course->id,
            'status'      => 'active',
            'enrolled_at' => now(),
        ]);

        $response = $this->actingAs($student, 'sanctum')
            ->postJson("/api/v1/lessons/{$lesson->id}/progress", [
                'watch_seconds' => 500,
                'position'      => 500,
                'speed'         => 1.0,
            ]);

        $response->assertStatus(200);
    }
}
