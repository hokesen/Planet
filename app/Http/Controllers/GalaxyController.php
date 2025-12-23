<?php

namespace App\Http\Controllers;

use App\Models\Galaxy;
use Illuminate\Http\Request;

class GalaxyController extends Controller
{
    public function index()
    {
        $galaxies = auth()->user()->galaxies()->with('planets')->orderBy('sort_order')->get();

        return response()->json($galaxies);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'color' => 'nullable|string|max:7',
            'icon' => 'nullable|string|max:10',
        ]);

        $galaxy = auth()->user()->galaxies()->create([
            ...$validated,
            'sort_order' => auth()->user()->galaxies()->max('sort_order') + 1,
        ]);

        return back();
    }

    public function update(Request $request, Galaxy $galaxy)
    {
        // Ensure user owns this galaxy
        if ($galaxy->user_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'color' => 'nullable|string|max:7',
            'icon' => 'nullable|string|max:10',
        ]);

        $galaxy->update($validated);

        return back();
    }

    public function destroy(Galaxy $galaxy)
    {
        // Ensure user owns this galaxy
        if ($galaxy->user_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $galaxy->delete();

        return back();
    }
}
