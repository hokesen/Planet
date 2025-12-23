import { useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect } from 'react';
import { Button } from './ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import InputError from './input-error';
import type { Galaxy3D } from '@/types/space';

export interface GalaxyModalProps {
    galaxy: Galaxy3D | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function GalaxyModal({
    galaxy,
    open,
    onOpenChange,
}: GalaxyModalProps) {
    const isEdit = !!galaxy;

    const { data, setData, post, patch, delete: destroy, processing, errors, reset } = useForm({
        name: galaxy?.name || '',
        color: galaxy?.color || '#4ECDC4',
        icon: galaxy?.icon || '',
    });

    // Reset form when galaxy changes
    useEffect(() => {
        if (galaxy) {
            setData({
                name: galaxy.name,
                color: galaxy.color || '#4ECDC4',
                icon: galaxy.icon || '',
            });
        } else {
            reset();
        }
    }, [galaxy]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        if (isEdit) {
            patch(`/galaxies/${galaxy.id}`, {
                onSuccess: () => {
                    onOpenChange(false);
                    reset();
                },
            });
        } else {
            post('/galaxies', {
                onSuccess: () => {
                    onOpenChange(false);
                    reset();
                },
            });
        }
    };

    const handleDelete = () => {
        if (!galaxy) return;

        if (
            confirm(
                `Are you sure you want to delete "${galaxy.name}"? This will also delete all planets and missions in this galaxy.`
            )
        ) {
            destroy(`/galaxies/${galaxy.id}`, {
                onSuccess: () => {
                    onOpenChange(false);
                    reset();
                },
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[525px]">
                <form onSubmit={submit}>
                    <DialogHeader>
                        <DialogTitle>
                            {isEdit ? 'Edit Galaxy' : 'Create Galaxy'}
                        </DialogTitle>
                        <DialogDescription>
                            {isEdit
                                ? 'Update galaxy details'
                                : 'Create a new galaxy to organize your planets and missions'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                placeholder="Work, Personal, Health, etc."
                                required
                            />
                            <InputError message={errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="color">Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="color"
                                    type="color"
                                    value={data.color}
                                    onChange={(e) =>
                                        setData('color', e.target.value)
                                    }
                                    className="h-10 w-20"
                                />
                                <Input
                                    value={data.color}
                                    onChange={(e) =>
                                        setData('color', e.target.value)
                                    }
                                    placeholder="#4ECDC4"
                                    className="flex-1"
                                />
                            </div>
                            <InputError message={errors.color} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="icon">Icon (optional)</Label>
                            <Input
                                id="icon"
                                value={data.icon}
                                onChange={(e) =>
                                    setData('icon', e.target.value)
                                }
                                placeholder="🌌"
                                maxLength={10}
                            />
                            <InputError message={errors.icon} />
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        {isEdit && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={processing}
                            >
                                Delete
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {isEdit ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
