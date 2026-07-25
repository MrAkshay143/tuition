<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // ── Assignments ──────────────────────────────────────────────
        Schema::create('assignments', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('attachment')->nullable();
            $table->timestamp('due_at')->nullable();
            $table->integer('max_marks')->default(100);
            $table->timestamps();
            $table->softDeletes();
        });

        // ── Assignment ↔ Batches ─────────────────────────────────────
        Schema::create('assignment_batch', function (Blueprint $table) {
            $table->foreignId('assignment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('batch_id')->constrained()->cascadeOnDelete();
            $table->primary(['assignment_id', 'batch_id']);
        });

        // ── Assignment Submissions ───────────────────────────────────
        Schema::create('assignment_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assignment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->references('id')->on('users')->cascadeOnDelete();
            $table->text('answer')->nullable();
            $table->string('attachment')->nullable();
            $table->enum('status', ['pending', 'submitted', 'reviewed'])->default('pending');
            $table->decimal('grade', 5, 2)->nullable();
            $table->text('feedback')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
            $table->unique(['assignment_id', 'student_id']);
        });

        // ── Exams ────────────────────────────────────────────────────
        Schema::create('exams', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('type', ['mcq', 'subjective', 'mixed'])->default('mcq');
            $table->integer('duration_minutes')->default(60);
            $table->integer('total_marks')->default(100);
            $table->integer('pass_marks')->default(40);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->boolean('show_result_immediately')->default(true);
            $table->boolean('shuffle_questions')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });

        // ── Exam ↔ Batches ───────────────────────────────────────────
        Schema::create('exam_batch', function (Blueprint $table) {
            $table->foreignId('exam_id')->constrained()->cascadeOnDelete();
            $table->foreignId('batch_id')->constrained()->cascadeOnDelete();
            $table->primary(['exam_id', 'batch_id']);
        });

        // ── Exam Questions ───────────────────────────────────────────
        Schema::create('exam_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained()->cascadeOnDelete();
            $table->text('question');
            $table->enum('type', ['mcq', 'subjective', 'true_false'])->default('mcq');
            $table->json('options')->nullable();        // [{text, is_correct}]
            $table->text('correct_answer')->nullable(); // for subjective
            $table->integer('marks')->default(1);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // ── Exam Attempts ────────────────────────────────────────────
        Schema::create('exam_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->references('id')->on('users')->cascadeOnDelete();
            $table->decimal('score', 5, 2)->nullable();
            $table->decimal('percentage', 5, 2)->nullable();
            $table->boolean('passed')->nullable();
            $table->json('answers')->nullable();         // {question_id: answer}
            $table->timestamp('started_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
        });

        // ── Certificates ─────────────────────────────────────────────
        Schema::create('certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('course_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('exam_attempt_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('type', ['completion', 'participation', 'merit', 'custom'])->default('completion');
            $table->string('certificate_no')->unique();
            $table->string('pdf_url')->nullable();
            $table->string('qr_code')->nullable();
            $table->timestamp('issued_at')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificates');
        Schema::dropIfExists('exam_attempts');
        Schema::dropIfExists('exam_questions');
        Schema::dropIfExists('exam_batch');
        Schema::dropIfExists('exams');
        Schema::dropIfExists('assignment_submissions');
        Schema::dropIfExists('assignment_batch');
        Schema::dropIfExists('assignments');
    }
};
