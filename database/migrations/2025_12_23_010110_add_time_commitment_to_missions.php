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
        Schema::table('missions', function (Blueprint $table) {
            $table->integer('time_commitment_minutes')->default(15)->after('xp_value');
            $table->enum('commitment_type', ['one_time', 'daily', 'weekly', 'monthly'])->default('one_time')->after('time_commitment_minutes');
            $table->boolean('counts_toward_capacity')->default(true)->after('commitment_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('missions', function (Blueprint $table) {
            $table->dropColumn([
                'time_commitment_minutes',
                'commitment_type',
                'counts_toward_capacity'
            ]);
        });
    }
};
