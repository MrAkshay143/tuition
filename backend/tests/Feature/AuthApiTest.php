<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email'    => 'student@example.com',
            'password' => Hash::make('password123'),
            'active'   => true,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email'       => 'student@example.com',
            'password'    => 'password123',
            'device_name' => 'test-device',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => ['token', 'user'],
            ]);
    }

    public function test_login_fails_with_invalid_password(): void
    {
        $user = User::factory()->create([
            'email'    => 'student@example.com',
            'password' => Hash::make('password123'),
            'active'   => true,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email'       => 'student@example.com',
            'password'    => 'wrong-password',
            'device_name' => 'test-device',
        ]);

        $response->assertStatus(401);
    }
}
