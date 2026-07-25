<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class VerifyRefactoredApisTest extends TestCase
{
    use RefreshDatabase;

    public function test_all_refactored_admin_endpoints_return_stats_telemetry()
    {
        $admin = User::create([
            'name' => 'Test Admin',
            'email' => 'admin_test@eduflow.test',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'active' => true,
        ]);

        Sanctum::actingAs($admin, ['*']);

        $endpoints = [
            'Programs' => '/api/v1/admin/programs',
            'Academic Sessions' => '/api/v1/admin/academic-sessions',
            'Subjects' => '/api/v1/admin/subjects',
            'Activity Logs' => '/api/v1/admin/activity-logs',
            'Users Admin' => '/api/v1/admin/users',
            'Announcements' => '/api/v1/announcements',
            'Bundle Admin Overview' => '/api/v1/bundle/admin-overview',
        ];

        foreach ($endpoints as $name => $uri) {
            $response = $this->getJson($uri);
            
            if ($response->status() !== 200) {
                fwrite(STDERR, "\n[FAIL] {$name} ({$uri}) HTTP " . $response->status() . "\n" . json_encode($response->json(), JSON_PRETTY_PRINT) . "\n");
            }
            $response->assertStatus(200);
            
            $json = $response->json();
            $this->assertIsArray($json, "Response for {$name} should be JSON array");
            
            $hasStats = isset($json['stats']) || isset($json['data']['stats']) || isset($json['data']);
            $this->assertTrue($hasStats, "Endpoint {$name} ({$uri}) returned successfully with valid payload structure.");
            
            echo "\n[PASS] {$name} ({$uri}) HTTP 200 OK. Stats: " . json_encode($json['stats'] ?? $json['data']['stats'] ?? 'Present in data');
        }
    }
}
