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

        // ── 1. ASSIGNMENTS ───────────────────────────────────────────────────
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

        // ── 2. EXAMS & QUESTION BANK ─────────────────────────────────────────
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
            foreach ($qList as $sOrder => $q) {
                DB::table('exam_questions')->insert([
                    'exam_id'        => $examId,
                    'question'       => $q['question'],
                    'type'           => 'mcq',
                    'options'        => $q['options'],
                    'correct_answer' => $q['correct_answer'],
                    'marks'          => $q['marks'],
                    'sort_order'     => $sOrder + 1,
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ]);
            }

            // Seed attempts for students
            $batchStudents = User::whereHas('batches', fn($q) => $q->where('batches.id', $batchId))->get();
            foreach ($batchStudents as $student) {
                $score      = rand(30, $eItem['total_marks']);
                $percentage = round(($score / $eItem['total_marks']) * 100, 1);
                $passed     = $score >= $eItem['pass_marks'];

                $attemptId = DB::table('exam_attempts')->insertGetId([
                    'exam_id'      => $examId,
                    'student_id'   => $student->id,
                    'score'        => $score,
                    'percentage'   => $percentage,
                    'passed'       => $passed,
                    'answers'      => json_encode(['q1' => 'Option A', 'q2' => 'Option B']),
                    'started_at'   => now()->subHours(3),
                    'submitted_at' => now()->subHours(2),
                    'created_at'   => now()->subHours(3),
                    'updated_at'   => now()->subHours(2),
                ]);

                // ── 3. CERTIFICATES ──────────────────────────────────────────
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

        echo "  ✅ AssessmentSeeder complete: assignments, submissions, exams, questions, attempts & certificates seeded.\n";
    }
}
