<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
            'planet_route' => 'array',
            'counts_toward_capacity' => 'boolean',
        ];
    }

    protected $fillable = [
        'planet_id',
        'planet_route',
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

    protected $appends = ['fuel_status'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function planet(): BelongsTo
    {
        return $this->belongsTo(Planet::class);
    }

    public function refuels(): HasMany
    {
        return $this->hasMany(MissionRefuel::class)->orderBy('refueled_at', 'desc');
    }

    /**
     * Get the last refuel date for this mission
     */
    public function getLastRefuelDate(): ?Carbon
    {
        $lastRefuel = $this->refuels()->first();

        return $lastRefuel ? $lastRefuel->refueled_at : null;
    }

    /**
     * Calculate when the next refuel is due based on commitment type
     */
    public function getNextRefuelDue(): ?Carbon
    {
        $lastRefuel = $this->getLastRefuelDate();

        // If never refueled, use mission creation date
        $baseDate = $lastRefuel ?? $this->created_at;

        return match ($this->commitment_type) {
            'daily' => $baseDate->copy()->addDay(),
            'weekly' => $baseDate->copy()->addWeek(),
            'monthly' => $baseDate->copy()->addMonth(),
            'one_time' => null, // One-time missions don't need refueling
            default => null,
        };
    }

    /**
     * Get fuel remaining in seconds
     */
    public function getFuelRemaining(): ?int
    {
        $nextDue = $this->getNextRefuelDue();

        if ($nextDue === null) {
            return null;
        }

        $remaining = now()->diffInSeconds($nextDue, false);

        return max(0, $remaining); // Don't return negative values
    }

    /**
     * Check if mission needs refueling
     */
    public function needsRefuel(): bool
    {
        if ($this->commitment_type === 'one_time') {
            return false;
        }

        $nextDue = $this->getNextRefuelDue();

        return $nextDue && now()->greaterThanOrEqualTo($nextDue);
    }

    /**
     * Get fuel status with detailed information
     */
    protected function fuelStatus(): Attribute
    {
        return Attribute::make(
            get: function () {
                if ($this->commitment_type === 'one_time') {
                    return [
                        'needs_refuel' => false,
                        'fuel_remaining_seconds' => null,
                        'last_refuel_date' => null,
                        'next_refuel_due' => null,
                    ];
                }

                $lastRefuel = $this->getLastRefuelDate();
                $nextDue = $this->getNextRefuelDue();
                $remaining = $this->getFuelRemaining();

                return [
                    'needs_refuel' => $this->needsRefuel(),
                    'fuel_remaining_seconds' => $remaining,
                    'last_refuel_date' => $lastRefuel?->toISOString(),
                    'next_refuel_due' => $nextDue?->toISOString(),
                ];
            }
        );
    }
}
