<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductionDemoDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Core Config
        $sessionId = DB::table('academic_sessions')->insertGetId([
            'name' => '2026-27 Master Session',
            'start_date' => now(),
            'end_date' => now()->addYear(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('institute_settings')->insertOrIgnore([
            'id' => 1,
            'name' => 'Enterprise EduFlow AI',
            'default_session_id' => $sessionId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 2. Catalogs
        $schoolCatalog = DB::table('academic_catalogs')->insertGetId(['name' => 'School Programs', 'created_at' => now(), 'updated_at' => now()]);
        $collegeCatalog = DB::table('academic_catalogs')->insertGetId(['name' => 'University Degrees', 'created_at' => now(), 'updated_at' => now()]);
        $examCatalog = DB::table('academic_catalogs')->insertGetId(['name' => 'Competitive Exams', 'created_at' => now(), 'updated_at' => now()]);

        // 3. Levels
        $class10 = DB::table('academic_levels')->insertGetId(['catalog_id' => $schoolCatalog, 'type' => 'school', 'name' => 'Class 10', 'created_at' => now(), 'updated_at' => now()]);
        $btech = DB::table('academic_levels')->insertGetId(['catalog_id' => $collegeCatalog, 'type' => 'college', 'name' => 'B.Tech Semester 5', 'created_at' => now(), 'updated_at' => now()]);
        $neet = DB::table('academic_levels')->insertGetId(['catalog_id' => $examCatalog, 'type' => 'competitive', 'name' => 'NEET Dropper', 'created_at' => now(), 'updated_at' => now()]);

        // 4. Curricula
        $cbse = DB::table('curricula')->insertGetId(['catalog_id' => $schoolCatalog, 'type' => 'board', 'name' => 'CBSE', 'created_at' => now(), 'updated_at' => now()]);
        $aktu = DB::table('curricula')->insertGetId(['catalog_id' => $collegeCatalog, 'type' => 'university', 'name' => 'AKTU', 'created_at' => now(), 'updated_at' => now()]);
        $nta = DB::table('curricula')->insertGetId(['catalog_id' => $examCatalog, 'type' => 'exam', 'name' => 'NTA Pattern', 'created_at' => now(), 'updated_at' => now()]);

        // 5. Subject Groups
        $scienceGroup = DB::table('subject_groups')->insertGetId(['name' => 'Science', 'created_at' => now(), 'updated_at' => now()]);
        $csGroup = DB::table('subject_groups')->insertGetId(['name' => 'Computer Science', 'created_at' => now(), 'updated_at' => now()]);

        // 6. Subjects
        $physics = DB::table('subjects')->insertGetId(['group_id' => $scienceGroup, 'name' => 'Physics', 'created_at' => now(), 'updated_at' => now()]);
        $math = DB::table('subjects')->insertGetId(['group_id' => $scienceGroup, 'name' => 'Mathematics', 'created_at' => now(), 'updated_at' => now()]);
        $os = DB::table('subjects')->insertGetId(['group_id' => $csGroup, 'name' => 'Operating Systems', 'created_at' => now(), 'updated_at' => now()]);

        // 7. Users
        DB::table('users')->updateOrInsert(
            ['email' => 'teacher@eduflow.ai'],
            [
                'name' => 'Master Teacher',
                'password' => bcrypt('password'),
                'role' => 'teacher',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
        $teacherId = DB::table('users')->where('email', 'teacher@eduflow.ai')->value('id');
        
        DB::table('users')->updateOrInsert(
            ['email' => 'student@eduflow.ai'],
            [
                'name' => 'Bright Student',
                'password' => bcrypt('password'),
                'role' => 'student',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
        $studentId = DB::table('users')->where('email', 'student@eduflow.ai')->value('id');

        // 8. Courses
        $course1 = DB::table('courses')->insertGetId([
            'title' => 'Complete Physics (Class 10 CBSE)',
            'status' => 'published',
            'session_id' => $sessionId,
            'catalog_id' => $schoolCatalog,
            'level_id' => $class10,
            'curriculum_id' => $cbse,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 9. Batches
        $batch1 = DB::table('batches')->insertGetId([
            'name' => 'Morning Batch (Alpha)',
            'course_id' => $course1,
            'teacher_id' => $teacherId,
            'session_id' => $sessionId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 10. Enrollments
        DB::table('enrollments')->insert([
            'session_id' => $sessionId,
            'user_id' => $studentId,
            'course_id' => $course1,
            'batch_id' => $batch1,
            'enrolled_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 11. Modules & Lessons
        $module1 = DB::table('course_modules')->insertGetId([
            'course_id' => $course1,
            'subject_id' => $physics,
            'title' => 'Mechanics',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $lesson1 = DB::table('lessons')->insertGetId([
            'module_id' => $module1,
            'subject_id' => $physics,
            'title' => 'Newton\'s Laws of Motion',
            'type' => 'video',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 12. Assessment
        $qb = DB::table('question_banks')->insertGetId([
            'name' => 'Physics Core Questions',
            'subject_id' => $physics,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('assessments')->insert([
            'title' => 'Mechanics Weekly Test',
            'course_id' => $course1,
            'total_marks' => 50,
            'passing_marks' => 20,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
