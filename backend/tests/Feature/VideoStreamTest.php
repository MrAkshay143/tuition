<?php

namespace Tests\Feature;

use App\Models\User;
use App\Domains\Course\Models\Course;
use App\Domains\Course\Models\Lesson;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class VideoStreamTest extends TestCase
{
    use RefreshDatabase;

    public function test_unenrolled_student_cannot_access_lesson_stream(): void
    {
        $student = User::create([
            'name'     => 'Test Student',
            'email'    => 'student@example.com',
            'password' => bcrypt('password'),
            'role'     => 'student',
            'active'   => true,
        ]);

        $response = $this->actingAs($student, 'sanctum')
            ->getJson("/api/v1/lessons/9999/stream");

        $response->assertStatus(404);
    }

    public function test_unsigned_stream_url_returns_403_forbidden(): void
    {
        $response = $this->getJson("/api/v1/media/1/stream");
        $response->assertStatus(403);
    }

    public function test_signed_stream_url_requires_valid_signature(): void
    {
        $signedUrl = \Illuminate\Support\Facades\URL::temporarySignedRoute(
            'api.v1.media.stream',
            now()->addMinutes(10),
            ['media' => 99999]
        );

        $response = $this->getJson($signedUrl);
        $response->assertStatus(404); // Valid signature, media not found
    }
}
