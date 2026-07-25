<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            // Drop legacy media foreign keys if they exist
            try {
                $table->dropForeign(['media_id']);
                $table->dropColumn('media_id');
            } catch (\Throwable $e) {}

            // Drop legacy raw columns
            $table->dropColumn([
                'video_url',
                'video_provider',
                'attachment_name',
                'attachment_path',
                'attachment_size'
            ]);

            // Add clean unified media library ID references
            $table->foreignId('primary_media_id')
                ->nullable()
                ->after('id')
                ->constrained('media')
                ->nullOnDelete();

            $table->foreignId('download_media_id')
                ->nullable()
                ->after('primary_media_id')
                ->constrained('media')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropForeign(['primary_media_id']);
            $table->dropForeign(['download_media_id']);
            $table->dropColumn(['primary_media_id', 'download_media_id']);

            $table->foreignId('media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->string('video_url')->nullable();
            $table->string('video_provider', 50)->nullable();
            $table->string('attachment_name')->nullable();
            $table->string('attachment_path')->nullable();
            $table->integer('attachment_size')->nullable();
        });
    }
};
