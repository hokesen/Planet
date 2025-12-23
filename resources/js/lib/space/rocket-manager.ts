import * as THREE from 'three';
import type { Mission3D, Planet3D, RocketInstance } from '@/types/space';
import { getPlanetRadius } from './planet-manager';

/**
 * Get rocket speed based on commitment type
 * Daily missions = fast orbit, Monthly missions = slow orbit
 */
export function getRocketSpeed(commitmentType: string): number {
    const speeds = {
        daily: 0.8, // Fast - completes orbit in ~3 seconds
        weekly: 0.4, // Medium - completes orbit in ~6 seconds
        monthly: 0.15, // Slow - completes orbit in ~12 seconds
        one_time: 0.3, // Default speed
    };

    return speeds[commitmentType as keyof typeof speeds] || 0.3;
}

/**
 * Get rocket color based on mission priority
 */
export function getPriorityColor(priority: string): number {
    const colors = {
        critical: 0xff4500, // Red-orange
        high: 0xff8c00, // Orange
        medium: 0xffd700, // Yellow
        low: 0x4a9eff, // Blue
    };

    return colors[priority as keyof typeof colors] || 0x4a9eff;
}

/**
 * Create a simple geometric rocket
 * For MVP: cones + cylinders, can be replaced with GLTF models later
 */
export function createRocket(mission: Mission3D): THREE.Group {
    const rocket = new THREE.Group();

    // Main body (cylinder)
    const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        metalness: 0.8,
        roughness: 0.2,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    rocket.add(body);

    // Nose cone
    const noseGeometry = new THREE.ConeGeometry(0.3, 1, 8);
    const noseMaterial = new THREE.MeshStandardMaterial({
        color: getPriorityColor(mission.priority),
        emissive: getPriorityColor(mission.priority),
        emissiveIntensity: 0.3,
        metalness: 0.6,
        roughness: 0.3,
    });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.y = 1.5;
    rocket.add(nose);

    // Fins (4 small triangles)
    const finGeometry = new THREE.ConeGeometry(0.2, 0.5, 3);
    const finMaterial = new THREE.MeshStandardMaterial({
        color: 0x666666,
        metalness: 0.7,
        roughness: 0.3,
    });

    for (let i = 0; i < 4; i++) {
        const fin = new THREE.Mesh(finGeometry, finMaterial);
        fin.rotation.z = Math.PI / 2;
        fin.position.y = -0.7;
        fin.rotation.y = (Math.PI / 2) * i;
        fin.position.x = Math.cos((Math.PI / 2) * i) * 0.4;
        fin.position.z = Math.sin((Math.PI / 2) * i) * 0.4;
        rocket.add(fin);
    }

    // Engine glow (sprite)
    const glowTexture = createGlowTexture();
    const glowMaterial = new THREE.SpriteMaterial({
        map: glowTexture,
        color: getPriorityColor(mission.priority),
        transparent: true,
        blending: THREE.AdditiveBlending,
    });
    const glow = new THREE.Sprite(glowMaterial);
    glow.scale.set(1, 1, 1);
    glow.position.y = -1.5;
    rocket.add(glow);

    // Store mission data for interaction
    rocket.userData = {
        type: 'rocket',
        mission: mission,
    };

    return rocket;
}

/**
 * Create a glow texture for engine effects
 */
function createGlowTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d')!;

    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 200, 100, 0.8)');
    gradient.addColorStop(0.4, 'rgba(255, 150, 50, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');

    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);

    return new THREE.CanvasTexture(canvas);
}

/**
 * Create a trail line for a rocket
 */
function createTrail(color: number): THREE.Line {
    const trailLength = 20;
    const positions = new Float32Array(trailLength * 3);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.6,
        linewidth: 2,
    });

    const trail = new THREE.Line(geometry, material);
    return trail;
}

/**
 * Rocket Manager class to handle all rocket operations
 */
export class RocketManager {
    private rockets: Map<number, RocketInstance> = new Map();

    constructor(private scene: THREE.Scene) {}

    /**
     * Initialize rockets for all active missions
     */
    initialize(
        missions: Mission3D[],
        getPlanetById: (id: number) => Planet3D | undefined
    ): void {
        missions.forEach((mission) => {
            // Only create rockets for non-completed, recurring missions
            // or daily/weekly/monthly missions
            const shouldCreateRocket =
                mission.status !== 'completed' &&
                (mission.commitment_type === 'daily' ||
                    mission.commitment_type === 'weekly' ||
                    mission.commitment_type === 'monthly');

            if (!shouldCreateRocket) return;

            const planet = getPlanetById(mission.planet_id);
            if (!planet) return;

            const mesh = createRocket(mission);
            const orbitRadius = planet.orbit_radius || 20;
            const speed = getRocketSpeed(mission.commitment_type || 'one_time');

            // Start at home base (0, 0, 0)
            mesh.position.set(0, 0, 0);

            // Point rocket towards planet
            const planetPos = new THREE.Vector3(
                planet.position_x || 0,
                planet.position_y || 0,
                planet.position_z || 0
            );
            mesh.lookAt(planetPos);

            this.scene.add(mesh);

            // Create trail
            const trail = createTrail(getPriorityColor(mission.priority));
            this.scene.add(trail);

            const instance: RocketInstance = {
                mesh,
                mission,
                planet,
                angle: 0, // Kept for compatibility
                orbitRadius,
                speed,
                trail,
                trailPositions: [],
                travelProgress: 0, // Start at home
                direction: 1, // Moving towards planet
            };

            this.rockets.set(mission.id, instance);
        });
    }

    /**
     * Update all rockets (linear travel between home and planet)
     */
    update(deltaTime: number): void {
        this.rockets.forEach((rocket) => {
            // Home base position (origin)
            const homePos = new THREE.Vector3(0, 0, 0);

            // Planet position
            const planetPos = new THREE.Vector3(
                rocket.planet.position_x || 0,
                rocket.planet.position_y || 0,
                rocket.planet.position_z || 0
            );

            // Update travel progress
            // Speed is normalized to complete travel in similar time as old orbit
            const normalizedSpeed = rocket.speed * 0.05;
            rocket.travelProgress += normalizedSpeed * deltaTime * rocket.direction;

            // Reverse direction at endpoints
            if (rocket.travelProgress >= 1) {
                rocket.travelProgress = 1;
                rocket.direction = -1;
            } else if (rocket.travelProgress <= 0) {
                rocket.travelProgress = 0;
                rocket.direction = 1;
            }

            // Linear interpolation between home and planet
            rocket.mesh.position.lerpVectors(homePos, planetPos, rocket.travelProgress);

            // Orient rocket towards direction of travel
            const lookAheadProgress = Math.min(1, Math.max(0, rocket.travelProgress + (0.02 * rocket.direction)));
            const targetPos = new THREE.Vector3();
            targetPos.lerpVectors(homePos, planetPos, lookAheadProgress);
            rocket.mesh.lookAt(targetPos);

            // Pulse the engine glow
            const glow = rocket.mesh.children.find(
                (child) => child instanceof THREE.Sprite
            ) as THREE.Sprite | undefined;

            if (glow && glow.material instanceof THREE.SpriteMaterial) {
                const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
                glow.material.opacity = pulse;
            }

            // Update trail
            if (rocket.trail && rocket.trailPositions) {
                const maxTrailLength = 20;

                // Add current position to trail
                rocket.trailPositions.unshift(
                    new THREE.Vector3(
                        rocket.mesh.position.x,
                        rocket.mesh.position.y,
                        rocket.mesh.position.z
                    )
                );

                // Keep trail length limited
                if (rocket.trailPositions.length > maxTrailLength) {
                    rocket.trailPositions.pop();
                }

                // Update trail geometry
                const positions = rocket.trail.geometry.getAttribute('position');
                for (let i = 0; i < maxTrailLength; i++) {
                    if (i < rocket.trailPositions.length) {
                        const pos = rocket.trailPositions[i];
                        positions.setXYZ(i, pos.x, pos.y, pos.z);
                    } else {
                        // Fill remaining with last position to avoid stretching
                        const lastPos =
                            rocket.trailPositions[
                                rocket.trailPositions.length - 1
                            ];
                        if (lastPos) {
                            positions.setXYZ(i, lastPos.x, lastPos.y, lastPos.z);
                        }
                    }
                }
                positions.needsUpdate = true;
            }
        });
    }

    /**
     * Get a rocket instance by mission ID
     */
    getRocket(missionId: number): RocketInstance | undefined {
        return this.rockets.get(missionId);
    }

    /**
     * Get all rocket instances
     */
    getAllRockets(): RocketInstance[] {
        return Array.from(this.rockets.values());
    }

    /**
     * Add a new rocket for a mission
     */
    addRocket(
        mission: Mission3D,
        planet: Planet3D
    ): void {
        const mesh = createRocket(mission);
        const orbitRadius = planet.orbit_radius || 20;
        const speed = getRocketSpeed(mission.commitment_type || 'one_time');

        // Start at home base (0, 0, 0)
        mesh.position.set(0, 0, 0);

        // Point rocket towards planet
        const planetPos = new THREE.Vector3(
            planet.position_x || 0,
            planet.position_y || 0,
            planet.position_z || 0
        );
        mesh.lookAt(planetPos);

        this.scene.add(mesh);

        // Create trail
        const trail = createTrail(getPriorityColor(mission.priority));
        this.scene.add(trail);

        const instance: RocketInstance = {
            mesh,
            mission,
            planet,
            angle: 0, // Kept for compatibility
            orbitRadius,
            speed,
            trail,
            trailPositions: [],
            travelProgress: 0, // Start at home
            direction: 1, // Moving towards planet
        };

        this.rockets.set(mission.id, instance);
    }

    /**
     * Remove a rocket
     */
    removeRocket(missionId: number): void {
        const rocket = this.rockets.get(missionId);
        if (!rocket) return;

        this.scene.remove(rocket.mesh);

        // Remove trail
        if (rocket.trail) {
            this.scene.remove(rocket.trail);
            rocket.trail.geometry.dispose();
            if (rocket.trail.material instanceof THREE.Material) {
                rocket.trail.material.dispose();
            }
        }

        // Dispose geometry and materials
        rocket.mesh.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                if (child.material instanceof THREE.Material) {
                    child.material.dispose();
                }
            }
        });

        this.rockets.delete(missionId);
    }

    /**
     * Clean up all resources
     */
    dispose(): void {
        this.rockets.forEach((rocket) => {
            this.scene.remove(rocket.mesh);

            // Dispose trail
            if (rocket.trail) {
                this.scene.remove(rocket.trail);
                rocket.trail.geometry.dispose();
                if (rocket.trail.material instanceof THREE.Material) {
                    rocket.trail.material.dispose();
                }
            }

            rocket.mesh.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.geometry.dispose();
                    if (child.material instanceof THREE.Material) {
                        child.material.dispose();
                    }
                }
            });
        });
        this.rockets.clear();
    }
}
