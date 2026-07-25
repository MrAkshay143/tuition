<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // 1. Define all available system permissions
        $permissions = [
            // Module Visibility
            'module.courses',
            'module.live_classes',
            'module.assignments',
            'module.exams',
            'module.users',
            'module.media',
            'module.reports',
            'module.settings',
            
            // Courses
            'course.view',
            'course.create',
            'course.update',
            'course.delete',
            'course.publish',
            'course.archive',
            
            // Batches
            'batch.view',
            'batch.manage',
            
            // Media
            'media.view',
            'media.upload',
            'media.delete',
            
            // Live Classes
            'live_class.view',
            'live_class.manage',
            
            // Assignments
            'assignment.view',
            'assignment.manage',
            'assignment.submit',
            
            // Exams
            'exam.view',
            'exam.manage',
            'exam.attempt',
            
            // Students
            'student.view',
            'student.manage',
            
            // Users
            'users.view',
            'users.create',
            'users.update',
            'users.delete',

            // Certificates
            'certificate.generate',
            
            // Dashboard
            'dashboard.view'
        ];

        // 2. Create permissions
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // 3. Define Roles and Assign Permissions
        // Admin gets everything implicitly via Gate::before in AppServiceProvider, but let's create the role anyway
        $roleAdmin = Role::firstOrCreate(['name' => 'admin']);

        // Teacher Role
        $roleTeacher = Role::firstOrCreate(['name' => 'teacher']);
        $roleTeacher->syncPermissions([
            'module.courses',
            'module.live_classes',
            'module.assignments',
            'module.exams',
            'module.users',
            'module.reports',

            'course.view', 'course.create', 'course.update', 'course.publish', 'course.archive',
            'batch.view', 'batch.manage',
            'media.view', 'media.upload', 'media.delete',
            'live_class.view', 'live_class.manage',
            'assignment.view', 'assignment.manage', 'assignment.submit',
            'exam.view', 'exam.manage', 'exam.attempt',
            'student.view', 'student.manage',
            'certificate.generate',
            'dashboard.view'
        ]);

        // Student Role
        $roleStudent = Role::firstOrCreate(['name' => 'student']);
        $roleStudent->syncPermissions([
            'course.view',
            'dashboard.view',
            'batch.view',
            'assignment.view', 'assignment.submit',
            'exam.view', 'exam.attempt',
            'live_class.view'
        ]);
        
        // Output info
        $this->command->info('Roles and Permissions seeded successfully!');
    }
}
