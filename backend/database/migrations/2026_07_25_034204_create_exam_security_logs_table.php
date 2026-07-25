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
        Schema::create('exam_security_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_attempt_id')->constrained('exam_attempts')->onDelete('cascade');
            $table->string('event_type'); // e.g., 'tab_switched', 'fullscreen_exited', 'network_disconnected'
            $table->json('details')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exam_security_logs');
    }
};
