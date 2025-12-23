<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        $user = auth()->user();

        $galaxies = $user->galaxies()
            ->with(['planets.missions' => function ($query) {
                $query->orderBy('sort_order')->orderBy('created_at');
            }])
            ->orderBy('sort_order')
            ->get();

        // Load or create capacity settings
        $capacitySettings = $user->capacitySettings;
        if (!$capacitySettings) {
            $capacitySettings = $user->capacitySettings()->create([]);
        }

        // Calculate current capacity usage
        $calculator = new \App\Services\CapacityCalculator();
        $commitment = $calculator->calculateCurrentCommitment($user);
        $percentages = $calculator->calculateCapacityPercentages($user);

        return Inertia::render('dashboard-3d', [
            'galaxies' => $galaxies,
            'capacity' => [
                'settings' => $capacitySettings,
                'commitment' => $commitment,
                'percentages' => $percentages,
            ],
        ]);
    })->name('dashboard');

    Route::resource('galaxies', \App\Http\Controllers\GalaxyController::class);
    Route::resource('planets', \App\Http\Controllers\PlanetController::class);
    Route::resource('missions', \App\Http\Controllers\MissionController::class);
});

require __DIR__.'/settings.php';
