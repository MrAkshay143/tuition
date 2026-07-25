<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('media', function (Blueprint $table) {
            // Check and drop columns if they already exist, to avoid conflicts
            if (!Schema::hasColumn('media', 'uuid')) {
                $table->uuid('uuid')->unique()->after('id');
            }
            if (!Schema::hasColumn('media', 'name')) {
                $table->string('name')->after('uuid');
            }
            if (!Schema::hasColumn('media', 'original_name')) {
                $table->string('original_name')->nullable()->after('name');
            }
            if (!Schema::hasColumn('media', 'provider')) {
                $table->string('provider', 50)->default('local')->after('original_name'); // local, youtube, r2, s3
            }
            if (!Schema::hasColumn('media', 'storage_driver')) {
                $table->string('storage_driver', 50)->nullable()->after('provider'); // public, r2, s3
            }
            if (!Schema::hasColumn('media', 'mime')) {
                $table->string('mime', 100)->nullable()->after('storage_driver');
            }
            if (!Schema::hasColumn('media', 'extension')) {
                $table->string('extension', 10)->nullable()->after('mime');
            }
            if (!Schema::hasColumn('media', 'size')) {
                $table->bigInteger('size')->default(0)->after('extension');
            }
            if (!Schema::hasColumn('media', 'duration')) {
                $table->integer('duration')->nullable()->after('size'); // video duration in seconds
            }
            if (!Schema::hasColumn('media', 'resolution')) {
                $table->string('resolution', 20)->nullable()->after('duration'); // e.g. 1920x1080
            }
            if (!Schema::hasColumn('media', 'thumbnail')) {
                $table->string('thumbnail')->nullable()->after('resolution');
            }
            if (!Schema::hasColumn('media', 'checksum')) {
                $table->string('checksum', 64)->nullable()->after('thumbnail');
            }
            if (!Schema::hasColumn('media', 'processing_status')) {
                $table->string('processing_status', 20)->default('ready')->after('checksum'); // uploading, queued, processing, ready, failed, archived
            }
            if (!Schema::hasColumn('media', 'visibility')) {
                $table->string('visibility', 20)->default('private')->after('processing_status'); // public, unlisted, private
            }
        });
    }

    public function down(): void
    {
        Schema::table('media', function (Blueprint $table) {
            $table->dropColumn([
                'uuid', 'name', 'original_name', 'provider', 'storage_driver',
                'mime', 'extension', 'size', 'duration', 'resolution', 'thumbnail',
                'checksum', 'processing_status', 'visibility'
            ]);
        });
    }
};
