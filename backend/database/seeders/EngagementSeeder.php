<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Domains\Core\Models\User;
use App\Domains\Core\Models\Batch;

class EngagementSeeder extends Seeder
{
    public function run(): void
    {
        $teacher = User::where('role', 'teacher')->first() ?? User::first();
        $students = User::where('role', 'student')->get();
        $batches = Batch::all();

        if ($students->isEmpty() || $batches->isEmpty()) {
            return;
        }

        $jeeBatch  = Batch::where('name', 'LIKE', '%JEE%')->first() ?? $batches->first();
        $neetBatch = Batch::where('name', 'LIKE', '%NEET%')->first() ?? $batches->first();

        // Live classes
        $liveClasses = [
            [
                'title'            => 'Electromagnetism Masterclass - Live Problem Solving',
                'description'      => 'Interactive live problem solving session on Faraday laws, Lenz law and self-inductance.',
                'provider'         => 'youtube',
                'meeting_id'       => 'live-phys-101',
                'meeting_url'      => 'https://www.youtube.com/watch?v=Ft4OAWygeyg',
                'password'         => '123456',
                'scheduled_at'     => now()->addHours(2), // Today upcoming
                'duration_minutes' => 60,
                'status'           => 'scheduled',
                'recording_url'    => null,
                'batch_id'         => $jeeBatch->id,
            ],
            [
                'title'            => 'Organic Reactions Mechanism Live Workshop',
                'description'      => 'Live step-by-step mechanism breakdown for electrophilic additions & eliminations.',
                'provider'         => 'livekit',
                'meeting_id'       => 'livekit-chem-202',
                'meeting_url'      => 'https://meet.eduflow.in/chem-202',
                'password'         => null,
                'scheduled_at'     => now()->addDays(1)->setHour(18)->setMinute(0),
                'duration_minutes' => 90,
                'status'           => 'scheduled',
                'recording_url'    => null,
                'batch_id'         => $jeeBatch->id,
            ],
            [
                'title'            => 'Calculus Integration Techniques Live Review',
                'description'      => 'Completed live session covering integration by parts and partial fractions.',
                'provider'         => 'youtube',
                'meeting_id'       => 'live-math-303',
                'meeting_url'      => 'https://www.youtube.com/watch?v=Mw6VaQ1w7DI',
                'password'         => null,
                'scheduled_at'     => now()->subDays(1)->setHour(16)->setMinute(0),
                'duration_minutes' => 60,
                'status'           => 'ended',
                'recording_url'    => 'https://www.youtube.com/watch?v=Mw6VaQ1w7DI',
                'batch_id'         => $jeeBatch->id,
            ],
            [
                'title'            => 'NEET Biology High-Yield Genetics Live Q&A',
                'description'      => 'Completed live Q&A session on pedigree charts and chromosome disorders.',
                'provider'         => 'youtube',
                'meeting_id'       => 'live-bio-404',
                'meeting_url'      => 'https://www.youtube.com/watch?v=Wb9N-fzIShk',
                'password'         => null,
                'scheduled_at'     => now()->subDays(3)->setHour(17)->setMinute(0),
                'duration_minutes' => 75,
                'status'           => 'ended',
                'recording_url'    => 'https://www.youtube.com/watch?v=Wb9N-fzIShk',
                'batch_id'         => $neetBatch->id,
            ],
        ];

        foreach ($liveClasses as $lc) {
            $batchId = $lc['batch_id'];
            unset($lc['batch_id']);

            $liveClassId = DB::table('live_classes')->insertGetId([
                ...$lc,
                'teacher_id' => $teacher->id,
                'created_by' => $teacher->id,
                'created_at' => now()->subDays(2),
                'updated_at' => now(),
            ]);

            DB::table('batch_live_class')->insertOrIgnore([
                'batch_id'      => $batchId,
                'live_class_id' => $liveClassId,
            ]);

            // If ended, add attendance
            if ($lc['status'] === 'ended') {
                $batchStudents = User::whereHas('batches', fn($q) => $q->where('batches.id', $batchId))->get();
                foreach ($batchStudents as $student) {
                    DB::table('attendance')->insert([
                        'live_class_id'    => $liveClassId,
                        'user_id'          => $student->id,
                        'joined_at'        => $lc['scheduled_at'],
                        'left_at'          => \Carbon\Carbon::parse($lc['scheduled_at'])->addMinutes($lc['duration_minutes']),
                        'duration_seconds' => $lc['duration_minutes'] * 60,
                        'created_at'       => now(),
                        'updated_at'       => now(),
                    ]);
                }
            }
        }

        // ── 2. ANNOUNCEMENTS ────────────────────────────────────────────────
        $announcements = [
            [
                'title'    => '📢 JEE Main Mock Exam Schedule & Syllabus Details Announced',
                'body'     => 'Dear Students, the upcoming Physics and Chemistry speed test is scheduled for this Friday. Make sure to review Electromagnetism and Organic Reactions before attempting. Good luck!',
                'type'     => 'urgent',
                'is_all'   => false,
                'batch_id' => $jeeBatch->id,
            ],
            [
                'title'    => '💡 Doubt Clearing Session Available Today at 5:00 PM',
                'body'     => 'We will hold an interactive live doubt clearing session today. Keep your questions and problem sets ready in advance.',
                'type'     => 'info',
                'is_all'   => true,
                'batch_id' => null,
            ],
            [
                'title'    => '📄 New Handouts & Formula Sheets Uploaded to Library',
                'body'     => 'High-yield PDF summaries for Physics and Chemistry have been uploaded to your study materials section. You can view or download them anytime.',
                'type'     => 'info',
                'is_all'   => true,
                'batch_id' => null,
            ],
        ];

        foreach ($announcements as $anc) {
            $batchId = $anc['batch_id'];
            unset($anc['batch_id']);

            $ancId = DB::table('announcements')->insertGetId([
                ...$anc,
                'created_by' => $teacher->id,
                'channels'   => json_encode(['in_app', 'email']),
                'sent_at'    => now()->subHours(rand(1, 12)),
                'created_at' => now()->subHours(rand(1, 12)),
                'updated_at' => now(),
            ]);

            if ($batchId) {
                DB::table('announcement_batch')->insertOrIgnore([
                    'announcement_id' => $ancId,
                    'batch_id'        => $batchId,
                ]);
            }
        }

        // ── 3. CHAT MESSAGES ────────────────────────────────────────────────
        $chatConversations = [
            [
                'student'  => $students->first(),
                'messages' => [
                    ['sender' => 'student', 'body' => 'Respected Sir, could you please clarify Q4 from the Lorentz Force assignment?'],
                    ['sender' => 'teacher', 'body' => 'Hello Priya! In Q4, remember that force F = q(v × B). Direction is given by right-hand thumb rule.'],
                    ['sender' => 'student', 'body' => 'Ah, understood now! Thank you so much Sir!'],
                ]
            ],
            [
                'student'  => $students->get(1) ?? $students->first(),
                'messages' => [
                    ['sender' => 'student', 'body' => 'Sir, will the live class recording for Calculus be available today?'],
                    ['sender' => 'teacher', 'body' => 'Yes Rahul, the recording has been uploaded under your course classroom portal.'],
                ]
            ],
        ];

        foreach ($chatConversations as $cGroup) {
            $student = $cGroup['student'];
            foreach ($cGroup['messages'] as $mIdx => $msg) {
                $senderId   = ($msg['sender'] === 'teacher') ? $teacher->id : $student->id;
                $receiverId = ($msg['sender'] === 'teacher') ? $student->id : $teacher->id;

                DB::table('chat_messages')->insert([
                    'sender_id'   => $senderId,
                    'receiver_id' => $receiverId,
                    'type'        => 'text',
                    'body'        => $msg['body'],
                    'read'        => true,
                    'read_at'     => now()->subMinutes(60 - ($mIdx * 15)),
                    'created_at'  => now()->subMinutes(60 - ($mIdx * 15)),
                    'updated_at'  => now()->subMinutes(60 - ($mIdx * 15)),
                ]);
            }
        }

        // ── 4. NOTIFICATIONS ────────────────────────────────────────────────
        foreach ($students as $student) {
            $notifs = [
                [
                    'type'  => 'assignment_graded',
                    'icon'  => 'ClipboardCheck',
                    'title' => 'Assignment Graded',
                    'body'  => 'Your submission for Physics Electromagnetism Problem Set 1 has been graded by Arjun Kumar.',
                    'data'  => json_encode(['assignment_id' => 1]),
                ],
                [
                    'type'  => 'live_class_scheduled',
                    'icon'  => 'Radio',
                    'title' => 'Upcoming Live Class',
                    'body'  => 'Electromagnetism Masterclass starts in 2 hours. Click to join classroom.',
                    'data'  => json_encode(['live_class_id' => 1]),
                ],
                [
                    'type'  => 'announcement',
                    'icon'  => 'Bell',
                    'title' => 'New Announcement Posted',
                    'body'  => 'JEE Main Mock Exam Schedule & Syllabus Details Announced.',
                    'data'  => json_encode(['announcement_id' => 1]),
                ],
            ];

            foreach ($notifs as $nIdx => $n) {
                DB::table('notifications')->insert([
                    'id'         => \Illuminate\Support\Str::uuid()->toString(),
                    'user_id'    => $student->id,
                    'type'       => $n['type'],
                    'icon'       => $n['icon'],
                    'title'      => $n['title'],
                    'body'       => $n['body'],
                    'data'       => $n['data'],
                    'read_at'    => ($nIdx === 0) ? now() : null, // 1 read, 2 unread
                    'created_at' => now()->subHours(rand(1, 24)),
                    'updated_at' => now(),
                ]);
            }
        }

        echo "  ✅ EngagementSeeder complete: live classes, attendance, announcements, chat & notifications seeded.\n";
    }
}
