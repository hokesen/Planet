<?php

namespace App\Http\Controllers;

use App\Http\Requests\Mission\StoreMissionRequest;
use App\Http\Requests\Mission\UpdateMissionRequest;
use App\Models\Mission;

class MissionController extends Controller
{
    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreMissionRequest $request)
    {
        $mission = Mission::create([
            ...$request->validated(),
            'user_id' => auth()->id(),
            'status' => $request->status ?? 'pending',
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
}
