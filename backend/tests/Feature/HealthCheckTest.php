<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HealthCheckTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_check_endpoint_returns_ok(): void
    {
        $user = User::create([
            'name'     => 'Health Monitor',
            'email'    => 'monitor@example.com',
            'password' => bcrypt('password'),
            'role'     => 'admin',
            'active'   => true,
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/health');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'database',
                    'cache',
                    'queue',
                    'storage',
                    'version',
                    'env',
                ],
            ]);
    }
}
