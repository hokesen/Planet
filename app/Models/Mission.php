<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Mission extends Model
{
    /** @use HasFactory<\Database\Factories\MissionFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'deadline' => 'datetime',
            'completed_at' => 'datetime',
            'next_occurrence_date' => 'datetime',
            'is_recurring' => 'boolean',
            'recurrence_pattern' => 'array',
            'counts_toward_capacity' => 'boolean',
        ];
    }

    protected $fillable = [
        'planet_id',
        'user_id',
        'title',
        'description',
        'status',
        'priority',
        'deadline',
        'completed_at',
        'is_recurring',
        'recurrence_pattern',
        'next_occurrence_date',
        'xp_value',
        'sort_order',
        'time_commitment_minutes',
        'commitment_type',
        'counts_toward_capacity',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function planet()
    {
        return $this->belongsTo(Planet::class);
    }
}
