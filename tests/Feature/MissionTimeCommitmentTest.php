<?php

namespace Tests\Feature;

use App\Models\Galaxy;
use App\Models\Mission;
use App\Models\Planet;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MissionTimeCommitmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_mission_has_time_commitment_fields(): void
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
        ]);

        $mission = Mission::factory()->create([
            'planet_id' => $planet->id,
            'user_id' => $user->id,
            'title' => 'Test Mission',
            'time_commitment_minutes' => 30,
            'commitment_type' => 'daily',
            'counts_toward_capacity' => true,
        ]);

        $this->assertDatabaseHas('missions', [
            'id' => $mission->id,
            'time_commitment_minutes' => 30,
            'commitment_type' => 'daily',
            'counts_toward_capacity' => true,
        ]);
    }

    public function test_mission_time_commitment_defaults(): void
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
        ]);

        $mission = Mission::factory()->create([
            'planet_id' => $planet->id,
            'user_id' => $user->id,
            'title' => 'Default Mission',
        ]);

        // Database defaults should be applied
        $mission->refresh();
        $this->assertEquals(15, $mission->time_commitment_minutes);
        $this->assertEquals('one_time', $mission->commitment_type);
        $this->assertEquals(1, $mission->counts_toward_capacity); // DB stores as 1/0
    }

    public function test_mission_commitment_types(): void
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
        ]);

        $commitmentTypes = ['one_time', 'daily', 'weekly', 'monthly'];

        foreach ($commitmentTypes as $type) {
            $mission = Mission::factory()->create([
                'planet_id' => $planet->id,
                'user_id' => $user->id,
                'title' => ucfirst($type) . ' Mission',
                'commitment_type' => $type,
            ]);

            $this->assertEquals($type, $mission->commitment_type);
        }
    }

    public function test_mission_can_be_excluded_from_capacity(): void
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
        ]);

        $mission = Mission::factory()->create([
            'planet_id' => $planet->id,
            'user_id' => $user->id,
            'title' => 'Bonus Mission',
            'counts_toward_capacity' => false,
        ]);

        $this->assertFalse($mission->counts_toward_capacity);
    }

    public function test_daily_missions_should_create_rockets(): void
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
        ]);

        Mission::factory()->create([
            'planet_id' => $planet->id,
            'user_id' => $user->id,
            'title' => 'Daily Mission 1',
            'commitment_type' => 'daily',
        ]);

        Mission::factory()->create([
            'planet_id' => $planet->id,
            'user_id' => $user->id,
            'title' => 'Daily Mission 2',
            'commitment_type' => 'daily',
        ]);

        // Should have 2 daily missions that will create rockets
        $activeDailyMissions = Mission::where('user_id', $user->id)
            ->where('commitment_type', 'daily')
            ->where('status', '!=', 'completed')
            ->count();

        $this->assertEquals(2, $activeDailyMissions);
    }

    public function test_completed_missions_should_not_create_rockets(): void
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
        ]);

        Mission::factory()->create([
            'planet_id' => $planet->id,
            'user_id' => $user->id,
            'title' => 'Completed Daily Mission',
            'status' => 'completed',
            'commitment_type' => 'daily',
        ]);

        // Should have 0 active daily missions
        $activeDailyMissions = Mission::where('user_id', $user->id)
            ->where('commitment_type', 'daily')
            ->where('status', '!=', 'completed')
            ->count();

        $this->assertEquals(0, $activeDailyMissions);
    }

    public function test_one_time_missions_should_not_create_rockets(): void
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
        ]);

        Mission::factory()->create([
            'planet_id' => $planet->id,
            'user_id' => $user->id,
            'title' => 'One-time Task',
            'commitment_type' => 'one_time',
        ]);

        // One-time missions shouldn't create rockets
        $rocketMissions = Mission::where('user_id', $user->id)
            ->where('status', '!=', 'completed')
            ->whereIn('commitment_type', ['daily', 'weekly', 'monthly'])
            ->count();

        $this->assertEquals(0, $rocketMissions);
    }

    public function test_dashboard_loads_with_mission_data(): void
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
        ]);

        Mission::factory()->count(3)->create([
            'planet_id' => $planet->id,
            'user_id' => $user->id,
            'title' => 'Daily Mission',
            'commitment_type' => 'daily',
        ]);

        $response = $this->actingAs($user)->get('/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(
            fn($page) => $page
                ->component('dashboard-3d')
                ->has('galaxies', 1)
                ->has('galaxies.0.planets', 1)
                ->has('galaxies.0.planets.0.missions', 3)
        );
    }
}
