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
        // 1. Chat Conversations Table
        Schema::create('chat_conversations', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['private', 'group'])->default('private');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            
            // We use string/uuid for last_message_uuid to avoid circular foreign key constraints during creation
            $table->string('last_message_uuid')->nullable();
            $table->timestamp('last_message_at')->nullable();
            $table->boolean('is_archived')->default(false);
            $table->timestamps();
        });

        // 2. Conversation Members Table
        Schema::create('conversation_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained('chat_conversations')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('last_read_message_uuid')->nullable();
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamps();
            
            // A user can only be in a conversation once
            $table->unique(['conversation_id', 'user_id']);
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('conversation_members');
        Schema::dropIfExists('chat_conversations');
    }
};
