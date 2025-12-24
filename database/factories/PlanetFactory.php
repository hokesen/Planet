<?php

namespace Database\Factories;

use App\Models\Galaxy;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Planet>
 */
class PlanetFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'galaxy_id' => Galaxy::factory(),
            'name' => fake()->words(2, true),
            'description' => fake()->optional()->paragraph(),
            'status' => fake()->randomElement(['planning', 'active', 'on_hold', 'completed', 'abandoned']),
            'health_status' => fake()->randomElement(['thriving', 'stable', 'critical', 'life_support']),
            'size' => fake()->randomElement(['small', 'medium', 'large', 'massive']),
            'color' => fake()->optional()->hexColor(),
            'use_auto_positioning' => true,
        ];
    }
}
