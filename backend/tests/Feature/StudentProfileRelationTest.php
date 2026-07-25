<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentProfileRelationTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_relations_can_be_included()
    {
        $admin = User::factory()->create(['role' => 'admin', 'active' => true]);
        $student = User::factory()->create(['role' => 'student', 'active' => true]);

        $response = $this->actingAs($admin)
            ->getJson("/api/v1/students?include=batches");

        $response->assertStatus(200);
    }
}
