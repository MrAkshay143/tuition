<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. enrollments
        Schema::create('enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
            $table->foreignId('batch_id')->nullable()->constrained('batches')->nullOnDelete();
            $table->string('status', 30)->default('active'); // active, completed, expired, suspended
            $table->timestamp('enrolled_at')->useCurrent();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });

        // 2. student_bookmarks
        Schema::create('student_bookmarks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('lesson_id')->constrained('lessons')->cascadeOnDelete();
            $table->integer('video_timestamp_seconds')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'lesson_id']);
        });

        // 3. learning_history (Append-only event log)
        Schema::create('learning_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
            $table->foreignId('lesson_id')->constrained('lessons')->cascadeOnDelete();
            $table->string('action', 50); // lesson_opened, lesson_closed, lesson_completed, bookmark_added, resume
            $table->integer('watch_seconds')->default(0);
            $table->decimal('playback_speed', 4, 2)->default(1.00);
            $table->string('device')->nullable();
            $table->string('ip', 45)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['user_id', 'course_id']);
        });

        // 4. learning_sessions (latest playback state)
        Schema::create('learning_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('lesson_id')->constrained('lessons')->cascadeOnDelete();
            $table->integer('watch_seconds')->default(0);
            $table->integer('last_position')->default(0); // position in seconds
            $table->decimal('playback_speed', 4, 2)->default(1.00);
            $table->string('device_id', 100)->default('default');
            $table->timestamps();

            $table->unique(['user_id', 'lesson_id', 'device_id']);
        });

        // 5. course_completions
        Schema::create('course_completions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
            $table->integer('completed_percentage')->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->string('certificate_id', 100)->nullable();
            $table->boolean('certificate_generated')->default(false);
            $table->timestamps();

            $table->unique(['user_id', 'course_id']);
        });

        // 6. learning_streaks
        Schema::create('learning_streaks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->integer('current_streak_days')->default(0);
            $table->integer('longest_streak_days')->default(0);
            $table->date('last_activity_date')->nullable();
            $table->timestamps();

            $table->unique('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('learning_streaks');
        Schema::dropIfExists('course_completions');
        Schema::dropIfExists('learning_sessions');
        Schema::dropIfExists('learning_history');
        Schema::dropIfExists('student_bookmarks');
        Schema::dropIfExists('enrollments');
    }
};
