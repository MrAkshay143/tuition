<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Domains\Core\Models\User;
use App\Domains\Course\Models\Course;
use App\Domains\Academic\Models\Subject;

class SystemSecurityAndAnalyticsSeeder extends Seeder
{
    public function run(): void
    {
        $admin    = User::where('role', 'admin')->first();
        $teacher  = User::where('role', 'teacher')->first();
        $students = User::where('role', 'student')->get();
        $courses  = Course::limit(10)->get();
        $subjects = Subject::limit(6)->get();

        // ── 1. SPATIE ROLES & PERMISSIONS ────────────────────────────────────
        $roles = [
            ['id' => 1, 'name' => 'admin',   'guard_name' => 'web'],
            ['id' => 2, 'name' => 'teacher', 'guard_name' => 'web'],
            ['id' => 3, 'name' => 'student', 'guard_name' => 'web'],
        ];
        foreach ($roles as $r) {
            DB::table('roles')->insertOrIgnore([
                ...$r,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Assign model_has_roles
        if ($admin) {
            DB::table('model_has_roles')->insertOrIgnore([
                'role_id'    => 1,
                'model_type' => 'App\\Domains\\Core\\Models\\User',
                'model_id'   => $admin->id,
            ]);
        }
        if ($teacher) {
            DB::table('model_has_roles')->insertOrIgnore([
                'role_id'    => 2,
                'model_type' => 'App\\Domains\\Core\\Models\\User',
                'model_id'   => $teacher->id,
            ]);
        }
        foreach ($students as $student) {
            DB::table('model_has_roles')->insertOrIgnore([
                'role_id'    => 3,
                'model_type' => 'App\\Domains\\Core\\Models\\User',
                'model_id'   => $student->id,
            ]);
        }

        // Assign Spatie Permissions
        $permissions = [
            ['id' => 1, 'name' => 'dashboard.view', 'guard_name' => 'web'],
            ['id' => 2, 'name' => 'student.view',   'guard_name' => 'web'],
            ['id' => 3, 'name' => 'batch.view',     'guard_name' => 'web'],
            ['id' => 4, 'name' => 'course.view',    'guard_name' => 'web'],
            ['id' => 5, 'name' => 'exam.view',      'guard_name' => 'web'],
            ['id' => 6, 'name' => 'exam.attempt',   'guard_name' => 'web'],
            ['id' => 7, 'name' => 'assignment.submit', 'guard_name' => 'web'],
            ['id' => 8, 'name' => 'live_class.view', 'guard_name' => 'web'],
            ['id' => 9, 'name' => 'system.manage',  'guard_name' => 'web'],
        ];
        foreach ($permissions as $p) {
            DB::table('permissions')->insertOrIgnore([
                ...$p,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Base permissions for all
        foreach ([1, 2, 3] as $roleId) {
            foreach ([1, 2, 3, 4, 5, 6, 7, 8] as $permId) {
                DB::table('role_has_permissions')->insertOrIgnore([
                    'permission_id' => $permId,
                    'role_id'       => $roleId,
                ]);
            }
        }
        
        // System manage only for admin (role 1)
        DB::table('role_has_permissions')->insertOrIgnore([
            'permission_id' => 9,
            'role_id'       => 1,
        ]);

        // ── 2. FEATURE FLAGS ────────────────────────────────────────────────
        $featureFlags = [
            [
                'key'         => 'live_classes_enabled',
                'name'        => 'Live Classes Platform',
                'description' => 'Enable interactive LiveKit and YouTube live streaming classes.',
                'is_enabled'  => true,
            ],
            [
                'key'         => 'ai_tutor_enabled',
                'name'        => 'EduFlow Concept Assistant',
                'description' => 'Enable AI-powered doubt solving and instant concept explanation.',
                'is_enabled'  => true,
            ],
            [
                'key'         => 'certificates_enabled',
                'name'        => 'Automated Course Certificates',
                'description' => 'Auto-generate PDF completion certificates upon 100% course progress.',
                'is_enabled'  => true,
            ],
            [
                'key'         => 'chat_discussions_enabled',
                'name'        => 'Student-Teacher Discussion Portal',
                'description' => 'Enable direct messaging and Q&A chat threads.',
                'is_enabled'  => true,
            ],
            [
                'key'         => 'dark_mode_enabled',
                'name'        => 'Dark Mode & Custom Themes',
                'description' => 'Allow custom HSL theme switching and dark mode preference.',
                'is_enabled'  => true,
            ],
        ];

        foreach ($featureFlags as $flag) {
            DB::table('feature_flags')->insertOrIgnore([
                ...$flag,
                'rules'      => json_encode(['all_roles' => true]),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // ── 3. QUESTION BANK TAXONOMY ───────────────────────────────────────
        $difficulties = [
            ['id' => 1, 'name' => 'Easy',   'level' => 1],
            ['id' => 2, 'name' => 'Medium', 'level' => 2],
            ['id' => 3, 'name' => 'Hard',   'level' => 3],
        ];
        foreach ($difficulties as $d) {
            DB::table('difficulties')->insertOrIgnore([
                ...$d,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        if ($subjects->isNotEmpty()) {
            foreach ($subjects as $subj) {
                $topicId = DB::table('topics')->insertGetId([
                    'subject_id'  => $subj->id,
                    'name'        => "Core Principles of {$subj->name}",
                    'description' => "High-yield topics and fundamentals for {$subj->name}.",
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);

                // Insert standalone questions
                DB::table('questions')->insert([
                    'topic_id'               => $topicId,
                    'difficulty_id'          => 2, // Medium
                    'teacher_id'             => $teacher?->id ?? 1,
                    'content'                => "Explain the fundamental equation and principles governing {$subj->name}.",
                    'type'                   => 'mcq',
                    'options'                => json_encode(['Option A', 'Option B', 'Option C', 'Option D']),
                    'correct_answer'         => 'Option A',
                    'solution_explanation'   => 'Detailed step-by-step solution based on core theory.',
                    'default_marks'          => 4,
                    'default_time_seconds'   => 120,
                    'is_active'              => true,
                    'created_at'             => now(),
                    'updated_at'             => now(),
                ]);
            }
        }

        // ── 4. LEARNING STREAKS & HISTORY ───────────────────────────────────
        foreach ($students as $sIdx => $student) {
            // Streaks
            $currentStreak = rand(3, 14);
            DB::table('learning_streaks')->insertOrIgnore([
                'user_id'             => $student->id,
                'current_streak_days' => $currentStreak,
                'longest_streak_days' => $currentStreak + rand(2, 10),
                'last_activity_date'  => now()->toDateString(),
                'created_at'          => now()->subDays(30),
                'updated_at'          => now(),
            ]);

            // Learning history timeline
            foreach ($courses->take(2) as $course) {
                DB::table('learning_history')->insert([
                    'user_id'        => $student->id,
                    'course_id'      => $course->id,
                    'lesson_id'      => 1,
                    'action'         => 'lesson_completed',
                    'watch_seconds'  => 900,
                    'playback_speed' => 1.0,
                    'device'         => ($sIdx % 2 === 0) ? 'Desktop Windows Chrome' : 'Mobile Android',
                    'ip'             => '127.0.0.1',
                    'created_at'     => now()->subDays(rand(1, 7)),
                ]);

                // Course completions
                $perc = ($sIdx % 2 === 0) ? 100 : 60;
                DB::table('course_completions')->insertOrIgnore([
                    'user_id'              => $student->id,
                    'course_id'            => $course->id,
                    'completed_percentage' => $perc,
                    'completed_at'         => ($perc === 100) ? now()->subDays(2) : null,
                    'certificate_id'       => ($perc === 100) ? 1 : null,
                    'certificate_generated'=> ($perc === 100),
                    'created_at'           => now()->subDays(10),
                    'updated_at'           => now(),
                ]);
            }

            // Notification preferences
            DB::table('notification_preferences')->insertOrIgnore([
                'user_id'             => $student->id,
                'in_app'              => true,
                'email'               => true,
                'push'                => true,
                'live_class_reminder' => true,
                'assignment_due'      => true,
                'exam_reminder'       => true,
                'new_content'         => true,
            ]);
        }

        // ── 5. SECURITY & DEVICE SESSIONS ────────────────────────────────────
        $allUsers = User::all();
        foreach ($allUsers as $u) {
            $sessUuid = Str::uuid()->toString();
            DB::table('user_sessions')->insert([
                'uuid'                 => $sessUuid,
                'user_id'              => $u->id,
                'session_hash'         => hash('sha256', $sessUuid),
                'device_id'            => 'dev_' . $u->id,
                'device_name'          => 'Chrome on Windows 11',
                'device_type'          => 'desktop',
                'login_source'         => 'web_login',
                'browser'              => 'Chrome',
                'browser_version'      => '126.0',
                'operating_system'     => 'Windows',
                'os_version'           => '11',
                'platform'             => 'Windows',
                'fingerprint_hash'     => md5($u->id . 'fp'),
                'user_agent'           => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'ip_address'           => '127.0.0.1',
                'last_activity_ip'     => '127.0.0.1',
                'country'              => 'India',
                'city'                 => 'New Delhi',
                'status'               => 'active',
                'risk_score'           => 0.05,
                'risk_level'           => 'low',
                'is_trusted'           => true,
                'login_at'             => now()->subHours(rand(1, 10)),
                'last_activity_at'     => now(),
                'expires_at'           => now()->addDays(7),
                'absolute_expires_at'  => now()->addDays(30),
                'created_at'           => now(),
                'updated_at'           => now(),
            ]);

            DB::table('device_sessions')->insert([
                'user_id'        => $u->id,
                'token_id'       => $u->id,
                'device_name'    => 'Desktop Workstation',
                'user_agent'     => 'Mozilla/5.0',
                'ip_address'     => '127.0.0.1',
                'last_active_at' => now(),
                'created_at'     => now(),
                'updated_at'     => now(),
            ]);
        }

        // ── 6. COURSE VERSIONS & AUDIT LOGS ──────────────────────────────────
        foreach ($courses as $c) {
            DB::table('course_versions')->insert([
                'course_id'      => $c->id,
                'version'        => 1,
                'snapshot'       => json_encode(['title' => $c->title, 'status' => $c->status]),
                'change_summary' => 'Initial publication version snapshot.',
                'created_by'     => $teacher?->id ?? 1,
                'created_at'     => now()->subDays(15),
            ]);

            DB::table('course_activity_logs')->insert([
                'course_id'   => $c->id,
                'user_id'     => $teacher?->id ?? 1,
                'event'       => 'published',
                'description' => "Course '{$c->title}' was published by teacher.",
                'properties'  => json_encode(['status' => 'published']),
                'created_at'  => now()->subDays(15),
                'updated_at'  => now()->subDays(15),
            ]);
        }

        echo "  ✅ SystemSecurityAndAnalyticsSeeder complete: roles, permissions, feature flags, question taxonomy, security sessions & learning analytics seeded.\n";
    }
}
