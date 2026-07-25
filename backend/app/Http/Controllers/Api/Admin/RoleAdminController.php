<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\ApiController;
use App\Domains\Core\Models\User;
use Illuminate\Http\Request;

class RoleAdminController extends ApiController
{
    public function index()
    {
        $roles = [
            [
                'id' => 'admin',
                'name' => 'Administrator',
                'slug' => 'admin',
                'description' => 'Full administrative access to all system settings, user management, security policies, operations, and academic taxonomies.',
                'users_count' => User::where('role', 'admin')->count(),
                'is_system' => true,
                'permissions' => [
                    'user.manage', 'role.manage', 'course.create', 'course.update', 'course.publish', 'course.archive',
                    'batch.manage', 'media.upload', 'media.delete', 'live_class.manage', 'assignment.manage',
                    'exam.manage', 'student.manage', 'certificate.generate', 'settings.manage', 'telemetry.view'
                ],
            ],
            [
                'id' => 'teacher',
                'name' => 'Teacher / Instructor',
                'slug' => 'teacher',
                'description' => 'Access to create and manage courses, assign batches, schedule live classes, create exams/assignments, and view student progress.',
                'users_count' => User::where('role', 'teacher')->count(),
                'is_system' => true,
                'permissions' => [
                    'course.view', 'course.create', 'course.update', 'course.publish', 'course.archive',
                    'batch.manage', 'media.upload', 'media.delete', 'live_class.manage', 'assignment.manage',
                    'exam.manage', 'student.view', 'student.manage', 'certificate.generate', 'dashboard.view'
                ],
            ],
            [
                'id' => 'student',
                'name' => 'Student',
                'slug' => 'student',
                'description' => 'Access to enrolled courses, live interactive classes, assignments, exams, progress analytics, and certificates.',
                'users_count' => User::where('role', 'student')->count(),
                'is_system' => true,
                'permissions' => [
                    'course.view', 'dashboard.view'
                ],
            ],
        ];

        return response()->json([
            'data' => $roles,
            'meta' => ['total' => count($roles)]
        ]);
    }

    public function show(string $id)
    {
        $allRoles = collect([
            [
                'id' => 'admin',
                'name' => 'Administrator',
                'slug' => 'admin',
                'description' => 'Full administrative access to all system settings, user management, security policies, operations, and academic taxonomies.',
                'users_count' => User::where('role', 'admin')->count(),
                'is_system' => true,
                'permissions' => [
                    'user.manage', 'role.manage', 'course.create', 'course.update', 'course.publish', 'course.archive',
                    'batch.manage', 'media.upload', 'media.delete', 'live_class.manage', 'assignment.manage',
                    'exam.manage', 'student.manage', 'certificate.generate', 'settings.manage', 'telemetry.view'
                ],
            ],
            [
                'id' => 'teacher',
                'name' => 'Teacher / Instructor',
                'slug' => 'teacher',
                'description' => 'Access to create and manage courses, assign batches, schedule live classes, create exams/assignments, and view student progress.',
                'users_count' => User::where('role', 'teacher')->count(),
                'is_system' => true,
                'permissions' => [
                    'course.view', 'course.create', 'course.update', 'course.publish', 'course.archive',
                    'batch.manage', 'media.upload', 'media.delete', 'live_class.manage', 'assignment.manage',
                    'exam.manage', 'student.view', 'student.manage', 'certificate.generate', 'dashboard.view'
                ],
            ],
            [
                'id' => 'student',
                'name' => 'Student',
                'slug' => 'student',
                'description' => 'Access to enrolled courses, live interactive classes, assignments, exams, progress analytics, and certificates.',
                'users_count' => User::where('role', 'student')->count(),
                'is_system' => true,
                'permissions' => [
                    'course.view', 'dashboard.view'
                ],
            ],
        ]);

        $role = $allRoles->firstWhere('id', $id);
        if (!$role) {
            return $this->error('Role not found.', 404);
        }

        return $this->success($role);
    }

    public function updatePermissions(Request $request, string $id)
    {
        $validated = $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'string'
        ]);

        return response()->json([
            'message' => "Permissions for role '{$id}' updated successfully.",
            'data' => [
                'role' => $id,
                'permissions' => array_values(array_unique($validated['permissions'])),
            ]
        ]);
    }
}

