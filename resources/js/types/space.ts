import * as THREE from 'three';

// Extended types for 3D positioning
export interface Planet3D {
    id: number;
    galaxy_id: number;
    name: string;
    description: string | null;
    status: string;
    health_status: string;
    size: 'small' | 'medium' | 'large' | 'massive';
    color: string | null;
    position_x: number | null;
    position_y: number | null;
    position_z: number | null;
    orbit_radius: number | null;
    use_auto_positioning: boolean;
    target_completion_date?: string | null;
    missions?: Mission3D[];
}

export interface Galaxy3D {
    id: number;
    name: string;
    color: string;
    icon: string | null;
    planets: Planet3D[];
}

export interface MissionRefuel {
    id: number;
    mission_id: number;
    refueled_at: string;
    created_at: string;
    updated_at: string;
}

export interface FuelStatus {
    needs_refuel: boolean;
    fuel_remaining_seconds: number | null;
    last_refuel_date: string | null;
    next_refuel_due: string | null;
}

export interface Mission3D {
    id: number;
    planet_id: number;
    planet_route?: number[];
    title: string;
    description: string | null;
    status: 'todo' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'critical';
    deadline: string | null;
    completed_at: string | null;
    time_commitment_minutes?: number;
    commitment_type?: 'one_time' | 'daily' | 'weekly' | 'monthly';
    counts_toward_capacity?: boolean;
    fuel_status?: FuelStatus;
    refuels?: MissionRefuel[];
}

export interface SpaceScene {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    dispose: () => void;
    start: () => void;
    stop: () => void;
}

export interface MoonInstance {
    mesh: THREE.Mesh;
    orbitAngle: number;
    orbitDistance: number;
    orbitSpeed: number;
}

export interface PlanetInstance {
    mesh: THREE.Mesh;
    planet: Planet3D;
    label?: THREE.Sprite;
    orbitAngle: number; // Current angle in orbit (radians)
    orbitDistance: number; // Distance from galaxy center
    orbitSpeed: number; // Orbital speed (radians per second)
    orbitLine?: THREE.Line; // Dotted line showing orbit path
    moons?: MoonInstance[]; // Moons orbiting this planet
}

export interface RocketInstance {
    mesh: THREE.Object3D;
    mission: Mission3D;
    planet: Planet3D;
    route?: Planet3D[]; // Multi-planet route
    currentSegment?: number; // Current segment index in the route
    angle: number; // Kept for compatibility
    orbitRadius: number; // Kept for compatibility
    speed: number;
    trail?: THREE.Points;
    trailPositions?: THREE.Vector3[];
    pathLine?: THREE.Line; // Dotted line showing full travel path
    travelProgress: number; // 0-1 progress from home to planet
    direction: 1 | -1; // 1 = towards planet, -1 = towards home
}

export interface Vector3D {
    x: number;
    y: number;
    z: number;
}

export interface CapacityData {
    daily: number;
    weekly: number;
    monthly: number;
    daily_rockets: number;
    weekly_rockets: number;
    monthly_rockets: number;
}

export interface UserCapacitySettings {
    id: number;
    user_id: number;
    daily_capacity_minutes: number;
    weekly_capacity_minutes: number;
    monthly_capacity_minutes: number;
    show_capacity_warnings: boolean;
    capacity_display_mode: 'strict' | 'flexible';
}
