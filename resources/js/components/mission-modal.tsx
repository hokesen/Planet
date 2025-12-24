import {
    destroy,
    store,
    update,
} from '@/actions/App/Http/Controllers/MissionController';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Galaxy3D, Mission3D } from '@/types/space';
import { router, useForm } from '@inertiajs/react';
import { Fuel, MoveDown, MoveUp, Rocket, Trash2, X } from 'lucide-react';
import { useEffect } from 'react';
import InputError from './input-error';

interface MissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    mission?: Mission3D | null;
    galaxies: Galaxy3D[];
    defaultPlanetId?: number;
}

export default function MissionModal({
    isOpen,
    onClose,
    mission,
    galaxies,
    defaultPlanetId,
}: MissionModalProps) {
    const isEditing = !!mission;

    const form = useForm({
        planet_id: mission?.planet_id || defaultPlanetId || 0,
        planet_route:
            mission?.planet_route ||
            (defaultPlanetId && !mission ? [defaultPlanetId] : []),
        title: mission?.title || '',
        description: mission?.description || '',
        status: mission?.status || ('todo' as const),
        priority: mission?.priority || ('medium' as const),
        deadline: mission?.deadline || '',
        time_commitment_minutes: mission?.time_commitment_minutes || 15,
        commitment_type: mission?.commitment_type || ('one_time' as const),
        counts_toward_capacity: mission?.counts_toward_capacity ?? true,
    });

    // Reset form when mission changes
    useEffect(() => {
        if (isOpen) {
            form.setData({
                planet_id: mission?.planet_id || defaultPlanetId || 0,
                planet_route:
                    mission?.planet_route ||
                    (defaultPlanetId && !mission ? [defaultPlanetId] : []),
                title: mission?.title || '',
                description: mission?.description || '',
                status: mission?.status || 'todo',
                priority: mission?.priority || 'medium',
                deadline: mission?.deadline || '',
                time_commitment_minutes: mission?.time_commitment_minutes || 15,
                commitment_type: mission?.commitment_type || 'one_time',
                counts_toward_capacity: mission?.counts_toward_capacity ?? true,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mission, isOpen, defaultPlanetId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEditing && mission) {
            form.patch(update.url(mission.id), {
                onSuccess: () => {
                    form.reset();
                    onClose();
                },
            });
        } else {
            form.post(store.url(), {
                onSuccess: () => {
                    form.reset();
                    onClose();
                },
            });
        }
    };

    const handleDelete = () => {
        if (!mission) return;
        if (confirm('Are you sure you want to delete this mission?')) {
            form.delete(destroy.url(mission.id), {
                onSuccess: () => {
                    onClose();
                },
            });
        }
    };

    const handleDeleteRefuel = (refuelId: number) => {
        if (!mission) return;
        if (confirm('Are you sure you want to delete this refuel entry?')) {
            router.delete(`/missions/${mission.id}/refuels/${refuelId}`, {
                preserveScroll: true,
            });
        }
    };

    const formatRefuelDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };

    // Get all planets from all galaxies
    const allPlanets = galaxies.flatMap((galaxy) =>
        galaxy.planets.map((planet) => ({
            ...planet,
            galaxyName: galaxy.name,
            galaxyColor: galaxy.color,
        })),
    );

    // Planet route management
    const addPlanetToRoute = (planetId: number) => {
        if (!form.data.planet_route.includes(planetId)) {
            form.setData('planet_route', [...form.data.planet_route, planetId]);
        }
    };

    const removePlanetFromRoute = (index: number) => {
        const newRoute = [...form.data.planet_route];
        newRoute.splice(index, 1);
        form.setData('planet_route', newRoute);
    };

    const movePlanetUp = (index: number) => {
        if (index === 0) return;
        const newRoute = [...form.data.planet_route];
        [newRoute[index - 1], newRoute[index]] = [
            newRoute[index],
            newRoute[index - 1],
        ];
        form.setData('planet_route', newRoute);
    };

    const movePlanetDown = (index: number) => {
        if (index === form.data.planet_route.length - 1) return;
        const newRoute = [...form.data.planet_route];
        [newRoute[index], newRoute[index + 1]] = [
            newRoute[index + 1],
            newRoute[index],
        ];
        form.setData('planet_route', newRoute);
    };

    const getPlanetById = (planetId: number) => {
        return allPlanets.find((p) => p.id === planetId);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader className="flex items-center justify-center">
                    <div className="mb-3 rounded-full border border-border bg-card p-0.5 shadow-sm">
                        <div className="relative overflow-hidden rounded-full border border-border bg-muted p-2.5">
                            <Rocket className="size-6 text-foreground" />
                        </div>
                    </div>
                    <DialogTitle>
                        {isEditing ? 'Edit Mission' : 'Create New Mission'}
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        {isEditing
                            ? 'Update mission details and time commitment'
                            : 'Create a new mission and set its orbit parameters'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="max-h-[60vh] space-y-4 overflow-y-auto px-1">
                        <div className="space-y-2">
                            <Label>Planet Route</Label>
                            <div className="space-y-2">
                                {form.data.planet_route.length > 0 && (
                                    <div className="space-y-2 rounded-lg border border-border bg-muted/50 p-3">
                                        {form.data.planet_route.map(
                                            (planetId, index) => {
                                                const planet =
                                                    getPlanetById(planetId);
                                                if (!planet) return null;
                                                return (
                                                    <div
                                                        key={index}
                                                        className="flex items-center gap-2 rounded-md border border-border bg-background p-2"
                                                    >
                                                        <div className="flex items-center gap-2 font-mono text-sm text-muted-foreground">
                                                            {index + 1}.
                                                        </div>
                                                        <span
                                                            className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
                                                            style={{
                                                                backgroundColor:
                                                                    planet.color ||
                                                                    planet.galaxyColor,
                                                            }}
                                                        />
                                                        <div className="flex min-w-0 flex-1 flex-col">
                                                            <span className="truncate text-sm font-medium">
                                                                {planet.name}
                                                            </span>
                                                            <span className="truncate text-xs text-muted-foreground">
                                                                {
                                                                    planet.galaxyName
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    movePlanetUp(
                                                                        index,
                                                                    )
                                                                }
                                                                disabled={
                                                                    index === 0
                                                                }
                                                                className="h-7 w-7 p-0"
                                                            >
                                                                <MoveUp className="h-3 w-3" />
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    movePlanetDown(
                                                                        index,
                                                                    )
                                                                }
                                                                disabled={
                                                                    index ===
                                                                    form.data
                                                                        .planet_route
                                                                        .length -
                                                                        1
                                                                }
                                                                className="h-7 w-7 p-0"
                                                            >
                                                                <MoveDown className="h-3 w-3" />
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    removePlanetFromRoute(
                                                                        index,
                                                                    )
                                                                }
                                                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                );
                                            },
                                        )}
                                    </div>
                                )}
                                <Select
                                    onValueChange={(value) =>
                                        addPlanetToRoute(parseInt(value))
                                    }
                                    value=""
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Add planet to route..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allPlanets
                                            .filter(
                                                (p) =>
                                                    !form.data.planet_route.includes(
                                                        p.id,
                                                    ),
                                            )
                                            .map((planet) => (
                                                <SelectItem
                                                    key={planet.id}
                                                    value={planet.id.toString()}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <span
                                                            className="inline-block h-2 w-2 rounded-full"
                                                            style={{
                                                                backgroundColor:
                                                                    planet.color ||
                                                                    planet.galaxyColor,
                                                            }}
                                                        />
                                                        <span className="flex flex-col">
                                                            <span>
                                                                {planet.name}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {
                                                                    planet.galaxyName
                                                                }
                                                            </span>
                                                        </span>
                                                    </span>
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Add one or more planets to create the
                                    mission route. The rocket will travel: Home
                                    → Planet 1 → Planet 2 → ... → Home
                                </p>
                            </div>
                            <InputError message={form.errors.planet_route} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={form.data.title}
                                onChange={(e) =>
                                    form.setData('title', e.target.value)
                                }
                                placeholder="Mission title"
                                required
                            />
                            <InputError message={form.errors.title} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={form.data.description}
                                onChange={(e) =>
                                    form.setData('description', e.target.value)
                                }
                                placeholder="Mission description"
                                rows={3}
                            />
                            <InputError message={form.errors.description} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="priority">Priority</Label>
                                <Select
                                    value={form.data.priority}
                                    onValueChange={(value) =>
                                        form.setData(
                                            'priority',
                                            value as
                                                | 'low'
                                                | 'medium'
                                                | 'high'
                                                | 'critical',
                                        )
                                    }
                                >
                                    <SelectTrigger id="priority">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">
                                            Medium
                                        </SelectItem>
                                        <SelectItem value="high">
                                            High
                                        </SelectItem>
                                        <SelectItem value="critical">
                                            Critical
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.priority} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={form.data.status}
                                    onValueChange={(value) =>
                                        form.setData(
                                            'status',
                                            value as
                                                | 'todo'
                                                | 'in_progress'
                                                | 'completed'
                                                | 'blocked'
                                                | 'cancelled',
                                        )
                                    }
                                >
                                    <SelectTrigger id="status">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todo">
                                            To Do
                                        </SelectItem>
                                        <SelectItem value="in_progress">
                                            In Progress
                                        </SelectItem>
                                        <SelectItem value="completed">
                                            Completed
                                        </SelectItem>
                                        <SelectItem value="blocked">
                                            Blocked
                                        </SelectItem>
                                        <SelectItem value="cancelled">
                                            Cancelled
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={form.errors.status} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="time_commitment_minutes">
                                    Time (minutes)
                                </Label>
                                <Input
                                    id="time_commitment_minutes"
                                    type="number"
                                    min="1"
                                    value={form.data.time_commitment_minutes}
                                    onChange={(e) =>
                                        form.setData(
                                            'time_commitment_minutes',
                                            parseInt(e.target.value) || 15,
                                        )
                                    }
                                />
                                <InputError
                                    message={
                                        form.errors.time_commitment_minutes
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="commitment_type">
                                    Commitment Type
                                </Label>
                                <Select
                                    value={form.data.commitment_type}
                                    onValueChange={(value) =>
                                        form.setData(
                                            'commitment_type',
                                            value as
                                                | 'one_time'
                                                | 'daily'
                                                | 'weekly'
                                                | 'monthly',
                                        )
                                    }
                                >
                                    <SelectTrigger id="commitment_type">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="one_time">
                                            One-time
                                        </SelectItem>
                                        <SelectItem value="daily">
                                            Daily
                                        </SelectItem>
                                        <SelectItem value="weekly">
                                            Weekly
                                        </SelectItem>
                                        <SelectItem value="monthly">
                                            Monthly
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={form.errors.commitment_type}
                                />
                            </div>
                        </div>

                        {isEditing &&
                            mission &&
                            mission.commitment_type !== 'one_time' && (
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Fuel className="h-4 w-4" />
                                        Refuel History
                                    </Label>
                                    <div className="rounded-lg border border-border bg-muted/50 p-3">
                                        {mission.refuels &&
                                        mission.refuels.length > 0 ? (
                                            <div className="space-y-2">
                                                {mission.refuels.map(
                                                    (refuel) => (
                                                        <div
                                                            key={refuel.id}
                                                            className="flex items-center justify-between rounded-md border border-border bg-background p-2"
                                                        >
                                                            <span className="text-sm">
                                                                {formatRefuelDate(
                                                                    refuel.refueled_at,
                                                                )}
                                                            </span>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleDeleteRefuel(
                                                                        refuel.id,
                                                                    )
                                                                }
                                                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">
                                                No refuel history yet. Click
                                                "Refuel" after completing the
                                                task.
                                            </p>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Track when you've completed this{' '}
                                        {mission.commitment_type} task in real
                                        life.
                                    </p>
                                </div>
                            )}

                        <div className="space-y-2">
                            <Label htmlFor="deadline">Deadline</Label>
                            <Input
                                id="deadline"
                                type="date"
                                value={form.data.deadline}
                                onChange={(e) =>
                                    form.setData('deadline', e.target.value)
                                }
                            />
                            <InputError message={form.errors.deadline} />
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        {isEditing && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={form.processing}
                                className="mr-auto"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={form.processing}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {isEditing ? 'Update Mission' : 'Create Mission'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
