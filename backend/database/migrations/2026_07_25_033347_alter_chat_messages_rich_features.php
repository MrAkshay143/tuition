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
        Schema::table('chat_messages', function (Blueprint $table) {
            if (!Schema::hasColumn('chat_messages', 'reactions')) {
                $table->json('reactions')->nullable()->after('deleted_at');
            }
            if (!Schema::hasColumn('chat_messages', 'deleted_for')) {
                $table->json('deleted_for')->nullable()->after('reactions'); // array of user IDs
            }
            if (!Schema::hasColumn('chat_messages', 'is_pinned')) {
                $table->boolean('is_pinned')->default(false)->after('deleted_for');
            }
        });
        
        Schema::table('chat_conversations', function (Blueprint $table) {
            if (!Schema::hasColumn('chat_conversations', 'settings')) {
                $table->json('settings')->nullable()->after('last_message_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chat_messages', function (Blueprint $table) {
            $table->dropColumn(['reactions', 'deleted_for', 'is_pinned']);
        });
        
        Schema::table('chat_conversations', function (Blueprint $table) {
            $table->dropColumn('settings');
        });
    }
};
