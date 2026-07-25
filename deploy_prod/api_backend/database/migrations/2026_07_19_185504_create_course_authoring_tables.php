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
        // ── Course Versions Table ────────────────────────────────────
        Schema::create('course_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
            $table->integer('version');
            $table->text('snapshot'); // JSON snapshot of modules, lessons, settings
            $table->string('change_summary')->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['course_id', 'version']);
        });

        // ── Course Edit Sessions Table (Locks) ───────────────────────
        Schema::create('course_edit_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('locked_at')->useCurrent();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('last_activity_at')->useCurrent();
            $table->timestamps();

            $table->index(['course_id', 'expires_at']);
        });

        // ── Module UI States Table ────────────────────────────────────
        Schema::create('module_states', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('module_id')->constrained('course_modules')->cascadeOnDelete();
            $table->boolean('collapsed')->default(false);
            $table->timestamps();

            $table->unique(['teacher_id', 'module_id']);
        });

        // ── Scheduling columns on Courses Table ───────────────────────
        Schema::table('courses', function (Blueprint $table) {
            $table->timestamp('publish_at')->nullable();
            $table->timestamp('unpublish_at')->nullable();
            $table->string('timezone')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn(['publish_at', 'unpublish_at', 'timezone']);
        });

        Schema::dropIfExists('module_states');
        Schema::dropIfExists('course_edit_sessions');
        Schema::dropIfExists('course_versions');
    }
};
