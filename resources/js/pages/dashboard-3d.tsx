import GalaxyModal from '@/components/galaxy-modal';
import MissionModal from '@/components/mission-modal';
import { router } from '@inertiajs/react';
import PlanetModal from '@/components/planet-modal';
import { SpaceVisualization } from '@/components/space-visualization';
import { Button } from '@/components/ui/button';
import WormholeModal from '@/components/wormhole-modal';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import type { Galaxy3D, Mission3D, Planet3D } from '@/types/space';
import { Head } from '@inertiajs/react';
import { Globe, Plus, Rocket, Sparkles } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Mission Control',
        href: dashboard().url,
    },
];

interface Dashboard3DProps {
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

export default function Dashboard3D({ galaxies, capacity }: Dashboard3DProps) {
    const [selectedMission, setSelectedMission] = useState<Mission3D | null>(
        null,
    );
    const [selectedPlanet, setSelectedPlanet] = useState<Planet3D | null>(null);
    const [selectedGalaxy, setSelectedGalaxy] = useState<Galaxy3D | null>(null);
    const [showMissionModal, setShowMissionModal] = useState(false);
    const [showPlanetModal, setShowPlanetModal] = useState(false);
    const [showGalaxyModal, setShowGalaxyModal] = useState(false);
    const [showWormholeModal, setShowWormholeModal] = useState(false);
    const [showFabMenu, setShowFabMenu] = useState(false);

    const handleRocketClick = (mission: Mission3D) => {
        setSelectedMission(mission);
        setShowMissionModal(true);
    };

    const handlePlanetClick = (planet: Planet3D) => {
        setSelectedPlanet(planet);
        setShowPlanetModal(true);
    };

    const handleGalaxyClick = (galaxy: Galaxy3D) => {
        setSelectedGalaxy(galaxy);
        setShowGalaxyModal(true);
    };

    const handleWormholeClick = () => {
        setShowWormholeModal(true);
    };

    const handleRefuel = (missionId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        router.post(`/missions/${missionId}/refuel`, {}, {
            preserveScroll: true,
        });
    };

    const formatFuelRemaining = (seconds: number | null): string => {
        if (seconds === null || seconds === 0) {
            return 'Empty';
        }

        const days = Math.floor(seconds / (24 * 60 * 60));
        const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((seconds % (60 * 60)) / 60);
        const secs = Math.floor(seconds % 60);

        const parts: string[] = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

        return parts.join(' ');
    };

    const handleCloseMissionModal = () => {
        setShowMissionModal(false);
        setSelectedMission(null);
    };

    const handleClosePlanetModal = () => {
        setShowPlanetModal(false);
        setSelectedPlanet(null);
    };

    const handleCreateMission = () => {
        setSelectedMission(null);
        setShowMissionModal(true);
        setShowFabMenu(false);
    };

    const handleCreatePlanet = () => {
        setSelectedPlanet(null);
        setShowPlanetModal(true);
        setShowFabMenu(false);
    };

    const handleCreateGalaxy = () => {
        setSelectedGalaxy(null);
        setShowGalaxyModal(true);
        setShowFabMenu(false);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mission Control" />

            <div className="relative h-full w-full overflow-hidden">
                {/* Full-screen 3D canvas */}
                <SpaceVisualization
                    galaxies={galaxies}
                    onRocketClick={handleRocketClick}
                    onPlanetClick={handlePlanetClick}
                    onGalaxyClick={handleGalaxyClick}
                    onWormholeClick={handleWormholeClick}
                />

                {/* Mission Control - Active Rockets Panel - top left */}
                <div className="absolute top-4 left-4 max-h-[80vh] w-80 overflow-y-auto rounded-lg bg-black/70 p-4 text-white backdrop-blur-lg">
                    <h2 className="mb-3 text-lg font-bold">Mission Control</h2>

                    {(() => {
                        // Collect all active rockets
                        const activeRockets: Array<{
                            mission: Mission3D;
                            planet: Planet3D;
                            galaxy: Galaxy3D;
                        }> = [];

                        galaxies.forEach((galaxy) => {
                            galaxy.planets.forEach((planet) => {
                                if (planet.missions) {
                                    planet.missions.forEach((mission) => {
                                        if (
                                            mission.status !== 'completed' &&
                                            (mission.commitment_type ===
                                                'daily' ||
                                                mission.commitment_type ===
                                                    'weekly' ||
                                                mission.commitment_type ===
                                                    'monthly')
                                        ) {
                                            activeRockets.push({
                                                mission,
                                                planet,
                                                galaxy,
                                            });
                                        }
                                    });
                                }
                            });
                        });

                        if (activeRockets.length === 0) {
                            return (
                                <div className="text-center text-sm text-gray-400">
                                    No active rockets in flight
                                </div>
                            );
                        }

                        return (
                            <div className="space-y-2">
                                {activeRockets.map(
                                    ({ mission, planet, galaxy }) => {
                                        // Get fuel status from backend
                                        const fuelStatus = mission.fuel_status;
                                        const fuelRemainingSeconds = fuelStatus?.fuel_remaining_seconds ?? null;
                                        const needsRefuel = fuelStatus?.needs_refuel ?? false;
                                        const priorityColors: Record<
                                            string,
                                            string
                                        > = {
                                            critical: 'text-red-400',
                                            high: 'text-orange-400',
                                            medium: 'text-yellow-400',
                                            low: 'text-blue-400',
                                        };

                                        // Get route planets if mission has a multi-planet route
                                        const routePlanets: Array<{
                                            planet: Planet3D;
                                            galaxy: Galaxy3D;
                                        }> = [];
                                        if (
                                            mission.planet_route &&
                                            mission.planet_route.length > 0
                                        ) {
                                            mission.planet_route.forEach(
                                                (planetId) => {
                                                    galaxies.forEach((g) => {
                                                        const p =
                                                            g.planets.find(
                                                                (pl) =>
                                                                    pl.id ===
                                                                    planetId,
                                                            );
                                                        if (p) {
                                                            routePlanets.push({
                                                                planet: p,
                                                                galaxy: g,
                                                            });
                                                        }
                                                    });
                                                },
                                            );
                                        }

                                        // Group planets by galaxy for display
                                        const galaxyGroups = new Map<
                                            number,
                                            {
                                                galaxy: Galaxy3D;
                                                planets: Planet3D[];
                                            }
                                        >();

                                        if (routePlanets.length > 0) {
                                            routePlanets.forEach(
                                                ({ planet: p, galaxy: g }) => {
                                                    if (
                                                        !galaxyGroups.has(g.id)
                                                    ) {
                                                        galaxyGroups.set(g.id, {
                                                            galaxy: g,
                                                            planets: [],
                                                        });
                                                    }
                                                    galaxyGroups
                                                        .get(g.id)!
                                                        .planets.push(p);
                                                },
                                            );
                                        } else {
                                            // Single planet route
                                            galaxyGroups.set(galaxy.id, {
                                                galaxy,
                                                planets: [planet],
                                            });
                                        }

                                        return (
                                            <div
                                                key={mission.id}
                                                className="cursor-pointer rounded border border-gray-600 bg-gray-900/50 p-2 text-xs transition-colors hover:bg-gray-800/50"
                                                onClick={() =>
                                                    handleRocketClick(mission)
                                                }
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1">
                                                        <div
                                                            className={`font-semibold ${priorityColors[mission.priority]}`}
                                                        >
                                                            {mission.title}
                                                        </div>
                                                        <div className="mt-1 space-y-0.5 text-gray-400">
                                                            {Array.from(
                                                                galaxyGroups.values(),
                                                            ).map(
                                                                (
                                                                    {
                                                                        galaxy: g,
                                                                        planets:
                                                                            pls,
                                                                    },
                                                                    idx,
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            g.id
                                                                        }
                                                                    >
                                                                        <div>
                                                                            {
                                                                                g.icon
                                                                            }{' '}
                                                                            {
                                                                                g.name
                                                                            }
                                                                        </div>
                                                                        <div className="ml-3">
                                                                            →{' '}
                                                                            {pls.map(
                                                                                (
                                                                                    p,
                                                                                    i,
                                                                                ) => (
                                                                                    <span
                                                                                        key={
                                                                                            p.id
                                                                                        }
                                                                                    >
                                                                                        {
                                                                                            p.name
                                                                                        }
                                                                                        {i <
                                                                                            pls.length -
                                                                                                1 &&
                                                                                            ' → '}
                                                                                    </span>
                                                                                ),
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                        <div className="mt-1 flex items-center gap-2 text-gray-500">
                                                            <span className="capitalize">
                                                                {
                                                                    mission.commitment_type
                                                                }
                                                            </span>
                                                            <span>•</span>
                                                            <span className={needsRefuel ? 'text-red-400 font-semibold' : ''}>
                                                                Fuel:{' '}
                                                                {formatFuelRemaining(fuelRemainingSeconds)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => handleRefuel(mission.id, e)}
                                                        className={`rounded px-2 py-1 text-[10px] font-semibold transition-colors ${
                                                            needsRefuel
                                                                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 animate-pulse'
                                                                : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
                                                        }`}
                                                    >
                                                        Refuel
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    },
                                )}
                            </div>
                        );
                    })()}
                </div>

                {/* FAB (Floating Action Button) - center bottom */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                    {showFabMenu && (
                        <div className="mb-4 flex gap-2">
                            <Button
                                onClick={handleCreateGalaxy}
                                className="shadow-lg"
                                size="lg"
                                variant="outline"
                            >
                                <Sparkles className="mr-2 h-5 w-5" />
                                New Galaxy
                            </Button>
                            <Button
                                onClick={handleCreatePlanet}
                                className="shadow-lg"
                                size="lg"
                                variant="secondary"
                            >
                                <Globe className="mr-2 h-5 w-5" />
                                New Planet
                            </Button>
                            <Button
                                onClick={handleCreateMission}
                                className="shadow-lg"
                                size="lg"
                            >
                                <Rocket className="mr-2 h-5 w-5" />
                                New Mission
                            </Button>
                        </div>
                    )}
                    <div className="flex justify-center">
                        <Button
                            onClick={() => setShowFabMenu(!showFabMenu)}
                            size="lg"
                            className="h-14 w-14 rounded-full shadow-lg"
                        >
                            <Plus
                                className={`h-6 w-6 transition-transform ${showFabMenu ? 'rotate-45' : ''}`}
                            />
                        </Button>
                    </div>
                </div>

                {/* Debug info - development only */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="absolute bottom-4 left-4 rounded bg-black/50 p-2 font-mono text-xs text-white">
                        <div>Camera: (150, 100, 150)</div>
                        <div>LookAt: (0, 0, 0)</div>
                        <div>
                            Planets:{' '}
                            {galaxies.reduce(
                                (sum, g) => sum + g.planets.length,
                                0,
                            )}
                        </div>
                    </div>
                )}

                {/* Modals */}
                <MissionModal
                    isOpen={showMissionModal}
                    onClose={handleCloseMissionModal}
                    mission={selectedMission}
                    galaxies={galaxies}
                />

                <PlanetModal
                    isOpen={showPlanetModal}
                    onClose={handleClosePlanetModal}
                    planet={selectedPlanet}
                    galaxies={galaxies}
                />

                <GalaxyModal
                    galaxy={selectedGalaxy}
                    open={showGalaxyModal}
                    onOpenChange={setShowGalaxyModal}
                />

                <WormholeModal
                    isOpen={showWormholeModal}
                    onClose={() => setShowWormholeModal(false)}
                    galaxies={galaxies}
                    capacity={capacity}
                />
            </div>
        </AppLayout>
    );
}
