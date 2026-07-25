<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Backfill videos
        DB::table('media')
            ->where('mime_type', 'like', 'video/%')
            ->orWhere('mime', 'like', 'video/%')
            ->update(['type' => 'video']);

        // Backfill documents
        DB::table('media')
            ->where(function ($query) {
                $query->where('mime_type', 'like', 'application/%')
                      ->orWhere('mime', 'like', 'application/%')
                      ->orWhere('mime_type', 'text/plain')
                      ->orWhere('mime', 'text/plain');
            })
            ->where('type', 'other') // only overwrite default "other" values
            ->update(['type' => 'document']);

        // Backfill images
        DB::table('media')
            ->where('mime_type', 'like', 'image/%')
            ->orWhere('mime', 'like', 'image/%')
            ->update(['type' => 'image']);
            
        // Backfill audio
        DB::table('media')
            ->where('mime_type', 'like', 'audio/%')
            ->orWhere('mime', 'like', 'audio/%')
            ->update(['type' => 'audio']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverting backfills is a no-op
    }
};
