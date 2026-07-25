<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Domains\Core\Models\UserSession;
use Laravel\Sanctum\Sanctum;

class SessionBindingTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_login_binds_session_with_device_id_and_fingerprint()
    {
        $user = User::create([
            'name'     => 'Student Security User',
            'email'    => 'binding@test.com',
            'password' => bcrypt('password'),
            'role'     => 'student',
            'active'   => true,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => 'binding@test.com',
            'password' => 'password',
        ], [
            'X-Device-ID'          => 'device-uuid-12345',
            'X-Browser-Fingerprint'=> 'sha256-fingerprint-sample',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('user_sessions', [
            'user_id'   => $user->id,
            'device_id' => 'device-uuid-12345',
            'status'    => 'ACTIVE',
        ]);
    }
}
