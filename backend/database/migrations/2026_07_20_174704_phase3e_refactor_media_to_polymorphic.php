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
        // 1. Migrate existing primary_media_id and download_media_id to media_links
        $lessons = \Illuminate\Support\Facades\DB::table('lessons')->get();
        foreach ($lessons as $lesson) {
            if (!empty($lesson->primary_media_id)) {
                \Illuminate\Support\Facades\DB::table('media_links')->insertOrIgnore([
                    'media_id'    => $lesson->primary_media_id,
                    'entity_type' => 'App\\Domains\\Course\\Models\\Lesson',
                    'entity_id'   => $lesson->id,
                    'link_type'   => 'primary',
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);
            }
            if (!empty($lesson->download_media_id)) {
                \Illuminate\Support\Facades\DB::table('media_links')->insertOrIgnore([
                    'media_id'    => $lesson->download_media_id,
                    'entity_type' => 'App\\Domains\\Course\\Models\\Lesson',
                    'entity_id'   => $lesson->id,
                    'link_type'   => 'download',
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);
            }
        }

        // 2. Drop the hardcoded columns to enforce polymorphic behavior
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropForeign(['primary_media_id']);
            $table->dropForeign(['download_media_id']);
            $table->dropColumn(['primary_media_id', 'download_media_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->foreignId('primary_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->foreignId('download_media_id')->nullable()->constrained('media')->nullOnDelete();
        });
    }
};
