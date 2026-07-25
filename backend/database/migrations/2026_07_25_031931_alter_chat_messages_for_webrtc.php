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
        // For existing rows, we should truncate or provide default UUIDs if possible. 
        // Given this is early in implementation, it's safer to add columns and allow nulls where necessary.
        
        Schema::table('chat_messages', function (Blueprint $table) {
            if (!Schema::hasColumn('chat_messages', 'uuid')) {
                $table->uuid('uuid')->nullable()->after('id')->unique();
            }
            if (!Schema::hasColumn('chat_messages', 'conversation_id')) {
                $table->foreignId('conversation_id')->nullable()->after('uuid')->constrained('chat_conversations')->cascadeOnDelete();
            }
            if (!Schema::hasColumn('chat_messages', 'reply_to_message_uuid')) {
                $table->string('reply_to_message_uuid')->nullable()->after('sender_id');
            }
            if (!Schema::hasColumn('chat_messages', 'forwarded_from')) {
                $table->string('forwarded_from')->nullable()->after('reply_to_message_uuid');
            }
            if (!Schema::hasColumn('chat_messages', 'message_type')) {
                $table->string('message_type', 30)->default('text')->after('forwarded_from');
            }
            if (!Schema::hasColumn('chat_messages', 'text')) {
                $table->text('text')->nullable()->after('message_type');
            }
            if (!Schema::hasColumn('chat_messages', 'media_id')) {
                // foreign key to media table (if it exists)
                $table->foreignId('media_id')->nullable()->after('text')->constrained('media')->nullOnDelete();
            }
            if (!Schema::hasColumn('chat_messages', 'status')) {
                $table->enum('status', ['queued', 'sent', 'delivered', 'read', 'failed'])->default('sent')->after('media_id');
            }
            if (!Schema::hasColumn('chat_messages', 'sent_at')) {
                $table->timestamp('sent_at')->nullable()->after('status');
            }
            if (!Schema::hasColumn('chat_messages', 'delivered_at')) {
                $table->timestamp('delivered_at')->nullable()->after('sent_at');
            }
            if (!Schema::hasColumn('chat_messages', 'edited_at')) {
                $table->timestamp('edited_at')->nullable()->after('read_at');
            }
            if (!Schema::hasColumn('chat_messages', 'deleted_at')) {
                $table->timestamp('deleted_at')->nullable()->after('edited_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chat_messages', function (Blueprint $table) {
            $table->dropForeign(['conversation_id']);
            $table->dropForeign(['media_id']);
            $table->dropColumn([
                'uuid',
                'conversation_id',
                'reply_to_message_uuid',
                'forwarded_from',
                'message_type',
                'text',
                'media_id',
                'status',
                'sent_at',
                'delivered_at',
                'edited_at',
                'deleted_at'
            ]);
        });
    }
};
