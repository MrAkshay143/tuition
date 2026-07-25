<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('user_sessions')) {
            Schema::create('user_sessions', function (Blueprint $table) {
                $table->id();
                $table->uuid('uuid')->unique();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('session_hash')->index();
                $table->string('device_id')->index();
                $table->string('device_name')->default('Unknown Device');
                $table->string('device_type')->default('desktop'); // desktop, mobile, tablet
                $table->string('login_source')->default('web');   // web, android, ios, api
                $table->string('browser')->nullable();
                $table->string('browser_version')->nullable();
                $table->string('operating_system')->nullable();
                $table->string('os_version')->nullable();
                $table->string('platform')->nullable();
                $table->string('fingerprint_hash')->nullable();
                $table->text('user_agent')->nullable();
                $table->string('ip_address', 45)->nullable();
                $table->string('last_activity_ip', 45)->nullable();
                $table->string('country')->nullable();
                $table->string('city')->nullable();
                $table->double('latitude')->nullable();
                $table->double('longitude')->nullable();
                $table->string('status')->default('ACTIVE'); // ACTIVE, REVOKED, EXPIRED, COMPROMISED, TERMINATED
                $table->integer('risk_score')->default(0);
                $table->string('risk_level')->default('low'); // low, medium, high, critical
                $table->integer('failed_validation_count')->default(0);
                $table->integer('device_priority')->default(0);
                $table->integer('request_count')->default(1);
                $table->boolean('is_trusted')->default(false);
                $table->timestamp('trusted_until')->nullable();
                $table->timestamp('remember_device_until')->nullable();
                $table->string('refresh_token_hash')->nullable();
                $table->timestamp('login_at')->nullable();
                $table->timestamp('logout_at')->nullable();
                $table->timestamp('last_activity_at')->nullable();
                $table->timestamp('last_request_at')->nullable();
                $table->timestamp('last_validation_at')->nullable();
                $table->timestamp('expires_at')->nullable();
                $table->timestamp('absolute_expires_at')->nullable();
                $table->timestamp('revoked_at')->nullable();
                $table->timestamps();

                $table->index(['user_id', 'status']);
                $table->index(['user_id', 'device_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('user_sessions');
    }
};
