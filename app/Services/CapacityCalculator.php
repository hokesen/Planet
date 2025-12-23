<?php

namespace App\Services;

use App\Models\User;

class CapacityCalculator
{
    /**
     * Calculate current time commitment from active missions
     */
    public function calculateCurrentCommitment(User $user): array
    {
        $missions = $user->missions()
            ->where('status', '!=', 'completed')
            ->where('counts_toward_capacity', true)
            ->get();

        $dailyMinutes = 0;
        $weeklyMinutes = 0;
        $monthlyMinutes = 0;
        $dailyRockets = 0;
        $weeklyRockets = 0;
        $monthlyRockets = 0;

        foreach ($missions as $mission) {
            $minutes = $mission->time_commitment_minutes ?? 15;

            switch ($mission->commitment_type) {
                case 'daily':
                    $dailyMinutes += $minutes;
                    $dailyRockets++;
                    break;
                case 'weekly':
                    $weeklyMinutes += $minutes;
                    $weeklyRockets++;
                    break;
                case 'monthly':
                    $monthlyMinutes += $minutes;
                    $monthlyRockets++;
                    break;
            }
        }

        return [
            'daily' => $dailyMinutes,
            'weekly' => $weeklyMinutes,
            'monthly' => $monthlyMinutes,
            'daily_rockets' => $dailyRockets,
            'weekly_rockets' => $weeklyRockets,
            'monthly_rockets' => $monthlyRockets,
            'total_rockets' => $dailyRockets + $weeklyRockets + $monthlyRockets,
        ];
    }

    /**
     * Calculate capacity usage percentages
     * Assumes capacity settings already exist
     */
    public function calculateCapacityPercentages(User $user): array
    {
        $commitment = $this->calculateCurrentCommitment($user);
        $settings = $user->capacitySettings;

        // If no settings exist, return 0% for all
        if (!$settings) {
            return [
                'daily_percentage' => 0,
                'weekly_percentage' => 0,
                'monthly_percentage' => 0,
            ];
        }

        return [
            'daily_percentage' => $settings->daily_capacity_minutes > 0
                ? round(($commitment['daily'] / $settings->daily_capacity_minutes) * 100, 1)
                : 0,
            'weekly_percentage' => $settings->weekly_capacity_minutes > 0
                ? round(($commitment['weekly'] / $settings->weekly_capacity_minutes) * 100, 1)
                : 0,
            'monthly_percentage' => $settings->monthly_capacity_minutes > 0
                ? round(($commitment['monthly'] / $settings->monthly_capacity_minutes) * 100, 1)
                : 0,
        ];
    }
}
