<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // ── Chat Messages ────────────────────────────────────────────
        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sender_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreignId('receiver_id')->references('id')->on('users')->cascadeOnDelete();
            $table->enum('type', ['text', 'image', 'file', 'voice'])->default('text');
            $table->text('body')->nullable();
            $table->string('attachment')->nullable();
            $table->boolean('read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            $table->index(['sender_id', 'receiver_id']);
        });

        // ── Announcements ────────────────────────────────────────────
        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by')->references('id')->on('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('body');
            $table->string('type', 30)->default('general');
            $table->boolean('is_all')->default(true);
            $table->json('channels')->nullable();       // ['in_app','email','push']
            $table->json('batch_ids')->nullable();      // null = all students
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
        });

        // ── Notifications ────────────────────────────────────────────
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 50)->default('general');
            $table->string('icon', 50)->nullable();
            $table->string('title');
            $table->text('body')->nullable();
            $table->json('data')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'read_at']);
        });

        // ── Notification Preferences ─────────────────────────────────
        Schema::create('notification_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->boolean('in_app')->default(true);
            $table->boolean('email')->default(true);
            $table->boolean('push')->default(true);
            $table->boolean('live_class_reminder')->default(true);
            $table->boolean('assignment_due')->default(true);
            $table->boolean('exam_reminder')->default(true);
            $table->boolean('new_content')->default(true);
            $table->unique('user_id');
        });

        // ── Device Sessions ──────────────────────────────────────────
        Schema::create('device_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('token_id');         // Personal access token ID
            $table->string('device_name');
            $table->string('user_agent')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('last_active_at')->nullable();
            $table->timestamps();
            $table->index('user_id');
        });

        // ── Activity Logs ────────────────────────────────────────────
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('event', 50);
            $table->text('description')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->json('properties')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'event', 'created_at']);
        });

        // ── Platform Settings ────────────────────────────────────────
        Schema::create('settings', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->text('value')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('device_sessions');
        Schema::dropIfExists('notification_preferences');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('announcements');
        Schema::dropIfExists('chat_messages');
    }
};
