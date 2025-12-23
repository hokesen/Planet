<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Planet extends Model
{
    /** @use HasFactory<\Database\Factories\PlanetFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'target_completion_date' => 'date',
            'completed_at' => 'datetime',
            'position_x' => 'decimal:2',
            'position_y' => 'decimal:2',
            'position_z' => 'decimal:2',
            'orbit_radius' => 'decimal:2',
            'use_auto_positioning' => 'boolean',
        ];
    }

    protected $fillable = [
        'galaxy_id',
        'user_id',
        'name',
        'description',
        'status',
        'health_status',
        'size',
        'color',
        'target_completion_date',
        'completed_at',
        'position_x',
        'position_y',
        'position_z',
        'orbit_radius',
        'use_auto_positioning',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function galaxy()
    {
        return $this->belongsTo(Galaxy::class);
    }

    public function missions()
    {
        return $this->hasMany(Mission::class);
    }

    public function milestones()
    {
        return $this->hasMany(Milestone::class);
    }
}
