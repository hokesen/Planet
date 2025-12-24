import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Galaxy3D, Mission3D } from '@/types/space';

interface WormholeModalProps {
    isOpen: boolean;
    onClose: () => void;
    galaxies: Galaxy3D[];
    capacity: {
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
    };
}

export default function WormholeModal({
    isOpen,
    onClose,
    galaxies,
    capacity,
}: WormholeModalProps) {
    // Collect all active rockets (missions with commitment types)
    const activeRockets: Array<{
        mission: Mission3D;
        planetName: string;
        galaxyName: string;
        galaxyColor: string;
    }> = [];

    galaxies.forEach((galaxy) => {
        galaxy.planets.forEach((planet) => {
            if (planet.missions) {
                planet.missions.forEach((mission) => {
                    if (
                        mission.status !== 'completed' &&
                        (mission.commitment_type === 'daily' ||
                            mission.commitment_type === 'weekly' ||
                            mission.commitment_type === 'monthly')
                    ) {
                        activeRockets.push({
                            mission,
                            planetName: planet.name,
                            galaxyName: galaxy.name,
                            galaxyColor: galaxy.color,
                        });
                    }
                });
            }
        });
    });

    // Group rockets by commitment type
    const dailyRockets = activeRockets.filter((r) => r.mission.commitment_type === 'daily');
    const weeklyRockets = activeRockets.filter((r) => r.mission.commitment_type === 'weekly');
    const monthlyRockets = activeRockets.filter((r) => r.mission.commitment_type === 'monthly');

    const getPriorityBadgeColor = (priority: string) => {
        const colors = {
            critical: 'bg-red-500/20 text-red-400 border-red-500/50',
            high: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
            medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
            low: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
        };
        return colors[priority as keyof typeof colors] || 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    };

    const formatMinutes = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = Math.floor(minutes % 60);
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    const getPercentageColor = (percentage: number) => {
        if (percentage >= 100) return 'text-red-500';
        if (percentage >= 80) return 'text-orange-500';
        if (percentage >= 60) return 'text-yellow-500';
        return 'text-green-500';
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-2xl">
                        <span className="text-3xl">🌀</span>
                        Refueling Wormhole
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Capacity Overview */}
                    <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-4">
                        <h3 className="mb-3 text-lg font-semibold">Capacity Status</h3>
                        <div className="grid grid-cols-3 gap-4">
                            {/* Daily */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">Daily</span>
                                    <span className={getPercentageColor(capacity.percentages.daily_percentage)}>
                                        {Math.round(capacity.percentages.daily_percentage)}%
                                    </span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-700">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                                        style={{ width: `${Math.min(100, capacity.percentages.daily_percentage)}%` }}
                                    />
                                </div>
                                <div className="text-xs text-gray-400">
                                    {formatMinutes(capacity.commitment.daily)} / {formatMinutes(capacity.settings.daily_capacity_minutes)}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {capacity.commitment.daily_rockets} rocket{capacity.commitment.daily_rockets !== 1 ? 's' : ''}
                                </div>
                            </div>

                            {/* Weekly */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">Weekly</span>
                                    <span className={getPercentageColor(capacity.percentages.weekly_percentage)}>
                                        {Math.round(capacity.percentages.weekly_percentage)}%
                                    </span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-700">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                                        style={{ width: `${Math.min(100, capacity.percentages.weekly_percentage)}%` }}
                                    />
                                </div>
                                <div className="text-xs text-gray-400">
                                    {formatMinutes(capacity.commitment.weekly)} / {formatMinutes(capacity.settings.weekly_capacity_minutes)}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {capacity.commitment.weekly_rockets} rocket{capacity.commitment.weekly_rockets !== 1 ? 's' : ''}
                                </div>
                            </div>

                            {/* Monthly */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">Monthly</span>
                                    <span className={getPercentageColor(capacity.percentages.monthly_percentage)}>
                                        {Math.round(capacity.percentages.monthly_percentage)}%
                                    </span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-700">
                                    <div
                                        className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all"
                                        style={{ width: `${Math.min(100, capacity.percentages.monthly_percentage)}%` }}
                                    />
                                </div>
                                <div className="text-xs text-gray-400">
                                    {formatMinutes(capacity.commitment.monthly)} / {formatMinutes(capacity.settings.monthly_capacity_minutes)}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {capacity.commitment.monthly_rockets} rocket{capacity.commitment.monthly_rockets !== 1 ? 's' : ''}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Active Rockets */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Active Rockets ({activeRockets.length})</h3>

                        {activeRockets.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-gray-700 p-8 text-center text-gray-500">
                                No active rockets in transit
                            </div>
                        ) : (
                            <>
                                {/* Daily Rockets */}
                                {dailyRockets.length > 0 && (
                                    <div>
                                        <h4 className="mb-2 text-sm font-medium text-gray-400">
                                            Daily Missions ({dailyRockets.length})
                                        </h4>
                                        <div className="space-y-2">
                                            {dailyRockets.map((rocket, idx) => (
                                                <div
                                                    key={`daily-${idx}`}
                                                    className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-900/30 p-3"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="h-3 w-3 rounded-full"
                                                            style={{ backgroundColor: rocket.galaxyColor }}
                                                        />
                                                        <div>
                                                            <div className="font-medium">{rocket.mission.title}</div>
                                                            <div className="text-xs text-gray-500">
                                                                {rocket.galaxyName} → {rocket.planetName}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className={`rounded border px-2 py-1 text-xs font-medium ${getPriorityBadgeColor(rocket.mission.priority)}`}>
                                                        {rocket.mission.priority}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Weekly Rockets */}
                                {weeklyRockets.length > 0 && (
                                                                    <div>
                                        <h4 className="mb-2 text-sm font-medium text-gray-400">
                                            Weekly Missions ({weeklyRockets.length})
                                        </h4>
                                        <div className="space-y-2">
                                            {weeklyRockets.map((rocket, idx) => (
                                                <div
                                                    key={`weekly-${idx}`}
                                                    className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-900/30 p-3"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="h-3 w-3 rounded-full"
                                                            style={{ backgroundColor: rocket.galaxyColor }}
                                                        />
                                                        <div>
                                                            <div className="font-medium">{rocket.mission.title}</div>
                                                            <div className="text-xs text-gray-500">
                                                                {rocket.galaxyName} → {rocket.planetName}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className={`rounded border px-2 py-1 text-xs font-medium ${getPriorityBadgeColor(rocket.mission.priority)}`}>
                                                        {rocket.mission.priority}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Monthly Rockets */}
                                {monthlyRockets.length > 0 && (
                                    <div>
                                        <h4 className="mb-2 text-sm font-medium text-gray-400">
                                            Monthly Missions ({monthlyRockets.length})
                                        </h4>
                                        <div className="space-y-2">
                                            {monthlyRockets.map((rocket, idx) => (
                                                <div
                                                    key={`monthly-${idx}`}
                                                    className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-900/30 p-3"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="h-3 w-3 rounded-full"
                                                            style={{ backgroundColor: rocket.galaxyColor }}
                                                        />
                                                        <div>
                                                            <div className="font-medium">{rocket.mission.title}</div>
                                                            <div className="text-xs text-gray-500">
                                                                {rocket.galaxyName} → {rocket.planetName}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className={`rounded border px-2 py-1 text-xs font-medium ${getPriorityBadgeColor(rocket.mission.priority)}`}>
                                                        {rocket.mission.priority}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
