<?php

namespace App\Http\Controllers;

use App\Models\Planet;
use Illuminate\Http\Request;

class PlanetController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'galaxy_id' => 'required|exists:galaxies,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:planning,active,on_hold,completed,abandoned',
            'size' => 'nullable|in:small,medium,large,massive',
            'color' => 'nullable|string|max:7',
            'target_completion_date' => 'nullable|date',
        ]);

        $planet = auth()->user()->planets()->create([
            ...$validated,
            'health_status' => 'stable',
        ]);

        return back();
    }

    public function update(Request $request, Planet $planet)
    {
        // Ensure user owns this planet
        if ($planet->user_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:planning,active,on_hold,completed,abandoned',
            'health_status' => 'nullable|in:thriving,stable,critical,life_support',
            'size' => 'nullable|in:small,medium,large,massive',
            'color' => 'nullable|string|max:7',
            'target_completion_date' => 'nullable|date',
        ]);

        $planet->update($validated);

        return back();
    }

    public function destroy(Planet $planet)
    {
        // Ensure user owns this planet
        if ($planet->user_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $planet->delete();

        return back();
    }
}
