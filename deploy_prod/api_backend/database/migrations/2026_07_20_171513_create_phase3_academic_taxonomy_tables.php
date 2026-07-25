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
        // 1. Education Types (e.g., School, College, Competitive)
        Schema::create('education_types', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('order_index')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });

        // 2. Academic Sessions (e.g., 2026-2027)
        Schema::create('academic_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->boolean('is_current')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // 3. Programs (e.g., Class 10 CBSE, NEET 2027, BCA Semester 3)
        Schema::create('programs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('education_type_id')->constrained('education_types')->restrictOnDelete();
            $table->foreignId('academic_session_id')->nullable()->constrained('academic_sessions')->nullOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('thumbnail')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('order_index')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });

        // 4. Subjects (e.g., Physics, Computer Networks) - Reusable global tags
        Schema::create('subjects', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('slug')->unique();
            $table->string('code', 50)->nullable();
            $table->string('color', 20)->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('order_index')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });

        // Link Course to Program and Subject
        Schema::table('courses', function (Blueprint $table) {
            $table->foreignId('program_id')->nullable()->after('id')->constrained('programs')->nullOnDelete();
            $table->foreignId('subject_id')->nullable()->after('program_id')->constrained('subjects')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropForeign(['program_id']);
            $table->dropForeign(['subject_id']);
            $table->dropColumn(['program_id', 'subject_id']);
        });

        Schema::dropIfExists('subjects');
        Schema::dropIfExists('programs');
        Schema::dropIfExists('academic_sessions');
        Schema::dropIfExists('education_types');
    }
};
