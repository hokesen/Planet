import GalaxyModal from '@/components/galaxy-modal';
import MissionModal from '@/components/mission-modal';
import PlanetModal from '@/components/planet-modal';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

type Galaxy = {
    id: number;
    name: string;
    color: string;
    icon: string | null;
    planets: Planet[];
};

type Planet = {
    id: number;
    galaxy_id: number;
    name: string;
    description: string | null;
    status: string;
    health_status: string;
    size: string;
    color: string | null;
    missions: Mission[];
};

type Mission = {
    id: number;
    planet_id: number;
    title: string;
    description: string | null;
    status: 'todo' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'critical';
    deadline: string | null;
    completed_at: string | null;
};

export default function Dashboard({ galaxies }: { galaxies: Galaxy[] }) {
    const [selectedGalaxy, setSelectedGalaxy] = useState<Galaxy | null>(null);
    const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);
    const [selectedMission, setSelectedMission] = useState<Mission | null>(
        null,
    );
    const [showGalaxyModal, setShowGalaxyModal] = useState(false);
    const [showPlanetModal, setShowPlanetModal] = useState(false);
    const [showMissionModal, setShowMissionModal] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Fullscreen functionality
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener(
                'fullscreenchange',
                handleFullscreenChange,
            );
        };
    }, []);

    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (error) {
            console.error('Error toggling fullscreen:', error);
        }
    };

    // Modal handlers
    const handleCreateGalaxy = () => {
        setSelectedGalaxy(null);
        setShowGalaxyModal(true);
    };

    const handleEditGalaxy = (galaxy: Galaxy) => {
        setSelectedGalaxy(galaxy);
        setShowGalaxyModal(true);
    };

    const handleDeleteGalaxy = (id: number) => {
        if (confirm('Are you sure you want to delete this galaxy?')) {
            router.delete(`/galaxies/${id}`);
        }
    };

    const handleAddPlanet = (galaxyId: number) => {
        setSelectedPlanet({ galaxy_id: galaxyId } as Planet);
        setShowPlanetModal(true);
    };

    const handleEditPlanet = (planet: Planet) => {
        setSelectedPlanet(planet);
        setShowPlanetModal(true);
    };

    const handleDeletePlanet = (id: number) => {
        if (confirm('Are you sure you want to delete this planet?')) {
            router.delete(`/planets/${id}`);
        }
    };

    const handleAddMission = (planetId: number) => {
        setSelectedMission({ planet_id: planetId } as Mission);
        setShowMissionModal(true);
    };

    const handleEditMission = (mission: Mission) => {
        setSelectedMission(mission);
        setShowMissionModal(true);
    };

    const handleDeleteMission = (id: number) => {
        if (confirm('Are you sure you want to delete this mission?')) {
            router.delete(`/missions/${id}`);
        }
    };

    const toggleMissionStatus = (mission: Mission) => {
        const newStatus =
            mission.status === 'completed' ? 'pending' : 'completed';
        router.patch(`/missions/${mission.id}`, { status: newStatus });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Your Universe</h1>
                        <p className="text-muted-foreground">
                            Manage your galaxies and planets
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={toggleFullscreen}
                            title={
                                isFullscreen
                                    ? 'Exit fullscreen'
                                    : 'Enter fullscreen'
                            }
                        >
                            {isFullscreen ? (
                                <Minimize2 className="h-4 w-4" />
                            ) : (
                                <Maximize2 className="h-4 w-4" />
                            )}
                        </Button>
                        <Button onClick={handleCreateGalaxy}>
                            + Create Galaxy
                        </Button>
                    </div>
                </div>

                <div className="space-y-6">
                    {galaxies.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-12 text-center">
                            <p className="text-muted-foreground">
                                No galaxies yet. Create your first galaxy to get
                                started!
                            </p>
                        </div>
                    ) : (
                        galaxies.map((galaxy) => (
                            <div
                                key={galaxy.id}
                                className="rounded-lg border bg-card"
                            >
                                <div
                                    className="flex items-center justify-between border-b p-4"
                                    style={{ borderLeftColor: galaxy.color }}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">
                                            {galaxy.icon}
                                        </span>
                                        <h2 className="text-xl font-semibold">
                                            {galaxy.name}
                                        </h2>
                                        <span className="text-sm text-muted-foreground">
                                            ({galaxy.planets.length} planets)
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                handleAddPlanet(galaxy.id)
                                            }
                                        >
                                            + Add Planet
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                handleEditGalaxy(galaxy)
                                            }
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() =>
                                                handleDeleteGalaxy(galaxy.id)
                                            }
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>

                                <div className="p-4">
                                    {galaxy.planets.length === 0 ? (
                                        <p className="text-center text-sm text-muted-foreground">
                                            No planets yet. Add your first
                                            planet!
                                        </p>
                                    ) : (
                                        <div className="space-y-4">
                                            {galaxy.planets.map((planet) => (
                                                <div
                                                    key={planet.id}
                                                    className="rounded-lg border"
                                                    style={{
                                                        borderLeftWidth: '4px',
                                                        borderLeftColor:
                                                            planet.color ||
                                                            galaxy.color,
                                                    }}
                                                >
                                                    <div className="flex items-start justify-between p-3">
                                                        <div className="flex-1">
                                                            <h3 className="font-semibold">
                                                                {planet.name}
                                                            </h3>
                                                            <p className="text-xs text-muted-foreground">
                                                                {planet.size} ·{' '}
                                                                {
                                                                    planet.health_status
                                                                }{' '}
                                                                ·{' '}
                                                                {
                                                                    planet
                                                                        .missions
                                                                        .length
                                                                }{' '}
                                                                missions
                                                            </p>
                                                            {planet.description && (
                                                                <p className="mt-1 text-sm">
                                                                    {
                                                                        planet.description
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    handleAddMission(
                                                                        planet.id,
                                                                    )
                                                                }
                                                            >
                                                                + Mission
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() =>
                                                                    handleEditPlanet(
                                                                        planet,
                                                                    )
                                                                }
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() =>
                                                                    handleDeletePlanet(
                                                                        planet.id,
                                                                    )
                                                                }
                                                            >
                                                                ×
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {planet.missions.length >
                                                        0 && (
                                                        <div className="border-t p-3">
                                                            <div className="space-y-2">
                                                                {planet.missions.map(
                                                                    (
                                                                        mission,
                                                                    ) => (
                                                                        <div
                                                                            key={
                                                                                mission.id
                                                                            }
                                                                            className="rounded border p-2"
                                                                        >
                                                                            <div className="flex items-start justify-between gap-2">
                                                                                <div className="flex-1">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={
                                                                                                mission.status ===
                                                                                                'completed'
                                                                                            }
                                                                                            onChange={() =>
                                                                                                toggleMissionStatus(
                                                                                                    mission,
                                                                                                )
                                                                                            }
                                                                                            className="cursor-pointer"
                                                                                        />
                                                                                        <span
                                                                                            className={`text-sm font-medium ${
                                                                                                mission.status ===
                                                                                                'completed'
                                                                                                    ? 'text-muted-foreground line-through'
                                                                                                    : ''
                                                                                            }`}
                                                                                        >
                                                                                            {
                                                                                                mission.title
                                                                                            }
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                                                                        <span
                                                                                            className={`rounded px-1.5 py-0.5 ${
                                                                                                mission.priority ===
                                                                                                'critical'
                                                                                                    ? 'bg-red-100 text-red-700'
                                                                                                    : mission.priority ===
                                                                                                        'high'
                                                                                                      ? 'bg-orange-100 text-orange-700'
                                                                                                      : mission.priority ===
                                                                                                          'medium'
                                                                                                        ? 'bg-yellow-100 text-yellow-700'
                                                                                                        : 'bg-gray-100 text-gray-700'
                                                                                            }`}
                                                                                        >
                                                                                            {
                                                                                                mission.priority
                                                                                            }
                                                                                        </span>
                                                                                        <span
                                                                                            className={`rounded px-1.5 py-0.5 ${
                                                                                                mission.status ===
                                                                                                'completed'
                                                                                                    ? 'bg-green-100 text-green-700'
                                                                                                    : mission.status ===
                                                                                                        'in_progress'
                                                                                                      ? 'bg-blue-100 text-blue-700'
                                                                                                      : mission.status ===
                                                                                                          'blocked'
                                                                                                        ? 'bg-red-100 text-red-700'
                                                                                                        : 'bg-gray-100 text-gray-700'
                                                                                            }`}
                                                                                        >
                                                                                            {
                                                                                                mission.status
                                                                                            }
                                                                                        </span>
                                                                                        {mission.deadline && (
                                                                                            <span>
                                                                                                Due:{' '}
                                                                                                {new Date(
                                                                                                    mission.deadline,
                                                                                                ).toLocaleDateString()}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    {mission.description && (
                                                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                                                            {
                                                                                                mission.description
                                                                                            }
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex gap-1">
                                                                                    <Button
                                                                                        size="sm"
                                                                                        variant="ghost"
                                                                                        onClick={() =>
                                                                                            handleEditMission(
                                                                                                mission,
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        Edit
                                                                                    </Button>
                                                                                    <Button
                                                                                        size="sm"
                                                                                        variant="ghost"
                                                                                        onClick={() =>
                                                                                            handleDeleteMission(
                                                                                                mission.id,
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        ×
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ),
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modals */}
            <GalaxyModal
                galaxy={selectedGalaxy as any}
                open={showGalaxyModal}
                onOpenChange={setShowGalaxyModal}
            />

            <PlanetModal
                isOpen={showPlanetModal}
                onClose={() => setShowPlanetModal(false)}
                planet={selectedPlanet as any}
                galaxies={galaxies as any}
            />

            <MissionModal
                isOpen={showMissionModal}
                onClose={() => setShowMissionModal(false)}
                mission={selectedMission as any}
                galaxies={galaxies as any}
            />
        </AppLayout>
    );
}
