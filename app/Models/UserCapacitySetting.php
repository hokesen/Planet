<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserCapacitySetting extends Model
{
    protected $fillable = [
        'user_id',
        'daily_capacity_minutes',
        'weekly_capacity_minutes',
        'monthly_capacity_minutes',
        'show_capacity_warnings',
        'capacity_display_mode',
    ];

    protected function casts(): array
    {
        return [
            'show_capacity_warnings' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
