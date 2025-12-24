<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Galaxy>
 */
class GalaxyFactory extends Factory
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
            'name' => fake()->words(2, true),
            'color' => fake()->hexColor(),
            'icon' => fake()->randomElement(['🌌', '🌠', '✨', '🔭', '🌟']),
            'sort_order' => 0,
        ];
    }
}
