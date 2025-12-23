import { useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { SpaceVisualization } from '@/components/space-visualization';
import MissionModal from '@/components/mission-modal';
import PlanetModal from '@/components/planet-modal';
import GalaxyModal from '@/components/galaxy-modal';
import WormholeModal from '@/components/wormhole-modal';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import type { Galaxy3D, Planet3D, Mission3D } from '@/types/space';
import { dashboard } from '@/routes';
import { Plus, Rocket, Globe, Sparkles } from 'lucide-react';

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
        null
    );
    const [selectedPlanet, setSelectedPlanet] = useState<Planet3D | null>(
        null
    );
    const [selectedGalaxy, setSelectedGalaxy] = useState<Galaxy3D | null>(
        null
    );
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

                {/* Info overlay - top left */}
                <div className="absolute left-4 top-4 rounded-lg bg-black/70 p-4 text-white backdrop-blur-lg">
                    <h2 className="mb-2 text-lg font-bold">
                        Mission Control
                    </h2>
                    <div className="space-y-1 text-sm">
                        <div>
                            Galaxies: {galaxies.length}
                        </div>
                        <div>
                            Planets:{' '}
                            {galaxies.reduce(
                                (sum, g) => sum + g.planets.length,
                                0
                            )}
                        </div>
                        <div className="font-semibold">
                            Active Rockets:{' '}
                            {galaxies.reduce((sum, g) => {
                                return (
                                    sum +
                                    g.planets.reduce((pSum, p) => {
                                        return (
                                            pSum +
                                            (p.missions?.filter(
                                                (m) =>
                                                    m.status !== 'completed' &&
                                                    (m.commitment_type ===
                                                        'daily' ||
                                                        m.commitment_type ===
                                                            'weekly' ||
                                                        m.commitment_type ===
                                                            'monthly')
                                            ).length || 0)
                                        );
                                    }, 0)
                                );
                            }, 0)}
                        </div>
                        <div className="mt-3 border-t border-gray-600 pt-2 text-xs">
                            <div className="flex items-center gap-1">
                                <span className="text-red-400">●</span>
                                Daily (fast orbit)
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-orange-400">●</span>
                                Weekly (medium)
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-yellow-400">●</span>
                                Monthly (slow)
                            </div>
                        </div>
                        <div className="mt-3 text-xs text-gray-400">
                            Phase 2: Orbiting Rockets
                        </div>
                    </div>
                </div>

                {/* Legend - bottom right */}
                <div className="absolute bottom-4 right-4 rounded-lg bg-black/70 p-4 text-white backdrop-blur-lg">
                    <h3 className="mb-2 text-sm font-bold">Legend</h3>
                    <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-cyan-400"></div>
                            <span>Home Base</span>
                        </div>
                        {galaxies.map((galaxy) => (
                            <div
                                key={galaxy.id}
                                className="flex items-center gap-2"
                            >
                                <div
                                    className="h-3 w-3 rounded-full"
                                    style={{ backgroundColor: galaxy.color }}
                                ></div>
                                <span>
                                    {galaxy.icon} {galaxy.name}
                                </span>
                            </div>
                        ))}
                    </div>
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
                                0
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
