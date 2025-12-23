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
        Schema::create('achievements', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('icon')->nullable();
            $table->enum('category', ['mission_completion', 'planet_launch', 'streak', 'milestone'])->default('mission_completion');
            $table->json('requirement_type');
            $table->integer('xp_reward')->default(50);
            $table->enum('rarity', ['common', 'rare', 'epic', 'legendary'])->default('common');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('achievements');
    }
};
