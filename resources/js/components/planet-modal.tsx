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
import {
    store,
    update,
    destroy,
} from '@/actions/App/Http/Controllers/PlanetController';
import type { Planet3D, Galaxy3D } from '@/types/space';
import { useForm } from '@inertiajs/react';
import { Globe, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import InputError from './input-error';

interface PlanetModalProps {
    isOpen: boolean;
    onClose: () => void;
    planet?: Planet3D | null;
    galaxies: Galaxy3D[];
    defaultGalaxyId?: number;
}

export default function PlanetModal({
    isOpen,
    onClose,
    planet,
    galaxies,
    defaultGalaxyId,
}: PlanetModalProps) {
    const isEditing = !!planet;

    const form = useForm({
        galaxy_id: planet?.galaxy_id || defaultGalaxyId || 0,
        name: planet?.name || '',
        description: planet?.description || '',
        status: planet?.status || ('active' as const),
        health_status: planet?.health_status || ('stable' as const),
        size: planet?.size || ('medium' as const),
        color: planet?.color || '#3b82f6',
        target_completion_date: planet?.target_completion_date || '',
    });

    // Reset form when planet changes
    useEffect(() => {
        if (isOpen) {
            form.setData({
                galaxy_id: planet?.galaxy_id || defaultGalaxyId || 0,
                name: planet?.name || '',
                description: planet?.description || '',
                status: planet?.status || 'active',
                health_status: planet?.health_status || 'stable',
                size: planet?.size || 'medium',
                color: planet?.color || '#3b82f6',
                target_completion_date: planet?.target_completion_date || '',
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [planet, isOpen, defaultGalaxyId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEditing && planet) {
            form.patch(update.url(planet.id), {
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
        if (!planet) return;
        if (confirm('Are you sure you want to delete this planet? All missions on this planet will also be deleted.')) {
            form.delete(destroy.url(planet.id), {
                onSuccess: () => {
                    onClose();
                },
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader className="flex items-center justify-center">
                    <div className="mb-3 rounded-full border border-border bg-card p-0.5 shadow-sm">
                        <div className="relative overflow-hidden rounded-full border border-border bg-muted p-2.5">
                            <Globe className="size-6 text-foreground" />
                        </div>
                    </div>
                    <DialogTitle>
                        {isEditing ? 'Edit Planet' : 'Create New Planet'}
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        {isEditing
                            ? 'Update planet details and properties'
                            : 'Create a new planet in your universe'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="galaxy_id">Galaxy</Label>
                        <Select
                            value={form.data.galaxy_id.toString()}
                            onValueChange={(value) =>
                                form.setData('galaxy_id', parseInt(value))
                            }
                        >
                            <SelectTrigger id="galaxy_id">
                                <SelectValue placeholder="Select a galaxy" />
                            </SelectTrigger>
                            <SelectContent>
                                {galaxies.map((galaxy) => (
                                    <SelectItem
                                        key={galaxy.id}
                                        value={galaxy.id.toString()}
                                    >
                                        <span className="flex items-center gap-2">
                                            <span
                                                className="inline-block h-2 w-2 rounded-full"
                                                style={{
                                                    backgroundColor: galaxy.color,
                                                }}
                                            />
                                            {galaxy.icon} {galaxy.name}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={form.errors.galaxy_id} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={form.data.name}
                            onChange={(e) =>
                                form.setData('name', e.target.value)
                            }
                            placeholder="Planet name"
                            required
                        />
                        <InputError message={form.errors.name} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={form.data.description}
                            onChange={(e) =>
                                form.setData('description', e.target.value)
                            }
                            placeholder="Planet description"
                            rows={3}
                        />
                        <InputError message={form.errors.description} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="size">Size</Label>
                            <Select
                                value={form.data.size}
                                onValueChange={(value) =>
                                    form.setData(
                                        'size',
                                        value as
                                            | 'small'
                                            | 'medium'
                                            | 'large'
                                            | 'massive'
                                    )
                                }
                            >
                                <SelectTrigger id="size">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="small">Small</SelectItem>
                                    <SelectItem value="medium">
                                        Medium
                                    </SelectItem>
                                    <SelectItem value="large">Large</SelectItem>
                                    <SelectItem value="massive">
                                        Massive
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.size} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="color">Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="color"
                                    type="color"
                                    value={form.data.color}
                                    onChange={(e) =>
                                        form.setData('color', e.target.value)
                                    }
                                    className="h-9 w-16"
                                />
                                <Input
                                    type="text"
                                    value={form.data.color}
                                    onChange={(e) =>
                                        form.setData('color', e.target.value)
                                    }
                                    placeholder="#3b82f6"
                                    className="flex-1"
                                />
                            </div>
                            <InputError message={form.errors.color} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={form.data.status}
                                onValueChange={(value) =>
                                    form.setData(
                                        'status',
                                        value as
                                            | 'active'
                                            | 'completed'
                                            | 'archived'
                                    )
                                }
                            >
                                <SelectTrigger id="status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">
                                        Active
                                    </SelectItem>
                                    <SelectItem value="completed">
                                        Completed
                                    </SelectItem>
                                    <SelectItem value="archived">
                                        Archived
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.status} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="health_status">
                                Health Status
                            </Label>
                            <Select
                                value={form.data.health_status}
                                onValueChange={(value) =>
                                    form.setData(
                                        'health_status',
                                        value as
                                            | 'critical'
                                            | 'at_risk'
                                            | 'stable'
                                            | 'thriving'
                                    )
                                }
                            >
                                <SelectTrigger id="health_status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="critical">
                                        Critical
                                    </SelectItem>
                                    <SelectItem value="at_risk">
                                        At Risk
                                    </SelectItem>
                                    <SelectItem value="stable">
                                        Stable
                                    </SelectItem>
                                    <SelectItem value="thriving">
                                        Thriving
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.health_status} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="target_completion_date">
                            Target Completion Date
                        </Label>
                        <Input
                            id="target_completion_date"
                            type="date"
                            value={form.data.target_completion_date}
                            onChange={(e) =>
                                form.setData(
                                    'target_completion_date',
                                    e.target.value
                                )
                            }
                        />
                        <InputError
                            message={form.errors.target_completion_date}
                        />
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
                            {isEditing ? 'Update Planet' : 'Create Planet'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
