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
import { store, update, destroy } from '@/actions/App/Http/Controllers/MissionController';
import type { Mission3D, Galaxy3D } from '@/types/space';
import { useForm } from '@inertiajs/react';
import { Rocket, Trash2 } from 'lucide-react';
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
        title: mission?.title || '',
        description: mission?.description || '',
        status: mission?.status || ('pending' as const),
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
                title: mission?.title || '',
                description: mission?.description || '',
                status: mission?.status || 'pending',
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

    // Get all planets from all galaxies
    const allPlanets = galaxies.flatMap((galaxy) =>
        galaxy.planets.map((planet) => ({
            ...planet,
            galaxyName: galaxy.name,
            galaxyColor: galaxy.color,
        }))
    );

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

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="planet_id">Planet</Label>
                        <Select
                            value={form.data.planet_id.toString()}
                            onValueChange={(value) =>
                                form.setData('planet_id', parseInt(value))
                            }
                        >
                            <SelectTrigger id="planet_id">
                                <SelectValue placeholder="Select a planet" />
                            </SelectTrigger>
                            <SelectContent>
                                {allPlanets.map((planet) => (
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
                                                <span>{planet.name}</span>
                                                <span className="text-xs text-muted-foreground">{planet.galaxyName}</span>
                                            </span>
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={form.errors.planet_id} />
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
                                            | 'critical'
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
                                    <SelectItem value="high">High</SelectItem>
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
                                            | 'pending'
                                            | 'in_progress'
                                            | 'completed'
                                            | 'blocked'
                                    )
                                }
                            >
                                <SelectTrigger id="status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">
                                        Pending
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
                                        parseInt(e.target.value) || 15
                                    )
                                }
                            />
                            <InputError
                                message={form.errors.time_commitment_minutes}
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
                                            | 'monthly'
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
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">
                                        Weekly
                                    </SelectItem>
                                    <SelectItem value="monthly">
                                        Monthly
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.commitment_type} />
                        </div>
                    </div>

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
