<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Extend default users table
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['admin', 'teacher', 'student'])->default('student')->after('email');
            $table->string('avatar')->nullable()->after('role');
            $table->string('phone', 20)->nullable()->after('avatar');
            $table->boolean('active')->default(true)->after('phone');
            $table->string('google_id')->nullable()->after('active');
            $table->string('fcm_token')->nullable()->after('google_id');
            $table->boolean('two_factor_enabled')->default(false)->after('fcm_token');
            $table->timestamp('last_login_at')->nullable()->after('two_factor_enabled');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'role','avatar','phone','active','google_id',
                'fcm_token','two_factor_enabled','last_login_at',
            ]);
        });
    }
};
