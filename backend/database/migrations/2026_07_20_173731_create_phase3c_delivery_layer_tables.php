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
        // Add Phase 3 taxonomy relationships to batches
        Schema::table('batches', function (Blueprint $table) {
            $table->foreignId('program_id')->nullable()->constrained('programs')->nullOnDelete();
            $table->foreignId('session_id')->nullable()->constrained('academic_sessions')->nullOnDelete();
        });

        // Batch Attendance Tracking
        Schema::create('batch_attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('batch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreignId('lesson_id')->nullable()->constrained('lessons')->nullOnDelete();
            $table->date('attendance_date');
            $table->enum('status', ['present', 'absent', 'late', 'excused'])->default('present');
            $table->text('remarks')->nullable();
            $table->timestamps();
            
            $table->unique(['batch_id', 'student_id', 'attendance_date']);
        });

        // Announcement Batch Pivot (Replacing JSON column)
        Schema::create('announcement_batch', function (Blueprint $table) {
            $table->foreignId('announcement_id')->constrained()->cascadeOnDelete();
            $table->foreignId('batch_id')->constrained()->cascadeOnDelete();
            $table->primary(['announcement_id', 'batch_id']);
        });

        // Drop the legacy JSON column
        Schema::table('announcements', function (Blueprint $table) {
            $table->dropColumn('batch_ids');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->json('batch_ids')->nullable();
        });

        Schema::dropIfExists('announcement_batch');
        Schema::dropIfExists('batch_attendances');

        Schema::table('batches', function (Blueprint $table) {
            $table->dropForeign(['program_id']);
            $table->dropForeign(['session_id']);
            $table->dropColumn(['program_id', 'session_id']);
        });
    }
};
