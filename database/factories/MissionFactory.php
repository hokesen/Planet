<?php

namespace Database\Factories;

use App\Models\Planet;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Mission>
 */
class MissionFactory extends Factory
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
            'planet_id' => Planet::factory(),
            'title' => fake()->sentence(),
            'description' => fake()->paragraph(),
            'status' => fake()->randomElement(['todo', 'in_progress', 'completed', 'blocked', 'cancelled']),
            'priority' => fake()->randomElement(['low', 'medium', 'high', 'critical']),
            'deadline' => fake()->optional()->dateTimeBetween('now', '+1 month'),
            'commitment_type' => fake()->randomElement(['one_time', 'daily', 'weekly', 'monthly']),
            'time_commitment_minutes' => fake()->numberBetween(15, 240),
            'counts_toward_capacity' => true,
            'sort_order' => 0,
        ];
    }
}
