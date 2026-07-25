<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Domains\Core\Models\User;
use App\Domains\Core\Models\Batch;
use App\Domains\Course\Models\Lesson;
use App\Domains\Course\Models\Course;

class LearningProgressSeeder extends Seeder
{
    public function run(): void
    {
        $teacher  = User::where('role', 'teacher')->first() ?? User::first();
        $students = User::where('role', 'student')->get();
        $lessons  = Lesson::limit(40)->get();
        $batches  = Batch::all();

        if ($students->isEmpty() || $lessons->isEmpty()) {
            return;
        }

        // ── 1. LESSON PROGRESS ───────────────────────────────────────────────
        foreach ($students as $studentIdx => $student) {
            // Determine progress percent based on student index
            $lessonsToCompleteCount = match($studentIdx % 3) {
                0 => 8,  // High completion
                1 => 5,  // Medium completion
                2 => 3,  // Starting out
            };

            $studentLessons = $lessons->take($lessonsToCompleteCount);
            foreach ($studentLessons as $lIdx => $lesson) {
                $completed = true;
                $watchedSeconds = $lesson->duration_seconds ?: 900;

                DB::table('lesson_progress')->insertOrIgnore([
                    'user_id'         => $student->id,
                    'lesson_id'       => $lesson->id,
                    'completed'       => $completed,
                    'watched_seconds' => $watchedSeconds,
                    'completed_at'    => now()->subDays(rand(1, 10)),
                    'created_at'      => now()->subDays(rand(1, 10)),
                    'updated_at'      => now(),
                ]);

                // ── 2. STUDENT BOOKMARKS ─────────────────────────────────────
                if ($lIdx === 0 || $lIdx === 3) {
                    DB::table('student_bookmarks')->insertOrIgnore([
                        'user_id'                 => $student->id,
                        'lesson_id'               => $lesson->id,
                        'video_timestamp_seconds' => rand(120, 600),
                        'note'                    => "Key formula derivation for {$lesson->title}. Must review before mock test!",
                        'created_at'              => now()->subDays(rand(1, 5)),
                        'updated_at'              => now(),
                    ]);
                }
            }
        }

        // ── 3. TEACHER NOTES & PDFS ──────────────────────────────────────────
        $teacherNotes = [
            [
                'title'           => 'Physics Electromagnetism Complete Formula Sheet PDF',
                'description'     => 'Comprehensive handwritten notes and equation summary for Biot-Savart Law and Ampere Law.',
                'file_path'       => '/materials/physics_formula_sheet_2026.pdf',
                'file_type'       => 'pdf',
                'file_size_bytes' => 2458900,
                'is_public'       => true,
            ],
            [
                'title'           => 'Organic Chemistry Reaction Mechanisms Mindmap',
                'description'     => 'Visual diagram mapping SN1 vs SN2 and E1 vs E2 elimination pathways.',
                'file_path'       => '/materials/organic_chem_mindmap.pdf',
                'file_type'       => 'pdf',
                'file_size_bytes' => 1845100,
                'is_public'       => true,
            ],
            [
                'title'           => 'Mathematics Calculus Integration Formula & Tricks Sheet',
                'description'     => 'Handy shortcuts and standard integration identities for JEE Advanced 2026.',
                'file_path'       => '/materials/calculus_shortcuts.pdf',
                'file_type'       => 'pdf',
                'file_size_bytes' => 3120000,
                'is_public'       => true,
            ],
            [
                'title'           => 'NEET Biology High-Yield Diagrams & Pedigree Charts',
                'description'     => 'Fully labeled biology diagrams and genetics pedigree charts for quick revision.',
                'file_path'       => '/materials/neet_biology_diagrams.pdf',
                'file_type'       => 'pdf',
                'file_size_bytes' => 4500000,
                'is_public'       => true,
            ],
        ];

        foreach ($teacherNotes as $noteData) {
            $noteId = DB::table('notes')->insertGetId([
                ...$noteData,
                'uploaded_by' => $teacher->id,
                'created_at'  => now()->subDays(rand(1, 15)),
                'updated_at'  => now(),
            ]);

            // Link note to batches
            foreach ($batches as $batch) {
                DB::table('batch_note')->insertOrIgnore([
                    'batch_id' => $batch->id,
                    'note_id'  => $noteId,
                ]);
            }
        }

        // ── 4. CONTENT CATEGORIES & TAGS ────────────────────────────────────
        $categories = [
            ['name' => 'Handwritten Notes', 'slug' => 'handwritten-notes'],
            ['name' => 'Video Lectures',    'slug' => 'video-lectures'],
            ['name' => 'Question Papers',   'slug' => 'question-papers'],
            ['name' => 'Revision Sheets',   'slug' => 'revision-sheets'],
            ['name' => 'Reference Manuals', 'slug' => 'reference-manuals'],
        ];

        foreach ($categories as $cat) {
            DB::table('content_categories')->insertOrIgnore([
                ...$cat,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $tags = [
            'JEE Advanced', 'NEET 2026', 'Board Exam', 'Important Formulas',
            'High Weightage', 'NCERT Highlights', 'Practice Sheet', 'Solved Examples'
        ];

        foreach ($tags as $tagName) {
            DB::table('content_tags')->insertOrIgnore([
                'name'       => $tagName,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        echo "  ✅ LearningProgressSeeder complete: lesson progress, bookmarks, notes, categories & tags seeded.\n";
    }
}
