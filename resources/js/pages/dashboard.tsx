import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

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
    status: 'pending' | 'in_progress' | 'completed' | 'blocked';
    priority: 'low' | 'medium' | 'high' | 'critical';
    deadline: string | null;
    completed_at: string | null;
};

export default function Dashboard({ galaxies }: { galaxies: Galaxy[] }) {
    const [showGalaxyForm, setShowGalaxyForm] = useState(false);
    const [showPlanetForm, setShowPlanetForm] = useState<number | null>(null);
    const [showMissionForm, setShowMissionForm] = useState<number | null>(null);
    const [editingMission, setEditingMission] = useState<Mission | null>(null);

    const galaxyForm = useForm({
        name: '',
        color: '#3b82f6',
        icon: '🌌',
    });

    const planetForm = useForm({
        galaxy_id: 0,
        name: '',
        description: '',
        size: 'medium' as const,
    });

    const missionForm = useForm({
        planet_id: 0,
        title: '',
        description: '',
        status: 'pending' as const,
        priority: 'medium' as const,
        deadline: '',
    });

    const handleCreateGalaxy = (e: React.FormEvent) => {
        e.preventDefault();
        galaxyForm.post('/galaxies', {
            onSuccess: () => {
                galaxyForm.reset();
                setShowGalaxyForm(false);
            },
        });
    };

    const handleCreatePlanet = (e: React.FormEvent) => {
        e.preventDefault();
        planetForm.post('/planets', {
            onSuccess: () => {
                planetForm.reset();
                setShowPlanetForm(null);
            },
        });
    };

    const handleDeleteGalaxy = (id: number) => {
        if (confirm('Are you sure you want to delete this galaxy?')) {
            router.delete(`/galaxies/${id}`);
        }
    };

    const handleDeletePlanet = (id: number) => {
        if (confirm('Are you sure you want to delete this planet?')) {
            router.delete(`/planets/${id}`);
        }
    };

    const handleCreateMission = (e: React.FormEvent) => {
        e.preventDefault();
        missionForm.post('/missions', {
            onSuccess: () => {
                missionForm.reset();
                setShowMissionForm(null);
            },
        });
    };

    const handleUpdateMission = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMission) return;

        missionForm.patch(`/missions/${editingMission.id}`, {
            onSuccess: () => {
                missionForm.reset();
                setEditingMission(null);
            },
        });
    };

    const handleDeleteMission = (id: number) => {
        if (confirm('Are you sure you want to delete this mission?')) {
            router.delete(`/missions/${id}`);
        }
    };

    const handleEditMission = (mission: Mission) => {
        setEditingMission(mission);
        missionForm.setData({
            planet_id: mission.planet_id,
            title: mission.title,
            description: mission.description || '',
            status: mission.status,
            priority: mission.priority,
            deadline: mission.deadline || '',
        });
    };

    const toggleMissionStatus = (mission: Mission) => {
        const newStatus = mission.status === 'completed' ? 'pending' : 'completed';
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
                    <Button onClick={() => setShowGalaxyForm(!showGalaxyForm)}>
                        {showGalaxyForm ? 'Cancel' : '+ Create Galaxy'}
                    </Button>
                </div>

                {showGalaxyForm && (
                    <div className="rounded-lg border bg-card p-4">
                        <h3 className="mb-4 text-lg font-semibold">
                            Create New Galaxy
                        </h3>
                        <form
                            onSubmit={handleCreateGalaxy}
                            className="space-y-4"
                        >
                            <div>
                                <label className="mb-1 block text-sm font-medium">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={galaxyForm.data.name}
                                    onChange={(e) =>
                                        galaxyForm.setData(
                                            'name',
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-md border px-3 py-2"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium">
                                        Color
                                    </label>
                                    <input
                                        type="color"
                                        value={galaxyForm.data.color}
                                        onChange={(e) =>
                                            galaxyForm.setData(
                                                'color',
                                                e.target.value,
                                            )
                                        }
                                        className="h-10 w-full rounded-md border"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium">
                                        Icon
                                    </label>
                                    <input
                                        type="text"
                                        value={galaxyForm.data.icon}
                                        onChange={(e) =>
                                            galaxyForm.setData(
                                                'icon',
                                                e.target.value,
                                            )
                                        }
                                        className="w-full rounded-md border px-3 py-2"
                                        placeholder="🌌"
                                    />
                                </div>
                            </div>
                            <Button
                                type="submit"
                                disabled={galaxyForm.processing}
                            >
                                Create Galaxy
                            </Button>
                        </form>
                    </div>
                )}

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
                                                setShowPlanetForm(
                                                    showPlanetForm === galaxy.id
                                                        ? null
                                                        : galaxy.id,
                                                )
                                            }
                                        >
                                            + Add Planet
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

                                {showPlanetForm === galaxy.id && (
                                    <div className="border-b bg-muted/30 p-4">
                                        <form
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                planetForm.setData(
                                                    'galaxy_id',
                                                    galaxy.id,
                                                );
                                                handleCreatePlanet(e);
                                            }}
                                            className="space-y-3"
                                        >
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">
                                                        Planet Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={
                                                            planetForm.data.name
                                                        }
                                                        onChange={(e) =>
                                                            planetForm.setData(
                                                                'name',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="w-full rounded-md border px-3 py-2"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">
                                                        Size
                                                    </label>
                                                    <select
                                                        value={
                                                            planetForm.data.size
                                                        }
                                                        onChange={(e) =>
                                                            planetForm.setData(
                                                                'size',
                                                                e.target
                                                                    .value as any,
                                                            )
                                                        }
                                                        className="w-full rounded-md border px-3 py-2"
                                                    >
                                                        <option value="small">
                                                            Small
                                                        </option>
                                                        <option value="medium">
                                                            Medium
                                                        </option>
                                                        <option value="large">
                                                            Large
                                                        </option>
                                                        <option value="massive">
                                                            Massive
                                                        </option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">
                                                    Description
                                                </label>
                                                <textarea
                                                    value={
                                                        planetForm.data
                                                            .description
                                                    }
                                                    onChange={(e) =>
                                                        planetForm.setData(
                                                            'description',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full rounded-md border px-3 py-2"
                                                    rows={2}
                                                />
                                            </div>
                                            <Button
                                                type="submit"
                                                size="sm"
                                                disabled={planetForm.processing}
                                            >
                                                Add Planet
                                            </Button>
                                        </form>
                                    </div>
                                )}

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
                                                                · {planet.missions.length} missions
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
                                                                    setShowMissionForm(
                                                                        showMissionForm === planet.id
                                                                            ? null
                                                                            : planet.id,
                                                                    )
                                                                }
                                                            >
                                                                + Mission
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

                                                    {showMissionForm === planet.id && (
                                                        <div className="border-t bg-muted/30 p-3">
                                                            <form
                                                                onSubmit={(e) => {
                                                                    missionForm.data.planet_id = planet.id;
                                                                    handleCreateMission(e);
                                                                }}
                                                                className="space-y-3"
                                                            >
                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium">
                                                                        Mission Title
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        value={missionForm.data.title}
                                                                        onChange={(e) =>
                                                                            missionForm.setData(
                                                                                'title',
                                                                                e.target.value,
                                                                            )
                                                                        }
                                                                        className="w-full rounded-md border px-3 py-2"
                                                                        required
                                                                    />
                                                                </div>
                                                                <div className="grid grid-cols-3 gap-2">
                                                                    <div>
                                                                        <label className="mb-1 block text-sm font-medium">
                                                                            Priority
                                                                        </label>
                                                                        <select
                                                                            value={missionForm.data.priority}
                                                                            onChange={(e) =>
                                                                                missionForm.setData(
                                                                                    'priority',
                                                                                    e.target.value as any,
                                                                                )
                                                                            }
                                                                            className="w-full rounded-md border px-3 py-2"
                                                                        >
                                                                            <option value="low">Low</option>
                                                                            <option value="medium">Medium</option>
                                                                            <option value="high">High</option>
                                                                            <option value="critical">Critical</option>
                                                                        </select>
                                                                    </div>
                                                                    <div>
                                                                        <label className="mb-1 block text-sm font-medium">
                                                                            Status
                                                                        </label>
                                                                        <select
                                                                            value={missionForm.data.status}
                                                                            onChange={(e) =>
                                                                                missionForm.setData(
                                                                                    'status',
                                                                                    e.target.value as any,
                                                                                )
                                                                            }
                                                                            className="w-full rounded-md border px-3 py-2"
                                                                        >
                                                                            <option value="pending">Pending</option>
                                                                            <option value="in_progress">In Progress</option>
                                                                            <option value="completed">Completed</option>
                                                                            <option value="blocked">Blocked</option>
                                                                        </select>
                                                                    </div>
                                                                    <div>
                                                                        <label className="mb-1 block text-sm font-medium">
                                                                            Deadline
                                                                        </label>
                                                                        <input
                                                                            type="date"
                                                                            value={missionForm.data.deadline}
                                                                            onChange={(e) =>
                                                                                missionForm.setData(
                                                                                    'deadline',
                                                                                    e.target.value,
                                                                                )
                                                                            }
                                                                            className="w-full rounded-md border px-3 py-2"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium">
                                                                        Description
                                                                    </label>
                                                                    <textarea
                                                                        value={missionForm.data.description}
                                                                        onChange={(e) =>
                                                                            missionForm.setData(
                                                                                'description',
                                                                                e.target.value,
                                                                            )
                                                                        }
                                                                        className="w-full rounded-md border px-3 py-2"
                                                                        rows={2}
                                                                    />
                                                                </div>
                                                                <Button
                                                                    type="submit"
                                                                    size="sm"
                                                                    disabled={missionForm.processing}
                                                                >
                                                                    Add Mission
                                                                </Button>
                                                            </form>
                                                        </div>
                                                    )}

                                                    {planet.missions.length > 0 && (
                                                        <div className="border-t p-3">
                                                            <div className="space-y-2">
                                                                {planet.missions.map((mission) => (
                                                                    <div
                                                                        key={mission.id}
                                                                        className={`rounded border p-2 ${
                                                                            editingMission?.id === mission.id
                                                                                ? 'bg-muted'
                                                                                : ''
                                                                        }`}
                                                                    >
                                                                        {editingMission?.id === mission.id ? (
                                                                            <form
                                                                                onSubmit={handleUpdateMission}
                                                                                className="space-y-2"
                                                                            >
                                                                                <input
                                                                                    type="text"
                                                                                    value={missionForm.data.title}
                                                                                    onChange={(e) =>
                                                                                        missionForm.setData(
                                                                                            'title',
                                                                                            e.target.value,
                                                                                        )
                                                                                    }
                                                                                    className="w-full rounded border px-2 py-1 text-sm"
                                                                                />
                                                                                <div className="grid grid-cols-3 gap-2">
                                                                                    <select
                                                                                        value={missionForm.data.priority}
                                                                                        onChange={(e) =>
                                                                                            missionForm.setData(
                                                                                                'priority',
                                                                                                e.target.value as any,
                                                                                            )
                                                                                        }
                                                                                        className="rounded border px-2 py-1 text-sm"
                                                                                    >
                                                                                        <option value="low">Low</option>
                                                                                        <option value="medium">Medium</option>
                                                                                        <option value="high">High</option>
                                                                                        <option value="critical">Critical</option>
                                                                                    </select>
                                                                                    <select
                                                                                        value={missionForm.data.status}
                                                                                        onChange={(e) =>
                                                                                            missionForm.setData(
                                                                                                'status',
                                                                                                e.target.value as any,
                                                                                            )
                                                                                        }
                                                                                        className="rounded border px-2 py-1 text-sm"
                                                                                    >
                                                                                        <option value="pending">Pending</option>
                                                                                        <option value="in_progress">In Progress</option>
                                                                                        <option value="completed">Completed</option>
                                                                                        <option value="blocked">Blocked</option>
                                                                                    </select>
                                                                                    <input
                                                                                        type="date"
                                                                                        value={missionForm.data.deadline}
                                                                                        onChange={(e) =>
                                                                                            missionForm.setData(
                                                                                                'deadline',
                                                                                                e.target.value,
                                                                                            )
                                                                                        }
                                                                                        className="rounded border px-2 py-1 text-sm"
                                                                                    />
                                                                                </div>
                                                                                <textarea
                                                                                    value={missionForm.data.description}
                                                                                    onChange={(e) =>
                                                                                        missionForm.setData(
                                                                                            'description',
                                                                                            e.target.value,
                                                                                        )
                                                                                    }
                                                                                    className="w-full rounded border px-2 py-1 text-sm"
                                                                                    rows={2}
                                                                                />
                                                                                <div className="flex gap-2">
                                                                                    <Button
                                                                                        type="submit"
                                                                                        size="sm"
                                                                                        disabled={missionForm.processing}
                                                                                    >
                                                                                        Save
                                                                                    </Button>
                                                                                    <Button
                                                                                        type="button"
                                                                                        size="sm"
                                                                                        variant="outline"
                                                                                        onClick={() => {
                                                                                            setEditingMission(null);
                                                                                            missionForm.reset();
                                                                                        }}
                                                                                    >
                                                                                        Cancel
                                                                                    </Button>
                                                                                </div>
                                                                            </form>
                                                                        ) : (
                                                                            <div className="flex items-start justify-between gap-2">
                                                                                <div className="flex-1">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={mission.status === 'completed'}
                                                                                            onChange={() =>
                                                                                                toggleMissionStatus(mission)
                                                                                            }
                                                                                            className="cursor-pointer"
                                                                                        />
                                                                                        <span
                                                                                            className={`text-sm font-medium ${
                                                                                                mission.status === 'completed'
                                                                                                    ? 'line-through text-muted-foreground'
                                                                                                    : ''
                                                                                            }`}
                                                                                        >
                                                                                            {mission.title}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                                                                        <span
                                                                                            className={`rounded px-1.5 py-0.5 ${
                                                                                                mission.priority === 'critical'
                                                                                                    ? 'bg-red-100 text-red-700'
                                                                                                    : mission.priority === 'high'
                                                                                                      ? 'bg-orange-100 text-orange-700'
                                                                                                      : mission.priority === 'medium'
                                                                                                        ? 'bg-yellow-100 text-yellow-700'
                                                                                                        : 'bg-gray-100 text-gray-700'
                                                                                            }`}
                                                                                        >
                                                                                            {mission.priority}
                                                                                        </span>
                                                                                        <span
                                                                                            className={`rounded px-1.5 py-0.5 ${
                                                                                                mission.status === 'completed'
                                                                                                    ? 'bg-green-100 text-green-700'
                                                                                                    : mission.status === 'in_progress'
                                                                                                      ? 'bg-blue-100 text-blue-700'
                                                                                                      : mission.status === 'blocked'
                                                                                                        ? 'bg-red-100 text-red-700'
                                                                                                        : 'bg-gray-100 text-gray-700'
                                                                                            }`}
                                                                                        >
                                                                                            {mission.status}
                                                                                        </span>
                                                                                        {mission.deadline && (
                                                                                            <span>
                                                                                                Due: {new Date(mission.deadline).toLocaleDateString()}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    {mission.description && (
                                                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                                                            {mission.description}
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex gap-1">
                                                                                    <Button
                                                                                        size="sm"
                                                                                        variant="ghost"
                                                                                        onClick={() => handleEditMission(mission)}
                                                                                    >
                                                                                        Edit
                                                                                    </Button>
                                                                                    <Button
                                                                                        size="sm"
                                                                                        variant="ghost"
                                                                                        onClick={() => handleDeleteMission(mission.id)}
                                                                                    >
                                                                                        ×
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
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
        </AppLayout>
    );
}
