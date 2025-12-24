<?php

namespace App\Http\Controllers;

use App\Http\Requests\Mission\StoreMissionRequest;
use App\Http\Requests\Mission\UpdateMissionRequest;
use App\Models\Mission;
use App\Models\MissionRefuel;

class MissionController extends Controller
{
    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreMissionRequest $request)
    {
        $data = $request->validated();

        // Automatically set planet_id to the first planet in the route if not provided
        if (empty($data['planet_id']) && ! empty($data['planet_route'])) {
            $data['planet_id'] = $data['planet_route'][0];
        }

        $mission = Mission::create([
            ...$data,
            'user_id' => auth()->id(),
            'status' => $request->status ?? 'todo',
            'priority' => $request->priority ?? 'medium',
        ]);

        return back()->with('success', 'Mission created successfully');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateMissionRequest $request, Mission $mission)
    {
        // Ensure user owns this mission
        if ($mission->user_id !== auth()->id()) {
            abort(403);
        }

        // Handle completion status
        $data = $request->validated();

        // Automatically set planet_id to the first planet in the route if route is being updated
        if (isset($data['planet_route']) && ! empty($data['planet_route'])) {
            $data['planet_id'] = $data['planet_route'][0];
        }

        if (isset($data['status']) && $data['status'] === 'completed' && $mission->status !== 'completed') {
            $data['completed_at'] = now();
        } elseif (isset($data['status']) && $data['status'] !== 'completed') {
            $data['completed_at'] = null;
        }

        $mission->update($data);

        return back()->with('success', 'Mission updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Mission $mission)
    {
        // Ensure user owns this mission
        if ($mission->user_id !== auth()->id()) {
            abort(403);
        }

        $mission->delete();

        return back()->with('success', 'Mission deleted successfully');
    }

    /**
     * Log a refuel for the mission
     */
    public function refuel(Mission $mission)
    {
        // Ensure user owns this mission
        if ($mission->user_id !== auth()->id()) {
            abort(403);
        }

        $mission->refuels()->create([
            'refueled_at' => now(),
        ]);

        return back()->with('success', 'Mission refueled successfully');
    }

    /**
     * Delete a specific refuel entry
     */
    public function deleteRefuel(Mission $mission, MissionRefuel $refuel)
    {
        // Ensure user owns this mission
        if ($mission->user_id !== auth()->id()) {
            abort(403);
        }

        // Ensure refuel belongs to this mission
        if ($refuel->mission_id !== $mission->id) {
            abort(403);
        }

        $refuel->delete();

        return back()->with('success', 'Refuel entry deleted successfully');
    }
}
