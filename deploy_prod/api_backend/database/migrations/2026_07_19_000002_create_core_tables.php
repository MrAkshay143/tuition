<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // ── Batches ──────────────────────────────────────────────────
        Schema::create('batches', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('color', 10)->default('#6C63FF');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // ── Batch ↔ Student pivot ────────────────────────────────────
        Schema::create('batch_student', function (Blueprint $table) {
            $table->id();
            $table->foreignId('batch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->references('id')->on('users')->cascadeOnDelete();
            $table->timestamp('enrolled_at')->useCurrent();
            $table->unique(['batch_id', 'student_id']);
        });

        // ── Courses ──────────────────────────────────────────────────
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('thumbnail')->nullable();
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });

        // ── Course ↔ Batch pivot ─────────────────────────────────────
        Schema::create('batch_course', function (Blueprint $table) {
            $table->foreignId('batch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->primary(['batch_id', 'course_id']);
        });

        // ── Modules (units inside a course) ──────────────────────────────
        Schema::create('course_modules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // ── Chapters (sections inside a module) ────────────────────────
        Schema::create('course_chapters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained('course_modules')->cascadeOnDelete();
            $table->string('title');
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // ── Lessons ────────────────────────────────────────────────────
        Schema::create('lessons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chapter_id')->constrained('course_chapters')->cascadeOnDelete();
            $table->string('title');
            $table->enum('type', ['video', 'text', 'quiz'])->default('video');
            $table->text('content')->nullable(); // rich text for text lessons
            $table->string('video_url')->nullable();
            $table->string('video_provider')->nullable(); // youtube|upload|vimeo
            $table->integer('duration_seconds')->nullable();
            $table->boolean('is_free_preview')->default(false);
            $table->string('attachment_name')->nullable();
            $table->string('attachment_path')->nullable();
            $table->string('attachment_size')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // ── Lesson progress ──────────────────────────────────────────
        Schema::create('lesson_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_id')->constrained()->cascadeOnDelete();
            $table->boolean('completed')->default(false);
            $table->integer('watched_seconds')->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'lesson_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_progress');
        Schema::dropIfExists('lessons');
        Schema::dropIfExists('course_modules');
        Schema::dropIfExists('batch_course');
        Schema::dropIfExists('courses');
        Schema::dropIfExists('batch_student');
        Schema::dropIfExists('batches');
    }
};
