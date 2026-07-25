<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Domains\Course\Models\Course;

class AuditLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_activity_log_captures_old_and_new_values_on_update()
    {
        $teacher = User::create(['name' => 'Teacher User', 'email' => 't1@test.com', 'password' => bcrypt('password'), 'role' => 'teacher']);
        $course = Course::create(['teacher_id' => $teacher->id, 'title' => 'Initial Title']);

        $this->actingAs($teacher, 'sanctum');
        $course->update(['title' => 'Updated Title']);

        $this->assertDatabaseHas('activity_logs', [
            'event' => 'updated',
        ]);
    }
}
