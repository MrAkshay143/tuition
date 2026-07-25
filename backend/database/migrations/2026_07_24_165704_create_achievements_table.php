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
        Schema::create('achievements', function (Blueprint $table) {
            $table->id();
            $table->string('student_name');
            $table->string('exam_name'); // e.g. "JEE Advanced", "NEET"
            $table->string('rank')->nullable(); // e.g. "AIR 45"
            $table->string('score')->nullable(); // e.g. "99.9%"
            $table->integer('year');
            $table->string('image')->nullable();
            $table->text('testimonial')->nullable();
            $table->foreignId('batch_id')->nullable()->constrained('batches')->nullOnDelete();
            $table->boolean('is_published')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('achievements');
    }
};
