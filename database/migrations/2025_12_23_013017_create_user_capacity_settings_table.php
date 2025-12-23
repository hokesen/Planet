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
        Schema::create('user_capacity_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->integer('daily_capacity_minutes')->default(120);
            $table->integer('weekly_capacity_minutes')->default(600);
            $table->integer('monthly_capacity_minutes')->default(2400);
            $table->boolean('show_capacity_warnings')->default(true);
            $table->enum('capacity_display_mode', ['strict', 'flexible'])->default('flexible');
            $table->timestamps();

            $table->unique('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_capacity_settings');
    }
};
