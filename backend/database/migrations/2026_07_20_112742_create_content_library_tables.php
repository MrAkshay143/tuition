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
        // 1. Create content_categories table
        if (!Schema::hasTable('content_categories')) {
            Schema::create('content_categories', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique();
                $table->string('slug')->unique();
                $table->timestamps();
            });
        }

        // 2. Create content_tags table
        if (!Schema::hasTable('content_tags')) {
            Schema::create('content_tags', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique();
                $table->timestamps();
            });
        }

        // 3. Upgrade media table
        Schema::table('media', function (Blueprint $table) {
            if (!Schema::hasColumn('media', 'description')) {
                $table->text('description')->nullable()->after('name');
            }
            if (!Schema::hasColumn('media', 'type')) {
                $table->string('type', 20)->default('other')->after('description');
            }
            if (!Schema::hasColumn('media', 'category_id')) {
                $table->foreignId('category_id')->nullable()->after('type')->constrained('content_categories')->nullOnDelete();
            }
            if (!Schema::hasColumn('media', 'publish_at')) {
                $table->timestamp('publish_at')->nullable()->after('visibility');
            }
        });

        // 4. Create content_tag_pivot table
        if (!Schema::hasTable('content_tag_pivot')) {
            Schema::create('content_tag_pivot', function (Blueprint $table) {
                $table->foreignId('media_id')->constrained('media')->cascadeOnDelete();
                $table->foreignId('tag_id')->constrained('content_tags')->cascadeOnDelete();
                $table->primary(['media_id', 'tag_id']);
            });
        }

        // 5. Create media_links table
        if (!Schema::hasTable('media_links')) {
            Schema::create('media_links', function (Blueprint $table) {
                $table->id();
                $table->foreignId('media_id')->constrained('media')->cascadeOnDelete();
                $table->string('entity_type');
                $table->unsignedBigInteger('entity_id');
                $table->string('link_type')->default('link'); // primary, download, resource
                $table->integer('display_order')->default(0);
                $table->boolean('is_required')->default(true);
                $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
                $table->timestamps();

                $table->index(['media_id', 'entity_type', 'entity_id'], 'media_links_composite_index');
                $table->index(['entity_type', 'entity_id']);
            });
        }

        // 6. Create media_statistics table
        if (!Schema::hasTable('media_statistics')) {
            Schema::create('media_statistics', function (Blueprint $table) {
                $table->id();
                $table->foreignId('media_id')->constrained('media')->cascadeOnDelete();
                $table->unsignedInteger('views')->default(0);
                $table->unsignedInteger('downloads')->default(0);
                $table->timestamp('last_viewed_at')->nullable();
                $table->timestamp('last_downloaded_at')->nullable();
                $table->timestamps();

                $table->index('media_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('media_statistics');
        Schema::dropIfExists('media_links');
        Schema::dropIfExists('content_tag_pivot');
        
        Schema::table('media', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropColumn(['description', 'type', 'category_id', 'publish_at']);
        });

        Schema::dropIfExists('content_tags');
        Schema::dropIfExists('content_categories');
    }
};
