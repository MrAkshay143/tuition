<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // ── Videos (standalone, not in courses) ─────────────────────
        Schema::create('videos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('uploaded_by')->references('id')->on('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('url');
            $table->string('thumbnail')->nullable();
            $table->enum('provider', ['youtube', 'upload', 'vimeo'])->default('upload');
            $table->integer('duration_seconds')->nullable();
            $table->bigInteger('file_size_bytes')->nullable();
            $table->enum('status', ['processing', 'ready', 'failed'])->default('ready');
            $table->boolean('is_public')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });

        // ── Notes (PDFs, PPT, DOCX) ──────────────────────────────────
        Schema::create('notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('uploaded_by')->references('id')->on('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('file_path');
            $table->string('file_type', 20);
            $table->bigInteger('file_size_bytes')->nullable();
            $table->boolean('is_public')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });

        // ── Notes ↔ Batches ──────────────────────────────────────────
        Schema::create('batch_note', function (Blueprint $table) {
            $table->foreignId('batch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('note_id')->constrained()->cascadeOnDelete();
            $table->primary(['batch_id', 'note_id']);
        });

        // ── Live Classes ─────────────────────────────────────────────
        Schema::create('live_classes', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('provider', ['zoom', 'meet', 'jitsi'])->default('zoom');
            $table->string('meeting_id')->nullable();
            $table->string('meeting_url')->nullable();
            $table->string('password')->nullable();
            $table->timestamp('scheduled_at');
            $table->integer('duration_minutes')->default(60);
            $table->enum('status', ['scheduled', 'live', 'ended', 'cancelled'])->default('scheduled');
            $table->string('recording_url')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // ── Live Class ↔ Batches ─────────────────────────────────────
        Schema::create('batch_live_class', function (Blueprint $table) {
            $table->foreignId('batch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('live_class_id')->constrained()->cascadeOnDelete();
            $table->primary(['batch_id', 'live_class_id']);
        });

        // ── Attendance ───────────────────────────────────────────────
        Schema::create('attendance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('live_class_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('joined_at')->nullable();
            $table->timestamp('left_at')->nullable();
            $table->integer('duration_seconds')->default(0);
            $table->timestamps();
            $table->unique(['live_class_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance');
        Schema::dropIfExists('batch_live_class');
        Schema::dropIfExists('live_classes');
        Schema::dropIfExists('batch_note');
        Schema::dropIfExists('notes');
        Schema::dropIfExists('videos');
    }
};
