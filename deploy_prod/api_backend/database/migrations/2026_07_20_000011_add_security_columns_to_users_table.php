<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'session_version')) {
                $table->integer('session_version')->default(1);
            }
            if (!Schema::hasColumn('users', 'password_changed_at')) {
                $table->timestamp('password_changed_at')->nullable();
            }
            if (!Schema::hasColumn('users', 'security_updated_at')) {
                $table->timestamp('security_updated_at')->nullable();
            }
            if (!Schema::hasColumn('users', 'force_logout_at')) {
                $table->timestamp('force_logout_at')->nullable();
            }
            if (!Schema::hasColumn('users', 'max_sessions')) {
                $table->integer('max_sessions')->nullable();
            }
            if (!Schema::hasColumn('users', 'enforcement_policy')) {
                $table->string('enforcement_policy')->nullable();
            }
            if (!Schema::hasColumn('users', 'inherit_global_policy')) {
                $table->boolean('inherit_global_policy')->default(true);
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'session_version', 'password_changed_at', 'security_updated_at',
                'force_logout_at', 'max_sessions', 'enforcement_policy', 'inherit_global_policy'
            ]);
        });
    }
};
