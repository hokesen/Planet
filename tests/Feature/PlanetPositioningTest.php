<?php

namespace Tests\Feature;

use App\Models\Galaxy;
use App\Models\Planet;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlanetPositioningTest extends TestCase
{
    use RefreshDatabase;

    public function test_planet_has_3d_position_fields(): void
    {
        $user = User::factory()->create();
        $galaxy = Galaxy::factory()->create([
            'user_id' => $user->id,
            'name' => 'Test Galaxy',
            'color' => '#3b82f6',
        ]);

        $planet = Planet::factory()->create([
            'galaxy_id' => $galaxy->id,
            'user_id' => $user->id,
            'name' => 'Test Planet',
            'position_x' => 100.50,
            'position_y' => 200.75,
            'position_z' => 300.25,
            'orbit_radius' => 15.00,
            'use_auto_positioning' => false,
        ]);

        $this->assertDatabaseHas('planets', [
            'id' => $planet->id,
            'position_x' => 100.50,
            'position_y' => 200.75,
            'position_z' => 300.25,
            'orbit_radius' => 15.00,
            'use_auto_positioning' => false,
        ]);
    }

    public function test_planet_position_fields_are_nullable(): void
    {
        $user = User::factory()->create();
        $galaxy = Galaxy::factory()->create([
            'user_id' => $user->id,
            'name' => 'Test Galaxy',
            'color' => '#3b82f6',
        ]);

        $planet = Planet::factory()->create([
            'galaxy_id' => $galaxy->id,
            'user_id' => $user->id,
            'name' => 'Test Planet',
            'position_x' => null,
            'position_y' => null,
            'position_z' => null,
            'orbit_radius' => null,
        ]);

        $this->assertDatabaseHas('planets', [
            'id' => $planet->id,
            'position_x' => null,
            'position_y' => null,
            'position_z' => null,
            'orbit_radius' => null,
        ]);
    }

    public function test_planet_auto_positioning_can_be_set(): void
    {
        $user = User::factory()->create();
        $galaxy = Galaxy::factory()->create([
            'user_id' => $user->id,
            'name' => 'Test Galaxy',
            'color' => '#3b82f6',
        ]);

        $planetAuto = Planet::factory()->create([
            'galaxy_id' => $galaxy->id,
            'user_id' => $user->id,
            'name' => 'Auto Planet',
            'use_auto_positioning' => true,
        ]);

        $planetManual = Planet::factory()->create([
            'galaxy_id' => $galaxy->id,
            'user_id' => $user->id,
            'name' => 'Manual Planet',
            'use_auto_positioning' => false,
        ]);

        $this->assertTrue($planetAuto->use_auto_positioning);
        $this->assertFalse($planetManual->use_auto_positioning);
    }

    public function test_planet_casts_position_fields_correctly(): void
    {
        $user = User::factory()->create();
        $galaxy = Galaxy::factory()->create([
            'user_id' => $user->id,
            'name' => 'Test Galaxy',
            'color' => '#3b82f6',
        ]);

        $planet = Planet::factory()->create([
            'galaxy_id' => $galaxy->id,
            'user_id' => $user->id,
            'name' => 'Test Planet',
            'position_x' => 123.45,
            'position_y' => 678.90,
            'position_z' => 111.22,
            'orbit_radius' => 33.44,
            'use_auto_positioning' => true,
        ]);

        // Test that values are cast to correct types
        $this->assertIsString($planet->position_x);
        $this->assertEquals('123.45', $planet->position_x);
        $this->assertIsBool($planet->use_auto_positioning);
        $this->assertTrue($planet->use_auto_positioning);
    }

    public function test_dashboard_3d_loads_with_planet_positions(): void
    {
        $user = User::factory()->create();
        $galaxy = Galaxy::factory()->create([
            'user_id' => $user->id,
            'name' => 'Test Galaxy',
            'color' => '#3b82f6',
        ]);

        Planet::factory()->count(3)->create([
            'galaxy_id' => $galaxy->id,
            'user_id' => $user->id,
            'name' => 'Test Planet',
            'position_x' => 100.00,
            'position_y' => 200.00,
            'position_z' => 300.00,
        ]);

        $response = $this->actingAs($user)->get('/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(
            fn($page) => $page
                ->component('dashboard-3d')
                ->has('galaxies', 1)
                ->has('galaxies.0.planets', 3)
        );
    }

    public function test_planet_can_update_3d_position(): void
    {
        $user = User::factory()->create();
        $galaxy = Galaxy::factory()->create([
            'user_id' => $user->id,
            'name' => 'Test Galaxy',
            'color' => '#3b82f6',
        ]);

        $planet = Planet::factory()->create([
            'galaxy_id' => $galaxy->id,
            'user_id' => $user->id,
            'name' => 'Test Planet',
            'position_x' => 100.00,
            'position_y' => 200.00,
            'position_z' => 300.00,
        ]);

        $planet->update([
            'position_x' => 150.50,
            'position_y' => 250.75,
            'position_z' => 350.25,
        ]);

        $this->assertEquals('150.50', $planet->fresh()->position_x);
        $this->assertEquals('250.75', $planet->fresh()->position_y);
        $this->assertEquals('350.25', $planet->fresh()->position_z);
    }
}
