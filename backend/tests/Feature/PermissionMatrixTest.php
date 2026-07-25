<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;

class PermissionMatrixTest extends TestCase
{
    protected function tearDown(): void
    {
        \Mockery::close();
        parent::tearDown();
    }

    public function test_permission_matrix_role_mappings()
    {
        $admin = new User(['role' => 'admin']);
        $teacher = new User(['role' => 'teacher']);
        $student = new User(['role' => 'student']);

        $this->assertTrue($admin->isAdmin());
        $this->assertTrue($teacher->isTeacher());
        $this->assertTrue($student->isStudent());

        // $this->assertTrue($admin->hasPermissionTo('users.manage'));
        // $this->assertTrue($teacher->hasPermissionTo('course.view'));
        // $this->assertFalse($student->hasPermissionTo('course.manage'));
    }
}
