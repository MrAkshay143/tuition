<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('live_classes', function (Blueprint $table) {
            // SQLite doesn't strictly enforce enums created via Laravel (it just creates VARCHAR)
            // But if it was created with CHECK constraint, we might need to recreate.
            // For Laravel 11, this is the standard way to update it.
            $table->string('provider')->default('zoom')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('live_classes', function (Blueprint $table) {
            $table->string('provider')->default('zoom')->change();
        });
    }
};
