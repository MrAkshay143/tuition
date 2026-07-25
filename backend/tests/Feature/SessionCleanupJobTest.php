<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Domains\Core\Models\UserSession;
use App\Domains\Core\Jobs\CleanupExpiredSessionsJob;

class SessionCleanupJobTest extends TestCase
{
    use RefreshDatabase;

    public function test_cleanup_job_marks_timed_out_sessions_as_expired()
    {
        $user = User::create([
            'name'     => 'Timed Out User',
            'email'    => 'timeout@test.com',
            'password' => bcrypt('password'),
            'role'     => 'student',
            'active'   => true,
        ]);

        $session = UserSession::create([
            'uuid'         => (string) \Illuminate\Support\Str::uuid(),
            'user_id'      => $user->id,
            'session_hash' => hash('sha256', 'sample-token'),
            'device_id'    => 'dev-timed-out',
            'status'       => 'ACTIVE',
            'expires_at'   => now()->subMinute(),
        ]);

        (new CleanupExpiredSessionsJob())->handle();

        $this->assertDatabaseHas('user_sessions', [
            'id'     => $session->id,
            'status' => 'EXPIRED',
        ]);
    }
}
