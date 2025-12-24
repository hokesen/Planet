import { Rocket } from 'lucide-react';

interface CapacityData {
    settings: {
        daily_capacity_minutes: number;
        weekly_capacity_minutes: number;
        monthly_capacity_minutes: number;
        show_capacity_warnings: boolean;
        capacity_display_mode: 'strict' | 'flexible';
    };
    commitment: {
        daily: number;
        weekly: number;
        monthly: number;
        daily_rockets: number;
        weekly_rockets: number;
        monthly_rockets: number;
        total_rockets: number;
    };
    percentages: {
        daily_percentage: number;
        weekly_percentage: number;
        monthly_percentage: number;
    };
}

interface CapacityIndicatorProps {
    capacity: CapacityData;
}

export default function CapacityIndicator({
    capacity,
}: CapacityIndicatorProps) {
    const getProgressColor = (percentage: number) => {
        if (percentage >= 100) return 'bg-red-500';
        if (percentage >= 80) return 'bg-orange-500';
        if (percentage >= 60) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const formatMinutes = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    return (
        <div className="absolute top-4 right-4 rounded-lg bg-black/70 p-4 text-white backdrop-blur-lg">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
                <Rocket className="h-4 w-4" />
                Capacity Tracker
            </h3>

            <div className="space-y-3 text-xs">
                {/* Daily Capacity */}
                <div>
                    <div className="mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                            <span className="text-red-400">●</span>
                            Daily
                        </span>
                        <span className="font-mono">
                            {formatMinutes(capacity.commitment.daily)} /{' '}
                            {formatMinutes(
                                capacity.settings.daily_capacity_minutes,
                            )}
                        </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
                        <div
                            className={`h-full transition-all ${getProgressColor(capacity.percentages.daily_percentage)}`}
                            style={{
                                width: `${Math.min(capacity.percentages.daily_percentage, 100)}%`,
                            }}
                        />
                    </div>
                    <div className="mt-0.5 text-right text-[10px] text-gray-400">
                        {capacity.commitment.daily_rockets}{' '}
                        {capacity.commitment.daily_rockets === 1
                            ? 'rocket'
                            : 'rockets'}
                    </div>
                </div>

                {/* Weekly Capacity */}
                <div>
                    <div className="mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                            <span className="text-orange-400">●</span>
                            Weekly
                        </span>
                        <span className="font-mono">
                            {formatMinutes(capacity.commitment.weekly)} /{' '}
                            {formatMinutes(
                                capacity.settings.weekly_capacity_minutes,
                            )}
                        </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
                        <div
                            className={`h-full transition-all ${getProgressColor(capacity.percentages.weekly_percentage)}`}
                            style={{
                                width: `${Math.min(capacity.percentages.weekly_percentage, 100)}%`,
                            }}
                        />
                    </div>
                    <div className="mt-0.5 text-right text-[10px] text-gray-400">
                        {capacity.commitment.weekly_rockets}{' '}
                        {capacity.commitment.weekly_rockets === 1
                            ? 'rocket'
                            : 'rockets'}
                    </div>
                </div>

                {/* Monthly Capacity */}
                <div>
                    <div className="mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                            <span className="text-yellow-400">●</span>
                            Monthly
                        </span>
                        <span className="font-mono">
                            {formatMinutes(capacity.commitment.monthly)} /{' '}
                            {formatMinutes(
                                capacity.settings.monthly_capacity_minutes,
                            )}
                        </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
                        <div
                            className={`h-full transition-all ${getProgressColor(capacity.percentages.monthly_percentage)}`}
                            style={{
                                width: `${Math.min(capacity.percentages.monthly_percentage, 100)}%`,
                            }}
                        />
                    </div>
                    <div className="mt-0.5 text-right text-[10px] text-gray-400">
                        {capacity.commitment.monthly_rockets}{' '}
                        {capacity.commitment.monthly_rockets === 1
                            ? 'rocket'
                            : 'rockets'}
                    </div>
                </div>

                {/* Total Summary */}
                <div className="border-t border-gray-600 pt-2">
                    <div className="flex items-center justify-between font-semibold">
                        <span>Total Rockets</span>
                        <span>{capacity.commitment.total_rockets}</span>
                    </div>
                </div>

                {/* Warning if over capacity */}
                {capacity.settings.show_capacity_warnings &&
                    (capacity.percentages.daily_percentage >= 100 ||
                        capacity.percentages.weekly_percentage >= 100 ||
                        capacity.percentages.monthly_percentage >= 100) && (
                        <div className="rounded border border-red-500/50 bg-red-500/10 p-2 text-[10px]">
                            ⚠️ Over capacity! Consider adjusting your
                            commitments.
                        </div>
                    )}
            </div>
        </div>
    );
}
