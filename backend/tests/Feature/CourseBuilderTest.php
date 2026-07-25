<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Course;
use App\Models\CourseModule;
use App\Models\Lesson;

class CourseBuilderTest extends TestCase
{
    use RefreshDatabase;

    protected User $teacher;
    protected User $student;

    protected function setUp(): void
    {
        parent::setUp();

        $this->teacher = User::create([
            'name'     => 'Test Teacher',
            'email'    => 'teacher_test@eduflow.test',
            'password' => bcrypt('password'),
            'role'     => 'teacher',
            'active'   => true,
        ]);

        $this->student = User::create([
            'name'     => 'Test Student',
            'email'    => 'student_test@eduflow.test',
            'password' => bcrypt('password'),
            'role'     => 'student',
            'active'   => true,
        ]);
    }

    public function test_unauthorized_users_cannot_access_course_crud(): void
    {
        $response = $this->postJson('/api/v1/courses', []);
        $response->assertStatus(401);

        $response = $this->actingAs($this->student)->postJson('/api/v1/courses', []);
        $response->assertStatus(403);
    }

    public function test_teacher_can_crud_courses(): void
    {
        // 1. Create
        $response = $this->actingAs($this->teacher)->postJson('/api/v1/courses', [
            'title'       => 'Physics Quantum Mechanics',
            'description' => 'Advanced mechanics formulas',
            'thumbnail'   => 'https://example.com/physics.png',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('courses', ['title' => 'Physics Quantum Mechanics']);
        $courseId = $response->json('data.id');

        // 2. Read details
        $response = $this->actingAs($this->teacher)->getJson("/api/v1/courses/{$courseId}");
        $response->assertStatus(200);
        $response->assertJsonPath('data.title', 'Physics Quantum Mechanics');

        // 3. Update
        $response = $this->actingAs($this->teacher)->putJson("/api/v1/courses/{$courseId}", [
            'title' => 'Quantum Mechanics Refactored',
        ]);
        $response->assertStatus(200);
        $this->assertDatabaseHas('courses', ['title' => 'Quantum Mechanics Refactored']);

        // 4. Archive/Toggle Publish
        // Must satisfy publishing checklist first
        $courseModel = Course::find($courseId);
        $courseModel->update([
            'description' => 'Detailed course description',
            'thumbnail'   => 'https://example.com/thumbnail.png'
        ]);
        $m = CourseModule::create([
            'course_id'  => $courseId,
            'title'      => 'Chapter 1',
            'sort_order' => 1
        ]);
        $chapter = \App\Domains\Course\Models\CourseChapter::create([
            'module_id' => $m->id,
            'title' => 'Chapter 1'
        ]);
        Lesson::create([
            'chapter_id' => $chapter->id,
            'title'      => 'Intro Lesson',
            'type'       => 'video',
            'sort_order' => 1
        ]);

        $response = $this->actingAs($this->teacher)->patchJson("/api/v1/courses/{$courseId}/publish", [
            'publish' => true,
        ]);
        $response->assertStatus(200);
        $this->assertDatabaseHas('courses', ['id' => $courseId, 'status' => 'published']);

        // 5. Delete
        $response = $this->actingAs($this->teacher)->deleteJson("/api/v1/courses/{$courseId}");
        $response->assertStatus(200);
        // Soft delete leaves it in DB with deleted_at set
        $this->assertSoftDeleted('courses', ['id' => $courseId]);
    }

    public function test_module_and_lesson_management_and_ordering(): void
    {
        $course = Course::create([
            'title'      => 'Electromagnetism',
            'teacher_id' => $this->teacher->id,
            'status'     => 'draft',
        ]);

        // 1. Create Modules
        $response = $this->actingAs($this->teacher)->postJson("/api/v1/courses/{$course->id}/modules", [
            'title' => 'Module 1: Intro',
        ]);
        $response->assertStatus(201);
        $m1Id = $response->json('data.id');

        $response = $this->actingAs($this->teacher)->postJson("/api/v1/courses/{$course->id}/modules", [
            'title' => 'Module 2: Advanced',
        ]);
        $response->assertStatus(201);
        $m2Id = $response->json('data.id');

        // 2. Reorder Modules
        $response = $this->actingAs($this->teacher)->patchJson("/api/v1/courses/{$course->id}/modules/reorder", [
            'module_ids' => [$m2Id, $m1Id]
        ]);
        $response->assertStatus(200);
        $this->assertDatabaseHas('course_modules', ['id' => $m2Id, 'sort_order' => 0]);
        $this->assertDatabaseHas('course_modules', ['id' => $m1Id, 'sort_order' => 1]);

        // 3. Create Lesson
        $response = $this->actingAs($this->teacher)->postJson("/api/v1/modules/{$m1Id}/lessons", [
            'title' => 'Lesson 1.1: Coulomb\'s Law',
            'type'  => 'video',
        ]);
        $response->assertStatus(201);
        $l1Id = $response->json('data.id');

        // 4. Autosave Lesson
        $response = $this->actingAs($this->teacher)->patchJson("/api/v1/lessons/{$l1Id}/autosave", [
            'content' => 'New autosaved draft content',
        ]);
        $response->assertStatus(200);
        $this->assertDatabaseHas('lessons', ['id' => $l1Id, 'content' => 'New autosaved draft content']);
    }

    public function test_course_locks_prevent_concurrent_editing(): void
    {
        $course = Course::create([
            'title'      => 'Concurrent Course',
            'teacher_id' => $this->teacher->id,
            'status'     => 'draft',
        ]);

        $anotherTeacher = User::create([
            'name'     => 'Another Teacher',
            'email'    => 'another@eduflow.test',
            'password' => bcrypt('password'),
            'role'     => 'teacher',
            'active'   => true,
        ]);

        // 1. Teacher 1 acquires lock
        $response = $this->actingAs($this->teacher)->postJson("/api/v1/courses/{$course->id}/lock");
        $response->assertStatus(200);
        $this->assertDatabaseHas('course_edit_sessions', ['course_id' => $course->id, 'user_id' => $this->teacher->id]);

        // 2. Teacher 2 tries to acquire lock and gets blocked (ValidationException / 422)
        $response = $this->actingAs($anotherTeacher)->postJson("/api/v1/courses/{$course->id}/lock");
        $response->assertStatus(422);

        // 3. Teacher 1 releases lock
        $response = $this->actingAs($this->teacher)->postJson("/api/v1/courses/{$course->id}/unlock");
        $response->assertStatus(200);
        $this->assertDatabaseMissing('course_edit_sessions', ['course_id' => $course->id, 'user_id' => $this->teacher->id]);

        // 4. Teacher 2 can now acquire lock
        $response = $this->actingAs($anotherTeacher)->postJson("/api/v1/courses/{$course->id}/lock");
        $response->assertStatus(200);
        $this->assertDatabaseHas('course_edit_sessions', ['course_id' => $course->id, 'user_id' => $anotherTeacher->id]);
    }

    public function test_course_versioning_and_restore(): void
    {
        $course = Course::create([
            'title'      => 'Versioned Course',
            'teacher_id' => $this->teacher->id,
            'status'     => 'draft',
        ]);

        // 1. Create a version snapshot
        $response = $this->actingAs($this->teacher)->postJson("/api/v1/courses/{$course->id}/versions", [
            'change_summary' => 'Initial Snapshot'
        ]);
        $response->assertStatus(201);
        $versionId = $response->json('data.id');
        $this->assertDatabaseHas('course_versions', ['id' => $versionId, 'version' => 1]);

        // 2. Modify Course Title
        $course->update(['title' => 'Title Changed']);

        // 3. Restore snapshot
        $response = $this->actingAs($this->teacher)->postJson("/api/v1/courses/{$course->id}/versions/{$versionId}/restore");
        $response->assertStatus(200);
        $this->assertDatabaseHas('courses', ['id' => $course->id, 'title' => 'Versioned Course']);
    }

    public function test_module_collapse_state(): void
    {
        $course = Course::create([
            'title'      => 'State Course',
            'teacher_id' => $this->teacher->id,
            'status'     => 'draft',
        ]);

        $module = CourseModule::create([
            'course_id'  => $course->id,
            'title'      => 'State Module',
            'sort_order' => 1,
        ]);

        $response = $this->actingAs($this->teacher)->postJson("/api/v1/modules/{$module->id}/state", [
            'collapsed' => true
        ]);
        $response->assertStatus(200);
        $this->assertDatabaseHas('module_states', [
            'teacher_id' => $this->teacher->id,
            'module_id'  => $module->id,
            'collapsed'  => true
        ]);
    }

    public function test_course_scheduling_validation(): void
    {
        $response = $this->actingAs($this->teacher)->postJson('/api/v1/courses', [
            'title'        => 'Scheduled Course',
            'publish_at'   => '2026-08-01 10:00:00',
            'unpublish_at' => '2026-07-01 10:00:00',
            'timezone'     => 'UTC'
        ]);
        $response->assertStatus(422);

        $response = $this->actingAs($this->teacher)->postJson('/api/v1/courses', [
            'title'        => 'Scheduled Course Valid',
            'publish_at'   => '2026-08-01 10:00:00',
            'unpublish_at' => '2026-08-10 10:00:00',
            'timezone'     => 'Asia/Kolkata'
        ]);
        $response->assertStatus(201);
        $this->assertDatabaseHas('courses', [
            'title'        => 'Scheduled Course Valid',
            'publish_at'   => '2026-08-01 10:00:00',
            'unpublish_at' => '2026-08-10 10:00:00',
            'timezone'     => 'Asia/Kolkata'
        ]);
    }

    public function test_teacher_cannot_manage_other_teachers_courses(): void
    {
        $anotherTeacher = User::create([
            'name'     => 'Another Teacher',
            'email'    => 'another_teacher@eduflow.test',
            'password' => bcrypt('password'),
            'role'     => 'teacher',
            'active'   => true,
        ]);

        $course = Course::create([
            'title'      => 'Teacher A Course',
            'teacher_id' => $this->teacher->id,
            'status'     => 'draft',
        ]);

        // 1. Another teacher tries to view details (should get 403 Forbidden)
        $response = $this->actingAs($anotherTeacher)->getJson("/api/v1/courses/{$course->id}");
        $response->assertStatus(403);

        // 2. Another teacher tries to update details
        $response = $this->actingAs($anotherTeacher)->putJson("/api/v1/courses/{$course->id}", [
            'title' => 'Updated Title'
        ]);
        $response->assertStatus(403);

        // 3. Another teacher tries to delete course
        $response = $this->actingAs($anotherTeacher)->deleteJson("/api/v1/courses/{$course->id}");
        $response->assertStatus(403);
    }

    public function test_media_library_upload_and_delete(): void
    {
        \Illuminate\Support\Facades\Storage::fake('public');

        $file = \Illuminate\Http\UploadedFile::fake()->create('lecture_notes.pdf', 500, 'application/pdf');

        // 1. Upload
        $response = $this->actingAs($this->teacher)->postJson('/api/v1/media', [
            'file' => $file
        ]);
        $response->assertStatus(201);
        $mediaId = $response->json('data.id');
        $this->assertDatabaseHas('media', ['id' => $mediaId, 'filename' => 'lecture_notes.pdf']);

        // 2. Index
        $response = $this->actingAs($this->teacher)->getJson('/api/v1/media');
        $response->assertStatus(200);
        $response->assertJsonFragment(['filename' => 'lecture_notes.pdf']);

        // 3. Delete
        $response = $this->actingAs($this->teacher)->deleteJson("/api/v1/media/{$mediaId}");
        $response->assertStatus(200);
        $this->assertSoftDeleted('media', ['id' => $mediaId]);
    }

    public function test_course_export_and_import(): void
    {
        // 1. Create a course with module and lesson
        $course = Course::create([
            'title'       => 'Exportable Course',
            'description' => 'Will be exported and imported',
            'teacher_id'  => $this->teacher->id,
            'status'      => 'draft',
        ]);
        $module = CourseModule::create([
            'course_id'  => $course->id,
            'title'      => 'Export Module',
            'sort_order' => 1
        ]);
        $chapter = \App\Domains\Course\Models\CourseChapter::create([
            'module_id' => $module->id,
            'title' => 'Chapter 1'
        ]);
        Lesson::create([
            'chapter_id' => $chapter->id,
            'title'      => 'Export Lesson',
            'type'       => 'video',
            'sort_order' => 1
        ]);

        // 2. Export
        $response = $this->actingAs($this->teacher)->getJson("/api/v1/courses/{$course->id}/export");
        $response->assertStatus(200);
        $payload = $response->json();
        $this->assertEquals('1.0.0', $payload['schema_version']);
        $this->assertEquals('Exportable Course', $payload['title']);

        // 3. Write payload to temporary file to upload
        $tempFile = tempnam(sys_get_temp_dir(), 'eduflow');
        file_put_contents($tempFile, json_encode($payload));
        $uploadedFile = new \Illuminate\Http\UploadedFile($tempFile, 'course.eduflow', 'application/json', null, true);

        // 4. Import
        $response = $this->actingAs($this->teacher)->postJson('/api/v1/courses/import', [
            'file' => $uploadedFile
        ]);
        $response->assertStatus(201);
        $importedId = $response->json('data.id');
        $this->assertDatabaseHas('courses', ['id' => $importedId, 'title' => 'Exportable Course']);
        $this->assertDatabaseHas('course_modules', ['course_id' => $importedId, 'title' => 'Export Module']);

        @unlink($tempFile);
    }

    public function test_course_update_optimistic_concurrency_control(): void
    {
        $course = Course::create([
            'title'      => 'OCC Course',
            'teacher_id' => $this->teacher->id,
            'status'     => 'draft',
        ]);

        $originalUpdatedAt = $course->updated_at->toIso8601String();

        // Simulate another session saving first
        $course->title = 'OCC Title Updated by Teacher B';
        $course->updated_at = now()->addSeconds(5);
        $course->save();

        // Now Teacher A tries to update using original timestamp
        $response = $this->actingAs($this->teacher)->putJson("/api/v1/courses/{$course->id}", [
            'title'           => 'OCC Title Updated by Teacher A',
            'last_updated_at' => $originalUpdatedAt,
        ]);

        // Expect Conflict
        $response->assertStatus(409);
    }

    public function test_course_status_transition_state_machine(): void
    {
        $course = Course::create([
            'title'      => 'State Machine Course',
            'teacher_id' => $this->teacher->id,
            'status'     => 'draft',
        ]);

        // 1. Transition draft -> archived (valid)
        $course->update(['status' => 'archived']);
        $this->assertEquals('archived', $course->status);

        // 2. Transition archived -> published (invalid)
        $this->expectException(\DomainException::class);
        $course->update(['status' => 'published']);
    }

    public function test_student_can_update_lesson_progress(): void
    {
        $student = User::create([
            'name'     => 'Jane Student',
            'email'    => 'student@eduflow.test',
            'password' => bcrypt('password'),
            'role'     => 'student',
            'active'   => true,
        ]);

        $course = Course::create([
            'title'      => 'Progression Course',
            'teacher_id' => $this->teacher->id,
            'status'     => 'published',
        ]);
        $module = CourseModule::create([
            'course_id'  => $course->id,
            'title'      => 'Module A',
            'sort_order' => 1
        ]);
        $chapter = \App\Domains\Course\Models\CourseChapter::create([
            'module_id' => $module->id,
            'title' => 'Chapter 1'
        ]);
        $lesson = Lesson::create([
            'chapter_id' => $chapter->id,
            'title'      => 'Video Lesson 1',
            'type'       => 'video',
            'sort_order' => 1
        ]);

        \App\Domains\Learning\Models\Enrollment::create([
            'user_id'     => $student->id,
            'course_id'   => $course->id,
            'status'      => 'active',
            'enrolled_at' => now(),
        ]);

        $response = $this->actingAs($student)->postJson("/api/v1/lessons/{$lesson->id}/progress", [
            'watched_seconds' => 120,
            'completed'       => true,
        ]);
        $response->assertStatus(200);
        $this->assertDatabaseHas('lesson_progress', [
            'user_id'         => $student->id,
            'lesson_id'       => $lesson->id,
            'completed'       => true,
            'watched_seconds' => 120,
        ]);
    }

    public function test_lesson_dependencies_crud(): void
    {
        $course = Course::create([
            'title'      => 'Dependencies Course',
            'teacher_id' => $this->teacher->id,
            'status'     => 'published',
        ]);
        $module = CourseModule::create([
            'course_id'  => $course->id,
            'title'      => 'Module A',
            'sort_order' => 1
        ]);
        $chapter = \App\Domains\Course\Models\CourseChapter::create([
            'module_id' => $module->id,
            'title' => 'Chapter 1'
        ]);
        $lessonA = Lesson::create([
            'chapter_id' => $chapter->id,
            'title'      => 'Prerequisite Lesson A',
            'type'       => 'video',
            'sort_order' => 1
        ]);
        $lessonB = Lesson::create([
            'chapter_id' => $chapter->id,
            'title'      => 'Target Lesson B',
            'type'       => 'video',
            'sort_order' => 2
        ]);

        // 1. Add dependency (Lesson B depends on Lesson A)
        $response = $this->actingAs($this->teacher)->postJson("/api/v1/lessons/{$lessonB->id}/dependencies", [
            'prerequisite_lesson_id' => $lessonA->id
        ]);
        $response->assertStatus(201);
        $this->assertDatabaseHas('lesson_dependencies', [
            'lesson_id'              => $lessonB->id,
            'prerequisite_lesson_id' => $lessonA->id
        ]);

        // 2. Delete dependency
        $response = $this->actingAs($this->teacher)->deleteJson("/api/v1/lessons/{$lessonB->id}/dependencies/{$lessonA->id}");
        $response->assertStatus(200);
        $this->assertDatabaseMissing('lesson_dependencies', [
            'lesson_id'              => $lessonB->id,
            'prerequisite_lesson_id' => $lessonA->id
        ]);
    }

    public function test_course_auditing_and_publish_history(): void
    {
        $course = Course::create([
            'title'       => 'Audit Course',
            'description' => 'Test Course Description',
            'thumbnail'   => 'test_thumbnail.png',
            'teacher_id'  => $this->teacher->id,
            'status'      => 'draft',
        ]);
        $module = CourseModule::create([
            'course_id' => $course->id,
            'title'     => 'Module A'
        ]);
        $chapter = \App\Domains\Course\Models\CourseChapter::create([
            'module_id' => $module->id,
            'title' => 'Chapter 1'
        ]);
        $lesson = Lesson::create([
            'chapter_id' => $chapter->id,
            'title'     => 'Lesson A'
        ]);

        // Create a course version so publishing can log version ID
        $version = \App\Domains\Course\Models\CourseVersion::create([
            'course_id'  => $course->id,
            'created_by' => $this->teacher->id,
            'version'    => 1,
            'snapshot'   => ['modules' => []],
        ]);

        // 1. Trigger update audit log
        $this->actingAs($this->teacher)->putJson("/api/v1/courses/{$course->id}", [
            'title' => 'Updated Audit Course Title',
        ])->assertStatus(200);

        // 2. Trigger publish audit log & publish history
        $this->actingAs($this->teacher)->patchJson("/api/v1/courses/{$course->id}/publish")
            ->assertStatus(200);

        // 3. Verify Activity Logs retrieval
        $response = $this->actingAs($this->teacher)->getJson("/api/v1/courses/{$course->id}/activity-logs");
        $response->assertStatus(200)
            ->assertJsonFragment(['event' => 'updated'])
            ->assertJsonFragment(['event' => 'published']);

        // 4. Verify Publish History retrieval
        $response = $this->actingAs($this->teacher)->getJson("/api/v1/courses/{$course->id}/publish-history");
        $response->assertStatus(200)
            ->assertJsonFragment(['version' => 1]);
    }
}

