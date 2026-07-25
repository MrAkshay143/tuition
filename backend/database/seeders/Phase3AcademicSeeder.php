<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Domains\Academic\Models\EducationType;
use App\Domains\Academic\Models\AcademicSession;
use App\Domains\Academic\Models\Program;
use App\Domains\Academic\Models\Subject;
use Illuminate\Support\Str;

class Phase3AcademicSeeder extends Seeder
{
    public function run(): void
    {
        // Academic Sessions
        $session2526 = AcademicSession::firstOrCreate(
            ['name' => '2025-2026'],
            ['start_date' => '2025-04-01', 'end_date' => '2026-03-31', 'is_current' => false, 'is_active' => true]
        );
        $session2627 = AcademicSession::firstOrCreate(
            ['name' => '2026-2027'],
            ['start_date' => '2026-04-01', 'end_date' => '2027-03-31', 'is_current' => true, 'is_active' => true]
        );

        // Education Types
        $school      = EducationType::firstOrCreate(['slug' => 'school'],              ['name' => 'School',               'order_index' => 1, 'is_active' => true, 'description' => 'CBSE, ICSE, State Board programs for Classes 6-12']);
        $college     = EducationType::firstOrCreate(['slug' => 'college'],             ['name' => 'College',              'order_index' => 2, 'is_active' => true, 'description' => 'Undergraduate and postgraduate programs']);
        $competitive = EducationType::firstOrCreate(['slug' => 'competitive-exam'],    ['name' => 'Competitive Exams',    'order_index' => 3, 'is_active' => true, 'description' => 'JEE, NEET, UPSC, SSC, Banking and other entrance exams']);
        $cert        = EducationType::firstOrCreate(['slug' => 'certification'],       ['name' => 'Certification',        'order_index' => 4, 'is_active' => true, 'description' => 'Professional certifications and software courses']);
        $skill       = EducationType::firstOrCreate(['slug' => 'skill-development'],   ['name' => 'Skill Development',    'order_index' => 5, 'is_active' => true, 'description' => 'Practical industry skills and vocational training']);
        $professional= EducationType::firstOrCreate(['slug' => 'professional-training'],['name' => 'Professional Training','order_index' => 6, 'is_active' => true, 'description' => 'Corporate and professional upskilling programs']);

        // Global Subjects
        $subjects = [
            // Core Science
            ['name' => 'Physics',             'code' => 'PHY',  'color' => '#3b82f6', 'order_index' => 1],
            ['name' => 'Chemistry',           'code' => 'CHE',  'color' => '#10b981', 'order_index' => 2],
            ['name' => 'Mathematics',         'code' => 'MAT',  'color' => '#f59e0b', 'order_index' => 3],
            ['name' => 'Biology',             'code' => 'BIO',  'color' => '#ef4444', 'order_index' => 4],
            // Languages
            ['name' => 'English',             'code' => 'ENG',  'color' => '#8b5cf6', 'order_index' => 5],
            ['name' => 'Hindi',               'code' => 'HIN',  'color' => '#ec4899', 'order_index' => 6],
            // Social
            ['name' => 'History',             'code' => 'HIS',  'color' => '#f97316', 'order_index' => 7],
            ['name' => 'Geography',           'code' => 'GEO',  'color' => '#14b8a6', 'order_index' => 8],
            ['name' => 'Economics',           'code' => 'ECO',  'color' => '#06b6d4', 'order_index' => 9],
            ['name' => 'Political Science',   'code' => 'POL',  'color' => '#84cc16', 'order_index' => 10],
            // Commerce
            ['name' => 'Accountancy',         'code' => 'ACC',  'color' => '#64748b', 'order_index' => 11],
            ['name' => 'Business Studies',    'code' => 'BST',  'color' => '#0ea5e9', 'order_index' => 12],
            // Computer
            ['name' => 'Computer Science',    'code' => 'CS',   'color' => '#7c3aed', 'order_index' => 13],
            ['name' => 'Information Technology','code' => 'IT',  'color' => '#a855f7', 'order_index' => 14],
            // Engineering / College
            ['name' => 'Data Structures',     'code' => 'DSA',  'color' => '#2563eb', 'order_index' => 15],
            ['name' => 'Algorithms',          'code' => 'ALGO', 'color' => '#7c3aed', 'order_index' => 16],
            ['name' => 'Computer Networks',   'code' => 'CN',   'color' => '#0891b2', 'order_index' => 17],
            ['name' => 'Database Management', 'code' => 'DBMS', 'color' => '#b45309', 'order_index' => 18],
            ['name' => 'Operating Systems',   'code' => 'OS',   'color' => '#374151', 'order_index' => 19],
            ['name' => 'Object-Oriented Programming','code' => 'OOP','color' => '#065f46','order_index' => 20],
            // Aptitude
            ['name' => 'Quantitative Aptitude','code' => 'QA',  'color' => '#dc2626', 'order_index' => 21],
            ['name' => 'Logical Reasoning',   'code' => 'LR',   'color' => '#9333ea', 'order_index' => 22],
            ['name' => 'General Knowledge',   'code' => 'GK',   'color' => '#16a34a', 'order_index' => 23],
            ['name' => 'Verbal Ability',      'code' => 'VA',   'color' => '#0369a1', 'order_index' => 24],
        ];

        foreach ($subjects as $subjectData) {
            Subject::firstOrCreate(
                ['slug' => Str::slug($subjectData['name'])],
                array_merge($subjectData, ['is_active' => true])
            );
        }

        // Programs

        // 4A. School - CBSE Classes 6-12
        $cbsePrograms = [
            ['name' => 'CBSE Class 6',  'order_index' => 1],
            ['name' => 'CBSE Class 7',  'order_index' => 2],
            ['name' => 'CBSE Class 8',  'order_index' => 3],
            ['name' => 'CBSE Class 9',  'order_index' => 4],
            ['name' => 'CBSE Class 10', 'order_index' => 5],
            ['name' => 'CBSE Class 11', 'order_index' => 6],
            ['name' => 'CBSE Class 12', 'order_index' => 7],
        ];
        foreach ($cbsePrograms as $p) {
            Program::firstOrCreate(
                ['slug' => Str::slug($p['name'])],
                ['education_type_id' => $school->id, 'academic_session_id' => $session2627->id, 'name' => $p['name'], 'is_active' => true, 'order_index' => $p['order_index']]
            );
        }

        // 4B. School - ICSE Classes 6-12
        $icsePrograms = [
            ['name' => 'ICSE Class 6',  'order_index' => 8],
            ['name' => 'ICSE Class 7',  'order_index' => 9],
            ['name' => 'ICSE Class 8',  'order_index' => 10],
            ['name' => 'ICSE Class 9',  'order_index' => 11],
            ['name' => 'ICSE Class 10', 'order_index' => 12],
            ['name' => 'ICSE Class 11', 'order_index' => 13],
            ['name' => 'ICSE Class 12', 'order_index' => 14],
        ];
        foreach ($icsePrograms as $p) {
            Program::firstOrCreate(
                ['slug' => Str::slug($p['name'])],
                ['education_type_id' => $school->id, 'academic_session_id' => $session2627->id, 'name' => $p['name'], 'is_active' => true, 'order_index' => $p['order_index']]
            );
        }

        // 4C. School - State Board Classes 9-12
        $statePrograms = [
            ['name' => 'State Board Class 9',  'order_index' => 15],
            ['name' => 'State Board Class 10', 'order_index' => 16],
            ['name' => 'State Board Class 11', 'order_index' => 17],
            ['name' => 'State Board Class 12', 'order_index' => 18],
        ];
        foreach ($statePrograms as $p) {
            Program::firstOrCreate(
                ['slug' => Str::slug($p['name'])],
                ['education_type_id' => $school->id, 'academic_session_id' => $session2627->id, 'name' => $p['name'], 'is_active' => true, 'order_index' => $p['order_index']]
            );
        }

        // 4D. Competitive Exams
        $competitivePrograms = [
            ['name' => 'JEE Main 2027',       'order_index' => 1],
            ['name' => 'JEE Advanced 2027',    'order_index' => 2],
            ['name' => 'NEET 2027',            'order_index' => 3],
            ['name' => 'CUET 2027',            'order_index' => 4],
            ['name' => 'UPSC Civil Services',  'order_index' => 5],
            ['name' => 'SSC CGL',              'order_index' => 6],
            ['name' => 'Banking (IBPS PO)',    'order_index' => 7],
            ['name' => 'Railway (RRB NTPC)',   'order_index' => 8],
            ['name' => 'GATE',                 'order_index' => 9],
            ['name' => 'CAT',                  'order_index' => 10],
            ['name' => 'CLAT',                 'order_index' => 11],
            ['name' => 'NDA',                  'order_index' => 12],
        ];
        foreach ($competitivePrograms as $p) {
            Program::firstOrCreate(
                ['slug' => Str::slug($p['name'])],
                ['education_type_id' => $competitive->id, 'academic_session_id' => null, 'name' => $p['name'], 'is_active' => true, 'order_index' => $p['order_index']]
            );
        }

        // 4E. College Programs
        $collegePrograms = [
            ['name' => 'BCA Semester 1', 'order_index' => 1],
            ['name' => 'BCA Semester 2', 'order_index' => 2],
            ['name' => 'BCA Semester 3', 'order_index' => 3],
            ['name' => 'BCA Semester 4', 'order_index' => 4],
            ['name' => 'BCA Semester 5', 'order_index' => 5],
            ['name' => 'BCA Semester 6', 'order_index' => 6],
            ['name' => 'BSc Computer Science', 'order_index' => 7],
            ['name' => 'BCom',                'order_index' => 8],
            ['name' => 'BA Economics',        'order_index' => 9],
            ['name' => 'BTech Computer Science','order_index' => 10],
            ['name' => 'MCA',                 'order_index' => 11],
            ['name' => 'MBA',                 'order_index' => 12],
        ];
        foreach ($collegePrograms as $p) {
            Program::firstOrCreate(
                ['slug' => Str::slug($p['name'])],
                ['education_type_id' => $college->id, 'academic_session_id' => $session2627->id, 'name' => $p['name'], 'is_active' => true, 'order_index' => $p['order_index']]
            );
        }

        // 4F. Certification Programs
        $certPrograms = [
            ['name' => 'MS Office Specialist', 'order_index' => 1],
            ['name' => 'Tally Prime',           'order_index' => 2],
            ['name' => 'AutoCAD Professional',  'order_index' => 3],
            ['name' => 'GST & Accounting',      'order_index' => 4],
            ['name' => 'Adobe Photoshop',       'order_index' => 5],
            ['name' => 'Google Analytics',      'order_index' => 6],
        ];
        foreach ($certPrograms as $p) {
            Program::firstOrCreate(
                ['slug' => Str::slug($p['name'])],
                ['education_type_id' => $cert->id, 'academic_session_id' => null, 'name' => $p['name'], 'is_active' => true, 'order_index' => $p['order_index']]
            );
        }

        // 4G. Skill Development Programs
        $skillPrograms = [
            ['name' => 'Python Programming',    'order_index' => 1],
            ['name' => 'Web Design & Development','order_index' => 2],
            ['name' => 'Digital Marketing',     'order_index' => 3],
            ['name' => 'Data Analytics',        'order_index' => 4],
            ['name' => 'Video Editing',         'order_index' => 5],
            ['name' => 'Graphic Design',        'order_index' => 6],
            ['name' => 'Spoken English',        'order_index' => 7],
        ];
        foreach ($skillPrograms as $p) {
            Program::firstOrCreate(
                ['slug' => Str::slug($p['name'])],
                ['education_type_id' => $skill->id, 'academic_session_id' => null, 'name' => $p['name'], 'is_active' => true, 'order_index' => $p['order_index']]
            );
        }

        // 4H. Professional Training Programs
        $profPrograms = [
            ['name' => 'Corporate Communication',    'order_index' => 1],
            ['name' => 'Leadership & Management',    'order_index' => 2],
            ['name' => 'HR Management',              'order_index' => 3],
            ['name' => 'Project Management (PMP)',   'order_index' => 4],
            ['name' => 'Financial Planning',         'order_index' => 5],
        ];
        foreach ($profPrograms as $p) {
            Program::firstOrCreate(
                ['slug' => Str::slug($p['name'])],
                ['education_type_id' => $professional->id, 'academic_session_id' => null, 'name' => $p['name'], 'is_active' => true, 'order_index' => $p['order_index']]
            );
        }

        $this->command->info('✅ Phase3AcademicSeeder complete: ' . Program::count() . ' programs, ' . Subject::count() . ' subjects, ' . EducationType::count() . ' education types seeded.');
    }
}
