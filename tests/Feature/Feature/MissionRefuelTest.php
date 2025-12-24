<?php

namespace Tests\Feature\Feature;

use App\Models\Galaxy;
use App\Models\Mission;
use App\Models\MissionRefuel;
use App\Models\Planet;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MissionRefuelTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_refuel_a_mission(): void
    {
        $user = User::factory()->create();
        $mission = Mission::factory()->create([
            'user_id' => $user->id,
            'commitment_type' => 'daily',
        ]);

        $response = $this->actingAs($user)
            ->post("/missions/{$mission->id}/refuel");

        $response->assertRedirect();
        $this->assertDatabaseHas('mission_refuels', [
            'mission_id' => $mission->id,
        ]);
    }

    public function test_user_can_delete_refuel_entry(): void
    {
        $user = User::factory()->create();
        $mission = Mission::factory()->create([
            'user_id' => $user->id,
            'commitment_type' => 'weekly',
        ]);
        $refuel = MissionRefuel::factory()->create([
            'mission_id' => $mission->id,
        ]);

        $response = $this->actingAs($user)
            ->delete("/missions/{$mission->id}/refuels/{$refuel->id}");

        $response->assertRedirect();
        $this->assertDatabaseMissing('mission_refuels', [
            'id' => $refuel->id,
        ]);
    }

    public function test_fuel_status_calculated_correctly_for_daily_mission(): void
    {
        $mission = Mission::factory()->create([
            'commitment_type' => 'daily',
        ]);

        // Mission just created, should have ~24 hours of fuel
        $fuelStatus = $mission->fuel_status;
        $this->assertFalse($fuelStatus['needs_refuel']);
        $this->assertGreaterThan(86000, $fuelStatus['fuel_remaining_seconds']); // ~24 hours in seconds

        // Add a refuel from yesterday
        MissionRefuel::factory()->create([
            'mission_id' => $mission->id,
            'refueled_at' => now()->subHours(25),
        ]);

        // Refresh the mission to get updated fuel status
        $mission->refresh();
        $fuelStatus = $mission->fuel_status;
        $this->assertTrue($fuelStatus['needs_refuel']);
    }

    public function test_one_time_missions_do_not_need_refueling(): void
    {
        $mission = Mission::factory()->create([
            'commitment_type' => 'one_time',
        ]);

        $fuelStatus = $mission->fuel_status;
        $this->assertFalse($fuelStatus['needs_refuel']);
        $this->assertNull($fuelStatus['fuel_remaining_seconds']);
        $this->assertNull($fuelStatus['next_refuel_due']);
    }

    public function test_user_cannot_refuel_another_users_mission(): void
    {
        $user = User::factory()->create();
        $mission = Mission::factory()->create([
            'commitment_type' => 'daily',
        ]);

        $response = $this->actingAs($user)
            ->post("/missions/{$mission->id}/refuel");

        $response->assertStatus(403);
    }

    public function test_user_cannot_delete_another_users_refuel(): void
    {
        $user = User::factory()->create();
        $mission = Mission::factory()->create([
            'commitment_type' => 'daily',
        ]);
        $refuel = MissionRefuel::factory()->create([
            'mission_id' => $mission->id,
        ]);

        $response = $this->actingAs($user)
            ->delete("/missions/{$mission->id}/refuels/{$refuel->id}");

        $response->assertStatus(403);
    }
}
