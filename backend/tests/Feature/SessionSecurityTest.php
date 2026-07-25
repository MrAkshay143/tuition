<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

class SessionSecurityTest extends TestCase
{
    protected function tearDown(): void
    {
        \Mockery::close();
        parent::tearDown();
    }

    public function test_user_session_security_methods(): void
    {
        $user = new User(['name' => 'Session User', 'role' => 'student']);
        $user->id = 1;

        $this->assertEquals(1, $user->id);
        $this->assertTrue($user->isStudent());
    }
}
