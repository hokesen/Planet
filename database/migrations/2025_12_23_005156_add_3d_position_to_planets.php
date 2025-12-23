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
        Schema::table('planets', function (Blueprint $table) {
            $table->decimal('position_x', 8, 2)->nullable()->after('color');
            $table->decimal('position_y', 8, 2)->nullable()->after('position_x');
            $table->decimal('position_z', 8, 2)->nullable()->after('position_y');
            $table->decimal('orbit_radius', 8, 2)->nullable()->after('position_z');
            $table->boolean('use_auto_positioning')->default(true)->after('orbit_radius');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('planets', function (Blueprint $table) {
            $table->dropColumn([
                'position_x',
                'position_y',
                'position_z',
                'orbit_radius',
                'use_auto_positioning'
            ]);
        });
    }
};
