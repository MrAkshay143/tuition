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
        Schema::table('live_classes', function (Blueprint $table) {
            $table->string('host_link')->nullable()->after('meeting_url');
            $table->integer('join_before_minutes')->default(5)->after('host_link');
            $table->boolean('waiting_room')->default(false)->after('join_before_minutes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('live_classes', function (Blueprint $table) {
            $table->dropColumn(['host_link', 'join_before_minutes', 'waiting_room']);
        });
    }
};
