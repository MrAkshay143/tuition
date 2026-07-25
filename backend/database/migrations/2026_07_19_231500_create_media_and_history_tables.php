<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // ── Unified Media Library Table ─────────────────────────────
        Schema::create('media', function (Blueprint $table) {
            $table->id();
            $table->string('filename');
            $table->string('path');
            $table->string('mime_type', 100);
            $table->bigInteger('size_bytes');
            $table->foreignId('uploaded_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();
            
            $table->index('uploaded_by');
        });

        // ── Lesson Versions Table ────────────────────────────────────
        Schema::create('lesson_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lesson_id')->constrained('lessons')->cascadeOnDelete();
            $table->foreignId('updated_by')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('content')->nullable();
            $table->string('video_url')->nullable();
            $table->string('attachment_path')->nullable();
            $table->integer('version')->default(1);
            $table->timestamps();

            $table->index(['lesson_id', 'version']);
        });

        // ── Add media_id to lessons table ────────────────────────────
        Schema::table('lessons', function (Blueprint $table) {
            $table->foreignId('media_id')->nullable()->after('id')->constrained('media')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropForeign(['media_id']);
            $table->dropColumn('media_id');
        });

        Schema::dropIfExists('lesson_versions');
        Schema::dropIfExists('media');
    }
};
