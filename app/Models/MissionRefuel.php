<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MissionRefuel extends Model
{
    use HasFactory;

    protected $fillable = [
        'mission_id',
        'refueled_at',
    ];

    protected function casts(): array
    {
        return [
            'refueled_at' => 'datetime',
        ];
    }

    public function mission(): BelongsTo
    {
        return $this->belongsTo(Mission::class);
    }
}
