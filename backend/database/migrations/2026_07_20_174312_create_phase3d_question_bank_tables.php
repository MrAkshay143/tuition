<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // ── Topics ────────────────────────────────────────────────────
        Schema::create('topics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subject_id')->nullable()->constrained('subjects')->nullOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // ── Difficulties ──────────────────────────────────────────────
        Schema::create('difficulties', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Easy, Medium, Hard
            $table->integer('level')->default(1);
            $table->timestamps();
        });

        // ── Global Questions ──────────────────────────────────────────
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('topic_id')->nullable()->constrained('topics')->nullOnDelete();
            $table->foreignId('difficulty_id')->nullable()->constrained('difficulties')->nullOnDelete();
            $table->foreignId('teacher_id')->nullable()->constrained('users')->nullOnDelete();
            
            $table->text('content');
            $table->enum('type', ['mcq', 'subjective', 'true_false', 'numerical'])->default('mcq');
            $table->json('options')->nullable();        // [{text, is_correct, media_url}]
            $table->text('correct_answer')->nullable(); // For subjective/numerical
            $table->text('solution_explanation')->nullable();
            $table->integer('default_marks')->default(1);
            $table->integer('default_time_seconds')->nullable();
            
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // ── Question Tags ─────────────────────────────────────────────
        Schema::create('question_tags', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        Schema::create('question_question_tag', function (Blueprint $table) {
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->foreignId('question_tag_id')->constrained()->cascadeOnDelete();
            $table->primary(['question_id', 'question_tag_id']);
        });

        // ── Exam ↔ Global Questions Pivot ─────────────────────────────
        Schema::create('exam_question_bank', function (Blueprint $table) {
            $table->foreignId('exam_id')->constrained()->cascadeOnDelete();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->integer('marks')->default(1);
            $table->integer('sort_order')->default(0);
            $table->primary(['exam_id', 'question_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exam_question_bank');
        Schema::dropIfExists('question_question_tag');
        Schema::dropIfExists('question_tags');
        Schema::dropIfExists('questions');
        Schema::dropIfExists('difficulties');
        Schema::dropIfExists('topics');
    }
};
