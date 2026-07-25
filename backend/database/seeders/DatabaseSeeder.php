<?php

namespace Database\Seeders;

use App\Domains\Core\Models\User;
use App\Domains\Core\Models\Batch;
use App\Domains\Settings\Models\Setting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            Phase3AcademicSeeder::class, // Must run first for program and subject dependencies
            AdminSeeder::class,
            TeacherSeeder::class,
            BatchSeeder::class,
            CourseSeeder::class,
            StudentSeeder::class,
            AssessmentSeeder::class,
            EngagementSeeder::class,
            LearningProgressSeeder::class,
            SystemSecurityAndAnalyticsSeeder::class,
            SettingsSeeder::class,
        ]);
    }
}

// Admin Seeder
class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@eduflow.test'],
            [
                'name'     => 'Platform Admin',
                'password' => Hash::make('Admin@1234!'),
                'role'     => 'admin',
                'active'   => true,
            ]
        );

        echo "  ✅ Admin created: admin@eduflow.test / Admin@1234!\n";
    }
}

// Teacher Seeder
class TeacherSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'teacher@eduflow.test'],
            [
                'name'     => 'Arjun Kumar',
                'password' => Hash::make('Teacher@1234!'),
                'role'     => 'teacher',
                'active'   => true,
            ]
        );

        echo "  ✅ Teacher created: teacher@eduflow.test / Teacher@1234!\n";
    }
}

// Batch Seeder
class BatchSeeder extends Seeder
{
    public function run(): void
    {
        $teacher = User::where('role', 'teacher')->first();

        $batches = [
            ['name' => 'JEE Main 2026 - Morning', 'color' => '#6366f1', 'description' => 'Morning batch for JEE Main 2026'],
            ['name' => 'NEET 2026 - Evening',     'color' => '#10b981', 'description' => 'Evening batch for NEET 2026'],
            ['name' => 'Class 10 - Science',      'color' => '#3b82f6', 'description' => 'Class 10 Science batch'],
            ['name' => 'JEE Advanced 2026',       'color' => '#f59e0b', 'description' => 'Engineering entrance preparation'],
            ['name' => 'Class 12 - Commerce',     'color' => '#ef4444', 'description' => 'Class 12 Commerce batch'],
        ];

        foreach ($batches as $b) {
            Batch::updateOrCreate(['name' => $b['name']], [...$b, 'is_active' => true, 'teacher_id' => $teacher?->id]);
        }

        echo "  ✅ Batches created: " . count($batches) . " batches\n";
    }
}

// Student Seeder
class StudentSeeder extends Seeder
{
    public function run(): void
    {
        $batches  = Batch::all();
        $students = [
            ['name' => 'Priya Sharma',     'email' => 'priya@test.com'],
            ['name' => 'Rahul Verma',      'email' => 'rahul@test.com'],
            ['name' => 'Ananya Singh',     'email' => 'ananya@test.com'],
            ['name' => 'Karthik Reddy',    'email' => 'karthik@test.com'],
            ['name' => 'Sneha Patel',      'email' => 'sneha@test.com'],
            ['name' => 'Arjun Nair',       'email' => 'arjun@test.com'],
            ['name' => 'Divya Menon',      'email' => 'divya@test.com'],
            ['name' => 'Vikram Joshi',     'email' => 'vikram@test.com'],
            ['name' => 'Pooja Gupta',      'email' => 'pooja@test.com'],
            ['name' => 'Rohit Mishra',     'email' => 'rohit@test.com'],
        ];

        foreach ($students as $i => $s) {
            $student = User::updateOrCreate(
                ['email' => $s['email']],
                [
                    'name'     => $s['name'],
                    'password' => Hash::make('Student@1234!'),
                    'role'     => 'student',
                    'active'   => true,
                ]
            );

            // Assign to a batch (cycle through) and enroll in courses
            if ($batches->isNotEmpty()) {
                $batch = $batches->get($i % $batches->count());
                $student->batches()->syncWithoutDetaching([$batch->id => ['enrolled_at' => now()]]);

                // Enroll in batch courses
                $courses = $batch->courses()->get();
                foreach ($courses as $course) {
                    \Illuminate\Support\Facades\DB::table('enrollments')->insertOrIgnore([
                        'course_id'   => $course->id,
                        'user_id'     => $student->id,
                        'batch_id'    => $batch->id,
                        'status'      => 'active',
                        'enrolled_at' => now(),
                        'created_at'  => now(),
                        'updated_at'  => now(),
                    ]);
                }
            }
        }

        echo "  ✅ " . count($students) . " students seeded.\n";
    }
}

// Course Seeder
class CourseSeeder extends Seeder
{
    public function run(): void
    {
        $teacher = \App\Domains\Core\Models\User::where('role', 'teacher')->first()
            ?? \App\Domains\Core\Models\User::first();

        // Taxonomy lookups
        $jeeProgram  = \App\Domains\Academic\Models\Program::where('name', 'LIKE', '%JEE Main%')->first();
        $neetProgram = \App\Domains\Academic\Models\Program::where('name', 'LIKE', '%NEET%')->first();

        $subjects = \App\Domains\Academic\Models\Subject::whereIn('name', [
            'Physics', 'Chemistry', 'Mathematics', 'Biology'
        ])->get()->keyBy('name');

        // Map course-title keyword → subject name
        $subjectMap = [
            'Physics'      => 'Physics',    'Electro'     => 'Physics',
            'Wave'         => 'Physics',    'Thermo'      => 'Physics',
            'Modern'       => 'Physics',    'Chemistry'   => 'Chemistry',
            'Organic'      => 'Chemistry',  'Inorganic'   => 'Chemistry',
            'Chemical'     => 'Chemistry',  'Environment' => 'Chemistry',
            'Calculus'     => 'Mathematics','Mathematics' => 'Mathematics',
            'Matrices'     => 'Mathematics','Vector'      => 'Mathematics',
            'Probability'  => 'Mathematics','Biology'     => 'Biology',
            'Physiology'   => 'Biology',    'Plant'       => 'Biology',
            'Cell'         => 'Biology',    'Ecology'     => 'Biology',
        ];

        // Course definitions
        $courses = [
            ['title' => 'Physics Masterclass',              'subjectKey' => 'Physics'],
            ['title' => 'Chemistry Fundamentals',           'subjectKey' => 'Chemistry'],
            ['title' => 'Mathematics Advanced',             'subjectKey' => 'Mathematics'],
            ['title' => 'Biology Complete Guide',           'subjectKey' => 'Biology'],
            ['title' => 'Calculus Advanced',                'subjectKey' => 'Mathematics'],
            ['title' => 'Electromagnetism Masterclass',     'subjectKey' => 'Physics'],
            ['title' => 'Wave Optics & Sound',              'subjectKey' => 'Physics'],
            ['title' => 'Organic Synthesis Masterclass',    'subjectKey' => 'Chemistry'],
            ['title' => 'Inorganic Chemistry Guide',        'subjectKey' => 'Chemistry'],
            ['title' => 'Matrices & Determinants',          'subjectKey' => 'Mathematics'],
            ['title' => 'Human Physiology Masterclass',     'subjectKey' => 'Biology'],
            ['title' => 'Plant Physiology & Cycles',        'subjectKey' => 'Biology'],
            ['title' => 'Thermodynamics & Kinetic Theory',  'subjectKey' => 'Physics'],
            ['title' => 'Modern Physics & Quantum Theory',  'subjectKey' => 'Physics'],
            ['title' => 'Chemical Equilibrium & Kinetics',  'subjectKey' => 'Chemistry'],
            ['title' => 'Environmental & Analytical Chemistry', 'subjectKey' => 'Chemistry'],
            ['title' => 'Vector Algebra & 3D Geometry',     'subjectKey' => 'Mathematics'],
            ['title' => 'Probability & Mathematical Statistics', 'subjectKey' => 'Mathematics'],
            ['title' => 'Cell Biology & Biomolecules',      'subjectKey' => 'Biology'],
            ['title' => 'Ecology & Environmental Biology',  'subjectKey' => 'Biology'],
        ];

        $youtubeLibrary = [
            'Physics' => [
                ['title' => 'Units and Measurements Masterclass', 'url' => 'https://www.youtube.com/watch?v=Ft4OAWygeyg', 'duration' => 1245],
                ['title' => 'Motion in One Dimension & Kinematics', 'url' => 'https://www.youtube.com/watch?v=SJbXYVOc8po', 'duration' => 1420],
                ['title' => "Newton's Laws of Motion & Friction", 'url' => 'https://www.youtube.com/watch?v=Mw6VaQ1w7DI', 'duration' => 1650],
                ['title' => 'Work, Energy and Power Concepts', 'url' => 'https://www.youtube.com/watch?v=6VrsGXOE9N8', 'duration' => 1380],
                ['title' => 'Rotational Motion & Moment of Inertia', 'url' => 'https://www.youtube.com/watch?v=gFd7xPCeMk8', 'duration' => 1890],
                ['title' => 'Gravitation & Kepler Laws of Motion', 'url' => 'https://www.youtube.com/watch?v=Wb9N-fzIShk', 'duration' => 1520],
                ['title' => 'Electrostatics & Coulomb Law', 'url' => 'https://www.youtube.com/watch?v=i789NcTHewU', 'duration' => 1710],
                ['title' => 'Current Electricity & Kirchhoff Laws', 'url' => 'https://www.youtube.com/watch?v=U8yEH0rH_Jg', 'duration' => 1460],
                ['title' => 'Wave Optics & Interference Patterns', 'url' => 'https://www.youtube.com/watch?v=PXzGKUrps2A', 'duration' => 1600],
                ['title' => 'Thermodynamics & Kinetic Theory of Gases', 'url' => 'https://www.youtube.com/watch?v=5Wv8DZqS3uw', 'duration' => 1750],
            ],
            'Chemistry' => [
                ['title' => 'Atomic Structure & Quantum Mechanics', 'url' => 'https://www.youtube.com/watch?v=pv5oer3ZEEU', 'duration' => 1340],
                ['title' => 'Chemical Bonding & VSEPR Theory', 'url' => 'https://www.youtube.com/watch?v=j1zthPMilWA', 'duration' => 1510],
                ['title' => 'Chemical Thermodynamics & Enthalpy', 'url' => 'https://www.youtube.com/watch?v=5Wv8DZqS3uw', 'duration' => 1490],
                ['title' => 'Chemical Equilibrium & Le Chatelier Principle', 'url' => 'https://www.youtube.com/watch?v=6_BOzpFdfDg', 'duration' => 1620],
                ['title' => 'Organic Chemistry IUPAC Nomenclature', 'url' => 'https://www.youtube.com/watch?v=lPnIofjtueQ', 'duration' => 1780],
                ['title' => 'Hydrocarbons: Alkanes, Alkenes & Alkynes', 'url' => 'https://www.youtube.com/watch?v=Ft4OAWygeyg', 'duration' => 1410],
                ['title' => 'Solutions & Colligative Properties', 'url' => 'https://www.youtube.com/watch?v=SJbXYVOc8po', 'duration' => 1550],
                ['title' => 'Electrochemistry & Nernst Equation', 'url' => 'https://www.youtube.com/watch?v=Mw6VaQ1w7DI', 'duration' => 1680],
                ['title' => 'Surface Chemistry & Catalysis', 'url' => 'https://www.youtube.com/watch?v=bRsr7l0nbes', 'duration' => 1320],
                ['title' => 'Inorganic Chemistry Periodic Trends', 'url' => 'https://www.youtube.com/watch?v=PXzGKUrps2A', 'duration' => 1470],
            ],
            'Mathematics' => [
                ['title' => 'Sets, Relations & Functions Core Concepts', 'url' => 'https://www.youtube.com/watch?v=bRsr7l0nbes', 'duration' => 1390],
                ['title' => 'Trigonometry & Inverse Trigonometric Functions', 'url' => 'https://www.youtube.com/watch?v=6VrsGXOE9N8', 'duration' => 1580],
                ['title' => 'Complex Numbers & Quadratic Equations', 'url' => 'https://www.youtube.com/watch?v=gFd7xPCeMk8', 'duration' => 1640],
                ['title' => 'Matrices and Determinants Shortcuts', 'url' => 'https://www.youtube.com/watch?v=Wb9N-fzIShk', 'duration' => 1450],
                ['title' => 'Limits, Continuity & Differentiability', 'url' => 'https://www.youtube.com/watch?v=i789NcTHewU', 'duration' => 1720],
                ['title' => 'Differentiation & Chain Rule Masterclass', 'url' => 'https://www.youtube.com/watch?v=U8yEH0rH_Jg', 'duration' => 1510],
                ['title' => 'Integration & Definite Integral Properties', 'url' => 'https://www.youtube.com/watch?v=PXzGKUrps2A', 'duration' => 1830],
                ['title' => 'Vector Algebra & 3D Geometry Equations', 'url' => 'https://www.youtube.com/watch?v=pv5oer3ZEEU', 'duration' => 1690],
                ['title' => 'Probability & Mathematical Statistics', 'url' => 'https://www.youtube.com/watch?v=j1zthPMilWA', 'duration' => 1440],
                ['title' => 'Differential Equations & Degree Order', 'url' => 'https://www.youtube.com/watch?v=6_BOzpFdfDg', 'duration' => 1560],
            ],
            'Biology' => [
                ['title' => 'Cell Structure & Organelles', 'url' => 'https://www.youtube.com/watch?v=j1zthPMilWA', 'duration' => 1310],
                ['title' => 'Plant Physiology & Photosynthesis Light Reaction', 'url' => 'https://www.youtube.com/watch?v=5Wv8DZqS3uw', 'duration' => 1530],
                ['title' => 'Human Circulatory & Heart System', 'url' => 'https://www.youtube.com/watch?v=6_BOzpFdfDg', 'duration' => 1670],
                ['title' => 'Genetics: Mendel Laws & Inheritance', 'url' => 'https://www.youtube.com/watch?v=lPnIofjtueQ', 'duration' => 1810],
                ['title' => 'Human Digestive & Excretory System', 'url' => 'https://www.youtube.com/watch?v=Ft4OAWygeyg', 'duration' => 1490],
                ['title' => 'Ecology, Organisms & Environment', 'url' => 'https://www.youtube.com/watch?v=SJbXYVOc8po', 'duration' => 1420],
                ['title' => 'Molecular Basis of Inheritance (DNA & RNA)', 'url' => 'https://www.youtube.com/watch?v=Mw6VaQ1w7DI', 'duration' => 1740],
                ['title' => 'Biotechnology: Principles and Processes', 'url' => 'https://www.youtube.com/watch?v=6VrsGXOE9N8', 'duration' => 1590],
                ['title' => 'Reproductive Health & Human Development', 'url' => 'https://www.youtube.com/watch?v=gFd7xPCeMk8', 'duration' => 1500],
                ['title' => 'Human Health & Diseases Overview', 'url' => 'https://www.youtube.com/watch?v=Wb9N-fzIShk', 'duration' => 1480],
            ]
        ];

        $courseIdx = 0;

        foreach ($courses as $cData) {
            $subjectName = $cData['subjectKey'];
            $subject     = $subjects[$subjectName] ?? null;
            $program     = ($subjectName === 'Biology') ? $neetProgram : $jeeProgram;

            // Distribute across all 4 batches so every batch gets some courses
            $batchName = match($subjectName) {
                'Biology'     => 'NEET 2026 - Evening',
                'Physics'     => ($courseIdx % 2 === 0) ? 'JEE Advanced 2026' : 'JEE Main 2026 - Morning',
                'Chemistry'   => ($courseIdx % 2 === 0) ? 'JEE Advanced 2026' : 'Class 10 - Science',
                'Mathematics' => ($courseIdx % 2 === 0) ? 'JEE Main 2026 - Morning' : 'Class 12 - Commerce',
                default       => 'JEE Advanced 2026',
            };

            $thumbnails = [
                'Physics'     => '/images/physics_thumb.png',
                'Chemistry'   => '/images/chemistry_thumb.png',
                'Mathematics' => '/images/maths_thumb.png',
                'Biology'     => '/images/biology_thumb.png',
            ];

            $course = \App\Models\Course::updateOrCreate(
                ['title' => $cData['title']],
                [
                    'description' => $cData['title'] . ' - Comprehensive course covering core topics for board and entrance exams.',
                    'thumbnail'   => $thumbnails[$subjectName] ?? '/images/default_thumb.png',
                    'status'      => 'published',
                    'teacher_id'  => $teacher->id,
                    'program_id'  => $program?->id,
                    'subject_id'  => $subject?->id,
                ]
            );

            // Attach to batch
            $batch = \App\Domains\Core\Models\Batch::where('name', $batchName)->first();
            if ($batch) {
                $course->batches()->syncWithoutDetaching([$batch->id]);
            }

            $subjectYtList = $youtubeLibrary[$subjectName] ?? $youtubeLibrary['Physics'];

            // 2 modules per course, 1 chapter each, 5 lessons per chapter = 10 lessons/course
            foreach (['Foundations of', 'Advanced Concepts in'] as $mIdx => $modulePrefix) {
                $module = \App\Models\CourseModule::updateOrCreate(
                    ['course_id' => $course->id, 'title' => "{$modulePrefix} {$cData['title']}"],
                    ['sort_order' => $mIdx]
                );

                $chapter = \App\Domains\Course\Models\CourseChapter::updateOrCreate(
                    ['module_id' => $module->id, 'title' => "Chapter 1: {$modulePrefix} {$cData['title']}"],
                    ['sort_order' => 0]
                );

                for ($lIdx = 0; $lIdx < 5; $lIdx++) {
                    $lessonNumber = ($mIdx * 5) + $lIdx + 1;
                    $isFree       = ($lessonNumber === 1);

                    $ytItem = $subjectYtList[($lessonNumber - 1) % count($subjectYtList)];
                    $title  = "Session {$lessonNumber}: " . $ytItem['title'];
                    $ytUrl  = $ytItem['url'];
                    preg_match('/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/', $ytUrl, $matches);
                    $ytId   = $matches[1] ?? 'Ft4OAWygeyg';

                    // Create lesson
                    $lesson = \App\Models\Lesson::updateOrCreate(
                        ['chapter_id' => $chapter->id, 'title' => $title],
                        [
                            'type'             => 'video',
                            'is_free_preview'  => $isFree,
                            'duration_seconds' => $ytItem['duration'],
                            'sort_order'       => $lIdx,
                        ]
                    );

                    // Create primary video media record
                    $primaryMedia = \App\Domains\Media\Models\Media::create([
                        'name'              => $title,
                        'original_name'     => $ytUrl,
                        'type'              => 'video',
                        'provider'          => 'youtube',
                        'mime'              => 'video/youtube',
                        'mime_type'         => 'video/youtube',
                        'path'              => $ytId,
                        'filename'          => $title,
                        'duration'          => $ytItem['duration'],
                        'size_bytes'        => 0,
                        'uploaded_by'       => $teacher->id,
                        'processing_status' => 'ready',
                        'visibility'        => 'public',
                    ]);

                    // Attach via media_links polymorphic pivot
                    \Illuminate\Support\Facades\DB::table('media_links')->insertOrIgnore([
                        'media_id'      => $primaryMedia->id,
                        'entity_type'   => 'App\\Domains\\Course\\Models\\Lesson',
                        'entity_id'     => $lesson->id,
                        'link_type'     => 'primary',
                        'display_order' => 0,
                        'is_required'   => true,
                        'created_by'    => $teacher->id,
                        'created_at'    => now(),
                        'updated_at'    => now(),
                    ]);

                    // Every 3rd lesson: attach a PDF download
                    if ($lessonNumber % 3 === 1) {
                        $pdfName  = "Lecture_Notes_Session_{$lessonNumber}.pdf";
                        $pdfMedia = \App\Domains\Media\Models\Media::create([
                            'name'              => $pdfName,
                            'original_name'     => $pdfName,
                            'type'              => 'document',
                            'provider'          => 'local',
                            'mime'              => 'application/pdf',
                            'mime_type'         => 'application/pdf',
                            'extension'         => 'pdf',
                            'path'              => "/materials/lesson_notes_{$lessonNumber}.pdf",
                            'filename'          => $pdfName,
                            'size_bytes'        => 1887436,
                            'size'              => 1887436,
                            'uploaded_by'       => $teacher->id,
                            'processing_status' => 'ready',
                            'visibility'        => 'private',
                        ]);

                        \Illuminate\Support\Facades\DB::table('media_links')->insertOrIgnore([
                            'media_id'      => $pdfMedia->id,
                            'entity_type'   => 'App\\Domains\\Course\\Models\\Lesson',
                            'entity_id'     => $lesson->id,
                            'link_type'     => 'download',
                            'display_order' => 1,
                            'is_required'   => false,
                            'created_by'    => $teacher->id,
                            'created_at'    => now(),
                            'updated_at'    => now(),
                        ]);
                    }
                }
            }

            $courseIdx++;
        }

        echo "  ✅ " . count($courses) . " courses seeded with taxonomy links, modules, chapters, lessons & media.\n";
    }
}

// Settings Seeder
class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            'app_name'         => config('app.name', 'EduFlow'),
            'app_url'          => config('app.url', 'http://localhost'),
            'smtp_host'        => config('mail.mailers.smtp.host', 'smtp.mailtrap.io'),
            'smtp_port'        => config('mail.mailers.smtp.port', '2525'),
            'smtp_from'        => config('mail.from.address', 'noreply@eduflow.ai'),
            'storage_provider' => 'local',
            'fcm_server_key'   => '',
            
            // Dynamic Favicon and SEO Settings
            'favicon_url'      => '/favicon.ico',
            'seo_title'        => 'EduFlow - Online Tuition & Private Batch Classroom',
            'seo_description'  => 'Interactive live classes, recorded video lectures, premium study notes, and dynamic progress trackers hosted directly by your teacher.',
            'seo_keywords'     => 'online tuition, physics neet, chemistry jee, maths tuition, private batch, eduflow',

            // About Page Config
            'landing_about_config' => json_encode([
                'teacher' => [
                    'name'  => 'Arjun Kumar',
                    'role'  => 'Lead Physics & Science Educator',
                    'bio'   => 'I believe that learning science should not be about memorization. It is about visualization and understanding. Over the last 8+ years, I have coached thousands of high-schoolers in offline batches, transitioning to a dedicated private online model to provide interactive personal support.',
                    'stats' => [
                        ['value' => '8+',    'label' => 'Years Experience',    'icon' => 'User'],
                        ['value' => '150+',  'label' => 'Offline Batches',     'icon' => 'Play'],
                        ['value' => '10K+',  'label' => 'Students Mentored',   'icon' => 'Users'],
                        ['value' => '95%',   'label' => 'Successful Selections','icon' => 'Award']
                    ]
                ],
                'vision'  => 'To make top-tier conceptual science coaching accessible directly to private student batches, removing distracting marketplace platforms and focusing purely on progress metrics.',
                'mission' => 'Guiding students systematically with structured daily video modules, downloadable PDF worksheets, doubts desk chat, and auto-graded mock examinations.',
                'timeline' => [
                    [
                        'period' => '2022 - Present',
                        'title'  => 'EduFlow Platform',
                        'desc'   => 'Launched a private online portal serving target groups in NEET and JEE preparation, connecting students with structured dashboards.',
                        'active' => true
                    ],
                    [
                        'period' => '2018 - 2022',
                        'title'  => 'Senior Faculty - Coaching Institute',
                        'desc'   => 'Led the Physics division for national-level medical preparation coaching, guiding batches of 150+ students offline.',
                        'active' => false
                    ]
                ],
                'approach' => [
                    'title'    => 'Our Teaching Approach',
                    'subtitle' => 'Conceptual • Visual • Interactive'
                ]
            ]),
            
            // CMS Landing Page Config
            'landing_hero_title'     => 'Learn Smarter. Achieve More.',
            'landing_hero_subtitle'  => 'Join live interactive classes, watch recorded lessons, access premium study materials and accelerate your learning journey with expert guidance.',
            'landing_hero_cta_text'  => 'Explore Courses',
            'landing_hero_video_url' => config('app.fallback_video_url', 'https://vimeo.com/123456789'),
            
            'landing_nav_links' => json_encode([
                ['label' => 'Home', 'to' => '/'],
                ['label' => 'About', 'to' => '/about'],
                ['label' => 'Courses', 'to' => '/courses'],
                ['label' => 'Live Classes', 'to' => '/live-classes'],
                ['label' => 'Testimonials', 'to' => '/testimonials'],
                ['label' => 'FAQ', 'to' => '/faq'],
                ['label' => 'Contact', 'to' => '/contact']
            ]),

            'landing_features' => json_encode([
                ['title' => 'Live Classes', 'desc' => 'Join live sessions and interact in real-time.', 'icon' => 'Tv'],
                ['title' => 'Recorded Lectures', 'desc' => 'High quality video lessons anytime, anywhere.', 'icon' => 'Play'],
                ['title' => 'Study Materials', 'desc' => 'Notes, PDFs, assignments and practice papers.', 'icon' => 'FileText'],
                ['title' => 'Test & Quizzes', 'desc' => 'Take tests, track scores and improve.', 'icon' => 'CheckSquare'],
                ['title' => 'Progress Tracking', 'desc' => 'Detailed analytics to monitor your growth.', 'icon' => 'BarChart']
            ]),

            'landing_why_choose' => json_encode([
                ['title' => 'Expert Faculty', 'desc' => 'Learn from highly experienced and passionate teachers.', 'icon' => 'GraduationCap'],
                ['title' => 'Flexible Learning', 'desc' => 'Learn at your own pace with lifetime access to recorded lectures.', 'icon' => 'Play'],
                ['title' => 'Safe & Secure', 'desc' => 'Your data and privacy are our top priority always.', 'icon' => 'Layers'],
                ['title' => 'Doubt Support', 'desc' => 'Get your doubts solved quickly by teachers and support team.', 'icon' => 'Users'],
                ['title' => 'Performance Analytics', 'desc' => 'Track your progress with detailed reports and insights.', 'icon' => 'BarChart'],
                ['title' => 'Learn Anywhere', 'desc' => 'Access on any device - mobile, tablet, or desktop.', 'icon' => 'Tv']
            ]),

            'landing_testimonials' => json_encode([
                ['name' => 'Aarav Sharma', 'role' => 'Class 12th Student', 'quote' => 'EduFlow has completely changed the way I study. The concept clarity and practice questions helped me score 98% in boards!', 'initials' => 'AS', 'variant' => 'violet'],
                ['name' => 'Riya Singh', 'role' => 'JEE Aspirant', 'quote' => 'Live classes are interactive and doubts are cleared instantly. Best platform for JEE preparation!', 'initials' => 'RS', 'variant' => 'emerald'],
                ['name' => 'Kabir Verma', 'role' => 'NEET Aspirant', 'quote' => 'The study materials and tests are top quality. I can track my progress and improve everyday.', 'initials' => 'KV', 'variant' => 'orange']
            ]),

            'landing_faqs' => json_encode([
                ['question' => 'How do I get an invitation or enrollment code?', 'answer' => 'Since this is a private digital classroom run directly by your teacher, you must contact the teacher or admin directly to receive an invite link or login credentials. Self-registration is disabled for safety and batch control.'],
                ['question' => 'Can I download study notes and watch lectures offline?', 'answer' => 'Yes. Lectures can be watched anytime via our platform, and PDF notes, assignments, and test guides are fully downloadable for offline review and writing practice.'],
                ['question' => 'Are live classes recorded for later viewing?', 'answer' => 'Absolutely. If you miss a live session, a high-quality cloud recording is automatically uploaded to your student dashboard under the corresponding course batch within a few hours.'],
                ['question' => 'What devices are supported?', 'answer' => 'You can access the portal from any device with a modern web browser. The responsive interface is optimized for desktops, laptops, tablets, and mobile smartphones alike.']
            ]),

            'landing_footer_links' => json_encode([
                'quick_links' => [
                    ['label' => 'Home', 'to' => '/'],
                    ['label' => 'Features', 'section' => 'features'],
                    ['label' => 'Courses', 'section' => 'courses'],
                    ['label' => 'Testimonials', 'section' => 'testimonials']
                ],
                'resources' => [
                    ['label' => 'Practice Tests', 'to' => '#'],
                    ['label' => 'Live Schedule', 'to' => '#'],
                    ['label' => 'Assignments', 'to' => '#']
                ],
                'legal' => [
                    ['label' => 'Privacy Policy', 'to' => '#'],
                    ['label' => 'Terms of Service', 'to' => '#'],
                    ['label' => 'Refund Policy', 'to' => '#'],
                    ['label' => 'Disclaimer', 'to' => '#']
                ],
                'contact' => [
                    'email' => 'support@eduflow.in',
                    'phone' => '+91 12345 67890',
                    'hours' => 'Mon - Sat: 9:00 AM - 8:00 PM'
                ]
            ]),

            'google_client_id' => '789123456789-xxxx.apps.googleusercontent.com',
            'google_auth_endpoint' => 'https://tuition.imakshay.in/api_backend/public/api/v1/auth/google',
            'api_base_url' => 'https://tuition.imakshay.in/api_backend/public/api/v1',

            'landing_social_links' => json_encode([
                ['platform' => 'youtube', 'url' => '#'],
                ['platform' => 'instagram', 'url' => '#'],
                ['platform' => 'telegram', 'url' => '#']
            ]),
        ];

        foreach ($defaults as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        echo "  ✅ Settings seeded successfully.\n";
    }
}
