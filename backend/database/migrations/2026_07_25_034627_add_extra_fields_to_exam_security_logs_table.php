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
        Schema::table('exam_security_logs', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->foreignId('exam_id')->nullable()->constrained('exams')->onDelete('cascade');
            $table->string('severity')->default('info');
            $table->string('browser')->nullable();
            $table->string('device')->nullable();
            $table->string('ip')->nullable();
            $table->text('user_agent')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('exam_security_logs', function (Blueprint $table) {
            $table->dropColumn(['user_id', 'exam_id', 'severity', 'browser', 'device', 'ip', 'user_agent']);
        });
    }
};
