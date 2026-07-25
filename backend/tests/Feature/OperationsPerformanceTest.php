<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

class OperationsPerformanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_liveness_endpoint_returns_ok()
    {
        $response = $this->getJson('/api/v1/health/live');
        $response->assertStatus(200);
        $response->assertJson(['status' => 'ok']);
    }

    public function test_health_readiness_endpoint_returns_service_status()
    {
        $response = $this->getJson('/api/v1/health/ready');
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'ready',
            'services' => ['database', 'cache', 'queue'],
        ]);
    }

    public function test_security_headers_are_attached_to_responses()
    {
        $response = $this->getJson('/api/v1/health/live');

        $response->assertHeader('X-Frame-Options', 'DENY');
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('Strict-Transport-Security');
    }

    public function test_login_rate_limiter_throttles_excessive_attempts()
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/auth/login', [
                'email'    => 'invalid@test.com',
                'password' => 'wrongpassword',
            ]);
        }

        $throttledResponse = $this->postJson('/api/v1/auth/login', [
            'email'    => 'invalid@test.com',
            'password' => 'wrongpassword',
        ]);

        $throttledResponse->assertStatus(429);
    }

    public function test_authenticated_admin_can_access_operations_details()
    {
        $admin = User::create([
            'name'     => 'Admin Operations User',
            'email'    => 'adminops@test.com',
            'password' => bcrypt('password'),
            'role'     => 'admin',
            'active'   => true,
        ]);

        Sanctum::actingAs($admin, ['*']);

        $response = $this->getJson('/api/v1/admin/operations/details');
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'build_info' => ['version', 'environment', 'php_version'],
            'deployment_diagnostics',
            'queue_telemetry',
            'scheduler_history',
        ]);
    }
}
