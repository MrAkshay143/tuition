<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Domains\Core\Models\User;
use App\Domains\Course\Models\Course;
use App\Domains\Course\Models\CourseModule;
use App\Domains\Course\Models\Lesson;
use App\Domains\Learning\Models\Enrollment;
use App\Domains\Learning\Models\StudentBookmark;
use App\Domains\Learning\Models\LearningSession;
use App\Domains\Learning\Models\LearningHistory;
use App\Domains\Learning\Models\CourseCompletion;
use App\Domains\Learning\Models\LearningStreak;

class StudentLearningTest extends TestCase
{
    use RefreshDatabase;

    protected $student;
    protected $course;
    protected $module;
    protected $lesson;

    protected function setUp(): void
    {
        parent::setUp();

        $this->student = User::create([
            'name'     => 'Alex Student',
            'email'    => 'alex@test.com',
            'password' => bcrypt('password'),
            'role'     => 'student',
            'active'   => true,
        ]);

        $teacher = User::create([
            'name'     => 'John Teacher',
            'email'    => 'john@test.com',
            'password' => bcrypt('password'),
            'role'     => 'teacher',
            'active'   => true,
        ]);

        $this->course = Course::create([
            'title'      => 'Advanced Physics',
            'teacher_id' => $teacher->id,
            'status'     => 'published',
        ]);

        $this->module = CourseModule::create([
            'course_id'  => $this->course->id,
            'title'      => 'Quantum Mechanics',
            'sort_order' => 1,
        ]);

        $chapter = \App\Domains\Course\Models\CourseChapter::create([
            'module_id' => $this->module->id,
            'title' => 'Chapter 1'
        ]);

        $this->lesson = Lesson::create([
            'chapter_id'       => $chapter->id,
            'title'            => 'Schrodinger Wave Equation',
            'type'             => 'video',
            'duration_seconds' => 1000,
            'sort_order'       => 1,
        ]);
    }

    public function test_student_cannot_access_unenrolled_course_progress(): void
    {
        $response = $this->actingAs($this->student)->postJson("/api/v1/lessons/{$this->lesson->id}/progress", [
            'watch_seconds' => 100,
            'position'      => 100,
        ]);

        $response->assertStatus(403);
    }

    public function test_student_can_update_enrolled_progress(): void
    {
        Enrollment::create([
            'user_id'     => $this->student->id,
            'course_id'   => $this->course->id,
            'status'      => 'active',
            'enrolled_at' => now(),
        ]);

        $response = $this->actingAs($this->student)->postJson("/api/v1/lessons/{$this->lesson->id}/progress", [
            'watch_seconds' => 200,
            'position'      => 150,
            'speed'         => 1.25,
            'device_id'     => 'ipad-pro',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('lesson_progress', [
            'user_id'         => $this->student->id,
            'lesson_id'       => $this->lesson->id,
            'watched_seconds' => 200,
            'completed'       => false,
        ]);

        $this->assertDatabaseHas('learning_sessions', [
            'user_id'        => $this->student->id,
            'lesson_id'      => $this->lesson->id,
            'watch_seconds'  => 200,
            'last_position'  => 150,
            'playback_speed' => 1.25,
            'device_id'      => 'ipad-pro',
        ]);
    }

    public function test_video_auto_completes_at_95_percent_watch_time(): void
    {
        Enrollment::create([
            'user_id'     => $this->student->id,
            'course_id'   => $this->course->id,
            'status'      => 'active',
            'enrolled_at' => now(),
        ]);

        // Post 960 seconds out of 1000 total (96% progress)
        $response = $this->actingAs($this->student)->postJson("/api/v1/lessons/{$this->lesson->id}/progress", [
            'watch_seconds' => 960,
            'position'      => 960,
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('lesson_progress', [
            'user_id'   => $this->student->id,
            'lesson_id' => $this->lesson->id,
            'completed' => true,
        ]);

        $this->assertDatabaseHas('learning_history', [
            'user_id'   => $this->student->id,
            'lesson_id' => $this->lesson->id,
            'action'    => 'lesson_completed',
        ]);

        $this->assertDatabaseHas('course_completions', [
            'user_id'              => $this->student->id,
            'course_id'            => $this->course->id,
            'completed_percentage' => 100,
        ]);
    }

    public function test_progress_updates_are_idempotent_and_only_move_forward(): void
    {
        Enrollment::create([
            'user_id'     => $this->student->id,
            'course_id'   => $this->course->id,
            'status'      => 'active',
            'enrolled_at' => now(),
        ]);

        // First heartbeat
        $this->actingAs($this->student)->postJson("/api/v1/lessons/{$this->lesson->id}/progress", [
            'watch_seconds' => 450,
            'position'      => 400,
        ]);

        // Second heartbeat with lower watch_seconds (e.g. client reset or older message retry)
        $this->actingAs($this->student)->postJson("/api/v1/lessons/{$this->lesson->id}/progress", [
            'watch_seconds' => 300,
            'position'      => 280,
        ]);

        // DB should still retain the maximum watch seconds (450)
        $this->assertDatabaseHas('lesson_progress', [
            'user_id'         => $this->student->id,
            'lesson_id'       => $this->lesson->id,
            'watched_seconds' => 450,
        ]);
    }

    public function test_student_bookmarks_crud(): void
    {
        Enrollment::create([
            'user_id'     => $this->student->id,
            'course_id'   => $this->course->id,
            'status'      => 'active',
            'enrolled_at' => now(),
        ]);

        // 1. Store Bookmark
        $response = $this->actingAs($this->student)->postJson("/api/v1/lessons/{$this->lesson->id}/bookmark", [
            'video_timestamp_seconds' => 320,
            'note'                    => 'Important formula derivation',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('student_bookmarks', [
            'user_id'                 => $this->student->id,
            'lesson_id'               => $this->lesson->id,
            'video_timestamp_seconds' => 320,
            'note'                    => 'Important formula derivation',
        ]);

        // 2. Fetch list
        $response = $this->actingAs($this->student)->getJson("/api/v1/student/bookmarks");
        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');

        // 3. Delete Bookmark
        $response = $this->actingAs($this->student)->deleteJson("/api/v1/lessons/{$this->lesson->id}/bookmark");
        $response->assertStatus(200);
        $this->assertDatabaseMissing('student_bookmarks', [
            'user_id'   => $this->student->id,
            'lesson_id' => $this->lesson->id,
        ]);
    }

    public function test_student_dashboard_statistics(): void
    {
        Enrollment::create([
            'user_id'     => $this->student->id,
            'course_id'   => $this->course->id,
            'status'      => 'active',
            'enrolled_at' => now(),
        ]);

        // Watch some lessons to build streaking logs
        $this->actingAs($this->student)->postJson("/api/v1/lessons/{$this->lesson->id}/progress", [
            'watch_seconds' => 120,
            'position'      => 120,
        ]);

        $response = $this->actingAs($this->student)->getJson("/api/v1/student/dashboard");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'analytics' => [
                        'hours_learned',
                        'lessons_completed',
                        'courses_completed',
                        'current_streak',
                        'longest_streak',
                        'weekly_activity',
                    ],
                    'resume',
                    'enrolled_courses',
                    'history',
                ]
            ]);
    }
}

