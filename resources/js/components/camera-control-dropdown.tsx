import type { CameraMode } from '@/lib/space/camera-controller';
import type { Galaxy3D, Mission3D } from '@/types/space';
import { Camera, Globe, Home, Rocket } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from './ui/select';

export interface CameraControlDropdownProps {
    cameraMode: CameraMode;
    onCameraModeChange: (mode: CameraMode) => void;
    galaxies: Galaxy3D[];
}

export function CameraControlDropdown({
    cameraMode,
    onCameraModeChange,
    galaxies,
}: CameraControlDropdownProps) {
    // Collect all missions from all galaxies
    const allMissions: Array<{
        mission: Mission3D;
        planet: { id: number; name: string };
        galaxy: { id: number; name: string; icon: string | null };
    }> = [];

    galaxies.forEach((galaxy) => {
        galaxy.planets.forEach((planet) => {
            if (planet.missions) {
                planet.missions.forEach((mission) => {
                    // Only include active missions with recurring types
                    if (
                        mission.status !== 'completed' &&
                        (mission.commitment_type === 'daily' ||
                            mission.commitment_type === 'weekly' ||
                            mission.commitment_type === 'monthly')
                    ) {
                        allMissions.push({
                            mission,
                            planet: { id: planet.id, name: planet.name },
                            galaxy: {
                                id: galaxy.id,
                                name: galaxy.name,
                                icon: galaxy.icon,
                            },
                        });
                    }
                });
            }
        });
    });

    // Convert CameraMode to string value for select
    const getCameraModeValue = (): string => {
        if (cameraMode.type === 'wormhole') return 'wormhole';
        if (cameraMode.type === 'galaxy') return `galaxy-${cameraMode.galaxyId}`;
        if (cameraMode.type === 'mission') return `mission-${cameraMode.missionId}`;
        return 'wormhole';
    };

    // Convert string value to CameraMode
    const handleValueChange = (value: string) => {
        if (value === 'wormhole') {
            onCameraModeChange({ type: 'wormhole' });
        } else if (value.startsWith('galaxy-')) {
            const galaxyId = parseInt(value.replace('galaxy-', ''));
            onCameraModeChange({ type: 'galaxy', galaxyId });
        } else if (value.startsWith('mission-')) {
            const missionId = parseInt(value.replace('mission-', ''));
            onCameraModeChange({ type: 'mission', missionId });
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <Select value={getCameraModeValue()} onValueChange={handleValueChange}>
                <SelectTrigger className="w-64 bg-black/70 text-white backdrop-blur-lg border-gray-600 hover:bg-black/80">
                    <div className="flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        <SelectValue placeholder="Select camera view" />
                    </div>
                </SelectTrigger>
                <SelectContent className="bg-black/90 text-white border-gray-600 backdrop-blur-lg">
                    {/* Wormhole View */}
                    <SelectGroup>
                        <SelectLabel className="text-gray-400">Default View</SelectLabel>
                        <SelectItem value="wormhole" className="hover:bg-gray-800 cursor-pointer">
                            <div className="flex items-center gap-2">
                                <Home className="h-4 w-4" />
                                <span>Wormhole View</span>
                            </div>
                        </SelectItem>
                    </SelectGroup>

                    {/* Galaxy Views */}
                    {galaxies.length > 0 && (
                        <SelectGroup>
                            <SelectLabel className="text-gray-400">Galaxy Views</SelectLabel>
                            {galaxies.map((galaxy) => (
                                <SelectItem
                                    key={galaxy.id}
                                    value={`galaxy-${galaxy.id}`}
                                    className="hover:bg-gray-800 cursor-pointer"
                                >
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-4 w-4" />
                                        <span>
                                            {galaxy.icon} {galaxy.name}
                                        </span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    )}

                    {/* Mission POV Views */}
                    {allMissions.length > 0 && (
                        <SelectGroup>
                            <SelectLabel className="text-gray-400">Mission POV</SelectLabel>
                            {allMissions.map(({ mission, planet, galaxy }) => (
                                <SelectItem
                                    key={mission.id}
                                    value={`mission-${mission.id}`}
                                    className="hover:bg-gray-800 cursor-pointer"
                                >
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <Rocket className="h-4 w-4" />
                                            <span className="font-semibold">{mission.title}</span>
                                        </div>
                                        <div className="text-xs text-gray-400 ml-6">
                                            {galaxy.icon} {galaxy.name} → {planet.name}
                                        </div>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    )}
                </SelectContent>
            </Select>
        </div>
    );
}
