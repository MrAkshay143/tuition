<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_send_notification_to_student()
    {
        $admin = User::factory()->create(['role' => 'admin', 'active' => true]);
        $student = User::factory()->create(['role' => 'student', 'active' => true]);

        $response = $this->actingAs($admin)
            ->postJson("/api/v1/students/{$student->id}/send-notification", [
                'title' => 'Test Notification',
                'body' => 'Notification content body',
            ]);

        $response->assertStatus(200);
        $this->assertEquals(1, $student->notifications()->count());
    }
}
