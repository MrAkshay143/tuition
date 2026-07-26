<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Domains\Core\Models\User;
use App\Domains\Core\Models\Batch;

class AssessmentSeeder extends Seeder
{
    public function run(): void
    {
        $teacher = User::where('role', 'teacher')->first() ?? User::first();
        $students = User::where('role', 'student')->get();
        $batches = Batch::all();

        if ($students->isEmpty() || $batches->isEmpty()) {
            return;
        }

        $jeeBatch   = Batch::where('name', 'LIKE', '%JEE%')->first() ?? $batches->first();
        $neetBatch  = Batch::where('name', 'LIKE', '%NEET%')->first() ?? $batches->first();
        $class10    = Batch::where('name', 'LIKE', '%10%')->first() ?? $batches->first();

        // Assignments
        $assignments = [
            [
                'title'       => 'Physics Electromagnetism Problem Set 1',
                'description' => 'Complete all 10 numerical problems from Lorentz force and Magnetic Induction chapter. Show full step-by-step derivation.',
                'due_at'      => now()->addDays(5),
                'max_marks'   => 50,
                'batch_id'    => $jeeBatch->id,
            ],
            [
                'title'       => 'Organic Chemistry Reactions Worksheet',
                'description' => 'Solve mechanisms for Electrophilic Addition and Nucleophilic Substitution reactions.',
                'due_at'      => now()->addDays(3),
                'max_marks'   => 100,
                'batch_id'    => $jeeBatch->id,
            ],
            [
                'title'       => 'Biology Genetics & Inheritance Case Study',
                'description' => 'Analyze Mendelian dihybrid cross ratios and solve pedigree chart problems provided in the attached PDF.',
                'due_at'      => now()->addDays(7),
                'max_marks'   => 50,
                'batch_id'    => $neetBatch->id,
            ],
            [
                'title'       => 'Mathematics Calculus Integration Exercises',
                'description' => 'Evaluate definite and indefinite integrals from Exercise 7.4 to 7.8.',
                'due_at'      => now()->subDays(2), // Past due
                'max_marks'   => 40,
                'batch_id'    => $class10->id,
            ],
        ];

        foreach ($assignments as $aData) {
            $batchId = $aData['batch_id'];
            unset($aData['batch_id']);

            $assignmentId = DB::table('assignments')->insertGetId([
                ...$aData,
                'teacher_id' => $teacher->id,
                'created_by' => $teacher->id,
                'created_at' => now()->subDays(2),
                'updated_at' => now(),
            ]);

            // Attach to batch
            DB::table('assignment_batch')->insertOrIgnore([
                'assignment_id' => $assignmentId,
                'batch_id'      => $batchId,
            ]);

            // Seed submissions for students in that batch
            $batchStudents = User::whereHas('batches', fn($q) => $q->where('batches.id', $batchId))->get();
            foreach ($batchStudents as $idx => $student) {
                $status = ($idx % 2 === 0) ? 'reviewed' : 'submitted';
                $score  = rand((int)($aData['max_marks'] * 0.7), $aData['max_marks']);

                DB::table('assignment_submissions')->insert([
                    'assignment_id' => $assignmentId,
                    'student_id'    => $student->id,
                    'answer'        => "Respected Sir, here is my completed submission for {$aData['title']}. I have solved all questions with diagrammatic representation.",
                    'attachment'    => "/uploads/submissions/sub_{$assignmentId}_{$student->id}.pdf",
                    'status'        => $status,
                    'grade'         => ($status === 'reviewed') ? $score : null,
                    'feedback'      => ($status === 'reviewed') ? "Excellent effort! Clean step-by-step calculations." : null,
                    'submitted_at'  => now()->subHours(rand(2, 24)),
                    'reviewed_at'   => ($status === 'reviewed') ? now()->subHours(1) : null,
                    'created_at'    => now()->subHours(rand(2, 24)),
                    'updated_at'    => now(),
                ]);
            }
        }

        // Exams and question bank
        $examsData = [
            [
                'title'                    => 'JEE Main Physics Full Syllabus Speed Test 1',
                'description'              => 'Timed competitive exam covering Mechanics, Electromagnetism, Modern Physics, and Optics.',
                'type'                     => 'mcq',
                'duration_minutes'         => 60,
                'total_marks'              => 100,
                'pass_marks'               => 40,
                'starts_at'                => now()->subDays(1),
                'ends_at'                  => now()->addDays(10),
                'show_result_immediately'  => true,
                'shuffle_questions'        => true,
                'batch_id'                 => $jeeBatch->id,
                'questions'                => [
                    [
                        'question'       => 'What is the SI unit of magnetic flux density?',
                        'options'        => json_encode(['Weber', 'Tesla', 'Gauss', 'Henry']),
                        'correct_answer' => 'Tesla',
                        'marks'          => 20,
                    ],
                    [
                        'question'       => 'Two forces of 3N and 4N act perpendicularly. What is the magnitude of their resultant force?',
                        'options'        => json_encode(['5 N', '7 N', '1 N', '12 N']),
                        'correct_answer' => '5 N',
                        'marks'          => 20,
                    ],
                    [
                        'question'       => 'Which electromagnetic wave has the highest frequency?',
                        'options'        => json_encode(['Radio Waves', 'X-rays', 'Gamma Rays', 'Infrared']),
                        'correct_answer' => 'Gamma Rays',
                        'marks'          => 20,
                    ],
                    [
                        'question'       => 'The work done by a centripetal force on an object in uniform circular motion is:',
                        'options'        => json_encode(['Positive', 'Negative', 'Zero', 'Infinite']),
                        'correct_answer' => 'Zero',
                        'marks'          => 20,
                    ],
                    [
                        'question'       => 'Light of wavelength 600 nm enters a medium of refractive index 1.5. What is the speed of light in the medium?',
                        'options'        => json_encode(['2 × 10⁸ m/s', '3 × 10⁸ m/s', '1.5 × 10⁸ m/s', '4.5 × 10⁸ m/s']),
                        'correct_answer' => '2 × 10⁸ m/s',
                        'marks'          => 20,
                    ],
                ]
            ],
            [
                'title'                    => 'NEET Biology High-Yield Genetics & Cell Biology Quiz',
                'description'              => '30-minute quick evaluation test for medical aspirants.',
                'type'                     => 'mcq',
                'duration_minutes'         => 30,
                'total_marks'              => 50,
                'pass_marks'               => 25,
                'starts_at'                => now()->subDays(2),
                'ends_at'                  => now()->addDays(5),
                'show_result_immediately'  => true,
                'shuffle_questions'        => false,
                'batch_id'                 => $neetBatch->id,
                'questions'                => [
                    [
                        'question'       => 'Which organelle is known as the powerhouse of the cell?',
                        'options'        => json_encode(['Ribosome', 'Mitochondria', 'Golgi Body', 'Lysosome']),
                        'correct_answer' => 'Mitochondria',
                        'marks'          => 25,
                    ],
                    [
                        'question'       => 'What ratio is expected in a Mendelian monohybrid cross phenotype?',
                        'options'        => json_encode(['1:2:1', '9:3:3:1', '3:1', '1:1']),
                        'correct_answer' => '3:1',
                        'marks'          => 25,
                    ],
                ]
            ],
        ];

        foreach ($examsData as $eItem) {
            $batchId = $eItem['batch_id'];
            $qList   = $eItem['questions'];
            unset($eItem['batch_id'], $eItem['questions']);

            $examId = DB::table('exams')->insertGetId([
                ...$eItem,
                'teacher_id' => $teacher->id,
                'created_by' => $teacher->id,
                'created_at' => now()->subDays(3),
                'updated_at' => now(),
            ]);

            // Link exam to batch
            DB::table('exam_batch')->insertOrIgnore([
                'exam_id'  => $examId,
                'batch_id' => $batchId,
            ]);

            // Add questions
            $questionIds = [];
            foreach ($qList as $sOrder => $q) {
                // Insert into global questions table first
                $qId = DB::table('questions')->insertGetId([
                    'content'        => $q['question'],
                    'type'           => 'mcq',
                    'options'        => $q['options'],
                    'correct_answer' => $q['correct_answer'],
                    'default_marks'  => $q['marks'],
                    'teacher_id'     => $teacher->id,
                    'is_active'      => true,
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ]);
                $questionIds[] = $qId;

                // Attach to exam_question_bank
                DB::table('exam_question_bank')->insert([
                    'exam_id'        => $examId,
                    'question_id'    => $qId,
                    'marks'          => $q['marks'],
                    'sort_order'     => $sOrder + 1,
                ]);
            }

            // Seed attempts for students
            $batchStudents = User::whereHas('batches', fn($q) => $q->where('batches.id', $batchId))->get();
            foreach ($batchStudents as $student) {
                $score      = rand(30, $eItem['total_marks']);
                $percentage = round(($score / $eItem['total_marks']) * 100, 1);
                $passed     = $score >= $eItem['pass_marks'];

                $answers = [];
                foreach ($questionIds as $idx => $qid) {
                    // Randomly select index 0, 1, 2, or 3 based on correct answer logic in real life.
                    // For mock, just put a random string or the correct index.
                    // Actually, the resource evaluates using (string)$studentAnswer === (string)$q->correct_answer
                    // We know qList has options and correct_answer as string.
                    // E.g., 'Tesla'
                    // For simplicity, we just put some option from the question.
                    $qData = $qList[$idx];
                    $options = json_decode($qData['options'], true);
                    $answers[$qid] = (rand(0, 100) > 30) ? $qData['correct_answer'] : $options[array_rand($options)];
                }

                $attemptId = DB::table('exam_attempts')->insertGetId([
                    'exam_id'      => $examId,
                    'student_id'   => $student->id,
                    'score'        => $score,
                    'percentage'   => $percentage,
                    'passed'       => $passed,
                    'answers'      => json_encode($answers),
                    'started_at'   => now()->subHours(3),
                    'submitted_at' => now()->subHours(2),
                    'created_at'   => now()->subHours(3),
                    'updated_at'   => now()->subHours(2),
                ]);

                // Seed security logs for the attempt
                $logTypes = [
                    ['type' => 'tab_switch', 'severity' => 'warning', 'details' => json_encode(['switched_to' => 'Google', 'duration' => '15s'])],
                    ['type' => 'fullscreen_exit', 'severity' => 'warning', 'details' => json_encode(['duration' => '5s'])],
                    ['type' => 'right_click', 'severity' => 'info', 'details' => json_encode(['element' => 'question_body'])]
                ];
                
                // Add 1-3 random logs
                for ($i = 0; $i < rand(1, 3); $i++) {
                    $log = $logTypes[array_rand($logTypes)];
                    DB::table('exam_security_logs')->insert([
                        'exam_attempt_id' => $attemptId,
                        'event_type'      => $log['type'],
                        'severity'        => $log['severity'],
                        'details'         => $log['details'],
                        'created_at'      => now()->subHours(3)->addMinutes(rand(5, 50)),
                        'updated_at'      => now(),
                    ]);
                }

                // Certificates
                if ($passed) {
                    $certNo = 'CERT-' . date('Y') . '-' . strtoupper(substr(md5($attemptId . $student->id), 0, 6));
                    DB::table('certificates')->insertOrIgnore([
                        'user_id'         => $student->id,
                        'course_id'       => 1, // Default main course
                        'exam_attempt_id' => $attemptId,
                        'type'            => 'exam',
                        'certificate_no'  => $certNo,
                        'pdf_url'         => "/certificates/{$certNo}.pdf",
                        'qr_code'         => "https://api.qrserver.com/v1/create-qr-code/?data={$certNo}",
                        'issued_at'       => now(),
                        'teacher_id'      => $teacher->id,
                        'created_by'      => $teacher->id,
                        'created_at'      => now(),
                        'updated_at'      => now(),
                    ]);
                }
            }
        }

        // ── Seed Global Question Bank Tables (topics, difficulties, questions) ───────
        $diffEasy = DB::table('difficulties')->insertGetId([
            'name' => 'Easy', 'level' => 1, 'created_at' => now(), 'updated_at' => now()
        ]);
        $diffMed = DB::table('difficulties')->insertGetId([
            'name' => 'Medium', 'level' => 2, 'created_at' => now(), 'updated_at' => now()
        ]);
        $diffHard = DB::table('difficulties')->insertGetId([
            'name' => 'Hard', 'level' => 3, 'created_at' => now(), 'updated_at' => now()
        ]);

        $phySubject = DB::table('subjects')->where('name', 'LIKE', '%Physics%')->first();
        $chemSubject = DB::table('subjects')->where('name', 'LIKE', '%Chemistry%')->first();
        $mathSubject = DB::table('subjects')->where('name', 'LIKE', '%Math%')->first();

        $topicKinematics = DB::table('topics')->insertGetId([
            'subject_id' => $phySubject?->id ?? 1, 'name' => 'Kinematics & Circular Motion', 'description' => 'Motion in 1D, 2D and rotational kinematics', 'created_at' => now(), 'updated_at' => now()
        ]);
        $topicOrganic = DB::table('topics')->insertGetId([
            'subject_id' => $chemSubject?->id ?? 2, 'name' => 'Stereochemistry & Reaction Mechanisms', 'description' => 'Chirality and electrophilic addition', 'created_at' => now(), 'updated_at' => now()
        ]);
        $topicCalculus = DB::table('topics')->insertGetId([
            'subject_id' => $mathSubject?->id ?? 3, 'name' => 'Definite Integrals & Calculus', 'description' => 'Integration properties and applications', 'created_at' => now(), 'updated_at' => now()
        ]);

        $globalQuestions = [
            [
                'topic_id' => $topicKinematics,
                'difficulty_id' => $diffMed,
                'teacher_id' => $teacher->id,
                'content' => 'A particle moves in a circle of radius R with constant speed v. What is the magnitude of its average acceleration during a quarter revolution?',
                'type' => 'mcq',
                'options' => json_encode([
                    ['key' => 'A', 'text' => 'v² / R', 'is_correct' => false],
                    ['key' => 'B', 'text' => '(2√2 v²) / (π R)', 'is_correct' => true],
                    ['key' => 'C', 'text' => '(√2 v²) / R', 'is_correct' => false],
                    ['key' => 'D', 'text' => '(2 v²) / (π R)', 'is_correct' => false]
                ]),
                'correct_answer' => 'B',
                'solution_explanation' => 'Average acceleration = Δv / Δt. In a quarter circle, Δv = √2 v and Δt = (π R) / (2 v).',
                'default_marks' => 4,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'topic_id' => $topicOrganic,
                'difficulty_id' => $diffEasy,
                'teacher_id' => $teacher->id,
                'content' => 'Which of the following compounds exhibits optical isomerism and has a chiral center?',
                'type' => 'mcq',
                'options' => json_encode([
                    ['key' => 'A', 'text' => '2-Chlorobutane', 'is_correct' => true],
                    ['key' => 'B', 'text' => '1-Chlorobutane', 'is_correct' => false],
                    ['key' => 'C', 'text' => 'Propane-1,3-diol', 'is_correct' => false],
                    ['key' => 'D', 'text' => '2-Methylpropane', 'is_correct' => false]
                ]),
                'correct_answer' => 'A',
                'solution_explanation' => '2-Chlorobutane has a C atom bonded to four different groups (-H, -Cl, -CH3, -CH2CH3).',
                'default_marks' => 4,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'topic_id' => $topicCalculus,
                'difficulty_id' => $diffHard,
                'teacher_id' => $teacher->id,
                'content' => 'Evaluate the definite integral: ∫ (from 0 to π/2) [ sin(x) / (sin(x) + cos(x)) ] dx.',
                'type' => 'numerical',
                'options' => json_encode([]),
                'correct_answer' => '0.785',
                'solution_explanation' => 'Using King property ∫f(x)dx = ∫f(a+b-x)dx, 2I = ∫1 dx = π/2 => I = π/4 (~0.785).',
                'default_marks' => 4,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($globalQuestions as $gq) {
            DB::table('questions')->insert($gq);
        }

        echo "  ✅ AssessmentSeeder complete: assignments, submissions, exams, global questions, attempts & certificates seeded.\n";
    }
}
