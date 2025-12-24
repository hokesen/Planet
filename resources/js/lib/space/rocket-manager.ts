import type {
    Mission3D,
    OrbitalPathSegment,
    Planet3D,
    RocketInstance,
} from '@/types/space';
import * as THREE from 'three';
import { calculateGravityAssist } from './orbital-mechanics';
import { generateOrbitalPath, shouldRecalculatePath } from './path-generator';

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
    const rocketMesh = new THREE.Group(); // Inner group for the actual rocket geometry

    // Main body (cylinder)
    const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        metalness: 0.8,
        roughness: 0.2,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    rocketMesh.add(body);

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
    rocketMesh.add(nose);

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
        rocketMesh.add(fin);
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
    rocketMesh.add(glow);

    // Rotate the rocket mesh so it points forward (Z-axis) instead of up (Y-axis)
    // This makes lookAt work correctly
    rocketMesh.rotation.x = Math.PI / 2;

    rocket.add(rocketMesh);

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
 * Create an ionic trail with particles for a rocket
 */
function createTrail(color: number): THREE.Points {
    const trailLength = 60; // More particles for smoother, more dynamic trail
    const positions = new Float32Array(trailLength * 3);
    const sizes = new Float32Array(trailLength);
    const colors = new Float32Array(trailLength * 3);

    // Initialize sizes and colors (fade out towards the end)
    const baseColor = new THREE.Color(color);
    for (let i = 0; i < trailLength; i++) {
        const fade = 1 - i / trailLength;
        sizes[i] = fade * 3; // Larger particles at front

        // Brighter colors at front, fade to darker at back
        colors[i * 3] = baseColor.r * (0.5 + fade * 0.5);
        colors[i * 3 + 1] = baseColor.g * (0.5 + fade * 0.5);
        colors[i * 3 + 2] = baseColor.b * (0.5 + fade * 0.5);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Create a more vibrant glowing particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    // Multi-layer glow for more vibrant effect
    const gradient1 = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient1.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient1.addColorStop(0.2, 'rgba(255, 255, 255, 0.9)');
    gradient1.addColorStop(0.5, 'rgba(200, 220, 255, 0.6)');
    gradient1.addColorStop(1, 'rgba(100, 150, 255, 0)');
    ctx.fillStyle = gradient1;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
        size: 3,
        map: texture,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
        vertexColors: true, // Use per-particle colors
    });

    const trail = new THREE.Points(geometry, material);
    return trail;
}

/**
 * Create a dotted path line showing rocket's full travel path
 */
function createRocketPathLine(
    points: THREE.Vector3[],
    color: number,
): THREE.Line {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineDashedMaterial({
        color: color,
        dashSize: 3,
        gapSize: 2,
        transparent: true,
        opacity: 0.4,
    });

    const line = new THREE.Line(geometry, material);
    line.computeLineDistances(); // Required for dashed lines

    return line;
}

/**
 * Rocket Manager class to handle all rocket operations
 */
export class RocketManager {
    private rockets: Map<number, RocketInstance> = new Map();
    private galaxyCenters: Map<number, THREE.Vector3> = new Map();
    private blackHoleMasses: Map<number, number> = new Map();

    constructor(
        private scene: THREE.Scene,
        galaxyCenters?: Map<number, THREE.Vector3>,
        blackHoleMasses?: Map<number, number>,
    ) {
        this.galaxyCenters = galaxyCenters || new Map();
        this.blackHoleMasses = blackHoleMasses || new Map();
    }

    /**
     * Initialize rockets for all active missions
     */
    initialize(
        missions: Mission3D[],
        getPlanetById: (id: number) => Planet3D | undefined,
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

            // Build route - if planet_route exists, use it; otherwise use single planet
            const route: Planet3D[] = [];
            if (mission.planet_route && mission.planet_route.length > 0) {
                // Multi-planet route
                for (const planetId of mission.planet_route) {
                    const routePlanet = getPlanetById(planetId);
                    if (routePlanet) {
                        route.push(routePlanet);
                    }
                }
            } else {
                // Single planet (backward compatibility)
                route.push(planet);
            }

            if (route.length === 0) return;

            const mesh = createRocket(mission);
            const orbitRadius = planet.orbit_radius || 20;
            const speed = getRocketSpeed(mission.commitment_type || 'one_time');

            // Start at home base (0, 0, 0)
            mesh.position.set(0, 0, 0);

            // Point rocket towards first planet in route
            const firstPlanetPos = new THREE.Vector3(
                route[0].position_x || 0,
                route[0].position_y || 0,
                route[0].position_z || 0,
            );
            mesh.lookAt(firstPlanetPos);

            this.scene.add(mesh);

            // Create trail
            const trail = createTrail(getPriorityColor(mission.priority));
            this.scene.add(trail);

            // Create dotted path line showing full route
            const homePos = new THREE.Vector3(0, 0, 0);
            const pathPoints: THREE.Vector3[] = [homePos];
            for (const routePlanet of route) {
                pathPoints.push(
                    new THREE.Vector3(
                        routePlanet.position_x || 0,
                        routePlanet.position_y || 0,
                        routePlanet.position_z || 0,
                    ),
                );
            }
            pathPoints.push(homePos); // Return to home

            const pathLine = createRocketPathLine(
                pathPoints,
                getPriorityColor(mission.priority),
            );
            this.scene.add(pathLine);

            const instance: RocketInstance = {
                mesh,
                mission,
                planet,
                route: route.length > 1 ? route : undefined, // Only set if multi-planet
                currentSegment: 0,
                angle: 0, // Kept for compatibility
                orbitRadius,
                speed,
                trail,
                trailPositions: [],
                pathLine,
                travelProgress: 0, // Start at home
                direction: 1, // Moving towards planet
            };

            this.rockets.set(mission.id, instance);
        });
    }

    /**
     * Update all rockets (linear travel between waypoints)
     */
    update(deltaTime: number): void {
        this.rockets.forEach((rocket) => {
            // Check if path needs recalculation
            if (this.pathNeedsRecalculation(rocket)) {
                this.calculateRocketPath(rocket);

                // Update path line visualization with new orbital waypoints
                if (rocket.orbitalPath && rocket.pathLine) {
                    const orbitalPoints: THREE.Vector3[] = [];
                    rocket.orbitalPath.forEach((segment) => {
                        orbitalPoints.push(...segment.waypoints);
                    });

                    // Dispose old path line
                    this.scene.remove(rocket.pathLine);
                    rocket.pathLine.geometry.dispose();
                    if (rocket.pathLine.material instanceof THREE.Material) {
                        rocket.pathLine.material.dispose();
                    }

                    // Create new path line with updated waypoints
                    const newPathLine = createRocketPathLine(
                        orbitalPoints,
                        getPriorityColor(rocket.mission.priority),
                    );
                    this.scene.add(newPathLine);
                    rocket.pathLine = newPathLine;
                }
            }

            // Use orbital path if available, otherwise fallback to linear
            if (rocket.orbitalPath && rocket.orbitalPath.length > 0) {
                // ORBITAL PATH FOLLOWING
                const currentSegmentIndex =
                    rocket.currentPathSegment ?? 0;
                const segment =
                    rocket.orbitalPath[currentSegmentIndex];

                if (!segment) {
                    return; // Invalid segment, skip this rocket
                }

                // Calculate current speed with gravitational assists
                let currentSpeed = rocket.speed * segment.baseSpeed;

                // Apply gravitational assist if in influence radius
                if (segment.assistBody) {
                    const speedMultiplier = calculateGravityAssist(
                        rocket.mesh.position,
                        segment.assistBody.position,
                        segment.assistBody.mass,
                        segment.assistBody.influenceRadius,
                    );
                    currentSpeed *= speedMultiplier;

                    // Visual feedback for gravity assist
                    if (speedMultiplier > 1.2) {
                        this.boostEngineGlow(rocket, speedMultiplier);
                    }
                }

                // Update progress along current segment
                const normalizedSpeed = currentSpeed * 0.05;
                const segmentProgress = (rocket.segmentProgress ?? 0) + normalizedSpeed * deltaTime;
                rocket.segmentProgress = segmentProgress;

                // Check if segment is complete
                if (rocket.segmentProgress >= 1.0) {
                    rocket.segmentProgress = 0;
                    rocket.currentPathSegment =
                        (currentSegmentIndex + 1) % rocket.orbitalPath.length;
                }

                // Interpolate position along waypoints
                const waypoints = segment.waypoints;
                const waypointIndex = Math.floor(
                    rocket.segmentProgress * (waypoints.length - 1),
                );
                const waypointT =
                    rocket.segmentProgress * (waypoints.length - 1) -
                    waypointIndex;

                const currentWaypoint = waypoints[waypointIndex];
                const nextWaypoint =
                    waypoints[Math.min(waypointIndex + 1, waypoints.length - 1)];

                rocket.mesh.position.lerpVectors(
                    currentWaypoint,
                    nextWaypoint,
                    waypointT,
                );

                // Orient rocket along path (look ahead for smooth rotation)
                const lookAheadIndex = Math.min(
                    waypointIndex + 2,
                    waypoints.length - 1,
                );
                rocket.mesh.lookAt(waypoints[lookAheadIndex]);
            } else {
                // FALLBACK: Linear interpolation (backward compatibility)
                const homePos = new THREE.Vector3(0, 0, 0);
                let startPos: THREE.Vector3;
                let endPos: THREE.Vector3;

                if (rocket.route && rocket.route.length > 0) {
                    const totalSegments = rocket.route.length + 1;
                    const segment = rocket.currentSegment ?? 0;

                    if (segment === 0) {
                        startPos = homePos;
                        endPos = new THREE.Vector3(
                            rocket.route[0].position_x || 0,
                            rocket.route[0].position_y || 0,
                            rocket.route[0].position_z || 0,
                        );
                    } else if (segment < rocket.route.length) {
                        const prevPlanet = rocket.route[segment - 1];
                        const nextPlanet = rocket.route[segment];
                        startPos = new THREE.Vector3(
                            prevPlanet.position_x || 0,
                            prevPlanet.position_y || 0,
                            prevPlanet.position_z || 0,
                        );
                        endPos = new THREE.Vector3(
                            nextPlanet.position_x || 0,
                            nextPlanet.position_y || 0,
                            nextPlanet.position_z || 0,
                        );
                    } else {
                        const lastPlanet = rocket.route[rocket.route.length - 1];
                        startPos = new THREE.Vector3(
                            lastPlanet.position_x || 0,
                            lastPlanet.position_y || 0,
                            lastPlanet.position_z || 0,
                        );
                        endPos = homePos;
                    }
                } else {
                    startPos = homePos;
                    endPos = new THREE.Vector3(
                        rocket.planet.position_x || 0,
                        rocket.planet.position_y || 0,
                        rocket.planet.position_z || 0,
                    );
                }

                const normalizedSpeed = rocket.speed * 0.05;
                rocket.travelProgress += normalizedSpeed * deltaTime;

                if (rocket.travelProgress >= 1) {
                    rocket.travelProgress = 0;
                    if (rocket.route && rocket.route.length > 0) {
                        const totalSegments = rocket.route.length + 1;
                        rocket.currentSegment =
                            ((rocket.currentSegment ?? 0) + 1) % totalSegments;
                    }
                }

                rocket.mesh.position.lerpVectors(
                    startPos,
                    endPos,
                    rocket.travelProgress,
                );

                const lookAheadProgress = Math.min(
                    1,
                    rocket.travelProgress + 0.02,
                );
                const targetPos = new THREE.Vector3();
                targetPos.lerpVectors(startPos, endPos, lookAheadProgress);
                rocket.mesh.lookAt(targetPos);
            }

            // Pulse the engine glow - need to search in nested group
            const rocketMesh = rocket.mesh.children[0]; // First child is the rocketMesh group
            if (rocketMesh) {
                const glow = rocketMesh.children.find(
                    (child) => child instanceof THREE.Sprite,
                ) as THREE.Sprite | undefined;

                if (glow && glow.material instanceof THREE.SpriteMaterial) {
                    const pulse = Math.sin(Date.now() * 0.015) * 0.4 + 0.6; // Faster pulse
                    glow.material.opacity = pulse;
                }
            }

            // Update ionic trail with dynamic effects
            if (rocket.trail && rocket.trailPositions) {
                const maxTrailLength = 60;

                // Add current position with slight random offset for spread effect
                const spreadAmount = 0.3;
                const randomOffset = new THREE.Vector3(
                    (Math.random() - 0.5) * spreadAmount,
                    (Math.random() - 0.5) * spreadAmount,
                    (Math.random() - 0.5) * spreadAmount,
                );

                rocket.trailPositions.unshift(
                    new THREE.Vector3(
                        rocket.mesh.position.x + randomOffset.x,
                        rocket.mesh.position.y + randomOffset.y,
                        rocket.mesh.position.z + randomOffset.z,
                    ),
                );

                // Keep trail length limited
                if (rocket.trailPositions.length > maxTrailLength) {
                    rocket.trailPositions.pop();
                }

                // Update trail geometry with dynamic effects
                const positions =
                    rocket.trail.geometry.getAttribute('position');
                const sizes = rocket.trail.geometry.getAttribute('size');
                const colors = rocket.trail.geometry.getAttribute('color');

                const baseColor = new THREE.Color(
                    getPriorityColor(rocket.mission.priority),
                );
                const time = Date.now() * 0.001;

                for (let i = 0; i < maxTrailLength; i++) {
                    if (i < rocket.trailPositions.length) {
                        const pos = rocket.trailPositions[i];
                        positions.setXYZ(i, pos.x, pos.y, pos.z);

                        // Dynamic size with faster, more dramatic pulse
                        const baseFade = 1 - i / maxTrailLength;
                        const pulse = Math.sin(time * 3 + i * 0.2) * 0.4 + 0.6;
                        sizes.setX(i, baseFade * 3 * pulse);

                        // Animated color intensity
                        const colorPulse =
                            Math.sin(time * 2 + i * 0.15) * 0.3 + 0.7;
                        colors.setXYZ(
                            i,
                            baseColor.r * (0.5 + baseFade * 0.5) * colorPulse,
                            baseColor.g * (0.5 + baseFade * 0.5) * colorPulse,
                            baseColor.b * (0.5 + baseFade * 0.5) * colorPulse,
                        );
                    } else {
                        // Fill remaining with last position
                        const lastPos =
                            rocket.trailPositions[
                                rocket.trailPositions.length - 1
                            ];
                        if (lastPos) {
                            positions.setXYZ(
                                i,
                                lastPos.x,
                                lastPos.y,
                                lastPos.z,
                            );
                            sizes.setX(i, 0);
                            colors.setXYZ(i, 0, 0, 0);
                        }
                    }
                }
                positions.needsUpdate = true;
                sizes.needsUpdate = true;
                colors.needsUpdate = true;
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
     * Calculate and set orbital path for a rocket
     */
    private calculateRocketPath(rocket: RocketInstance): void {
        if (!rocket.route || rocket.route.length === 0) {
            return;
        }

        const homePos = new THREE.Vector3(0, 0, 0);

        // Generate orbital path using Keplerian mechanics
        rocket.orbitalPath = generateOrbitalPath(
            rocket.route,
            homePos,
            this.galaxyCenters,
            this.blackHoleMasses,
        );

        // Scale speeds by mission type
        const speedMultiplier = rocket.speed;
        rocket.orbitalPath.forEach((segment) => {
            segment.baseSpeed = speedMultiplier;
        });

        // Initialize path traversal
        rocket.currentPathSegment = 0;
        rocket.segmentProgress = 0;
        rocket.lastPathUpdateTime = Date.now();
        rocket.needsPathRecalculation = false;
    }

    /**
     * Check if a rocket's path needs recalculation
     */
    private pathNeedsRecalculation(rocket: RocketInstance): boolean {
        if (!rocket.orbitalPath || !rocket.lastPathUpdateTime) {
            return true; // No path exists yet
        }

        // Time-based check: recalculate every 30 seconds
        const now = Date.now();
        if (now - rocket.lastPathUpdateTime > 30000) {
            return true;
        }

        // Position-based check: if planets in route have moved significantly
        if (rocket.route) {
            const needsRecalc = shouldRecalculatePath(
                rocket.route,
                rocket.orbitalPath,
                5, // Threshold: 5 units
            );
            if (needsRecalc) {
                return true;
            }
        }

        return false;
    }

    /**
     * Update galaxy centers and black hole masses (called from scene update)
     */
    updateGravitationalBodies(
        galaxyCenters: Map<number, THREE.Vector3>,
        blackHoleMasses: Map<number, number>,
    ): void {
        this.galaxyCenters = galaxyCenters;
        this.blackHoleMasses = blackHoleMasses;
    }

    /**
     * Add a new rocket for a mission
     */
    addRocket(
        mission: Mission3D,
        planet: Planet3D,
        getPlanetById?: (id: number) => Planet3D | undefined,
    ): void {
        // Build route - if planet_route exists, use it; otherwise use single planet
        const route: Planet3D[] = [];
        if (
            mission.planet_route &&
            mission.planet_route.length > 0 &&
            getPlanetById
        ) {
            // Multi-planet route
            for (const planetId of mission.planet_route) {
                const routePlanet = getPlanetById(planetId);
                if (routePlanet) {
                    route.push(routePlanet);
                }
            }
        } else {
            // Single planet (backward compatibility)
            route.push(planet);
        }

        if (route.length === 0) return;

        const mesh = createRocket(mission);
        const orbitRadius = planet.orbit_radius || 20;
        const speed = getRocketSpeed(mission.commitment_type || 'one_time');

        // Start at home base (0, 0, 0)
        mesh.position.set(0, 0, 0);

        // Point rocket towards first planet in route
        const firstPlanetPos = new THREE.Vector3(
            route[0].position_x || 0,
            route[0].position_y || 0,
            route[0].position_z || 0,
        );
        mesh.lookAt(firstPlanetPos);

        this.scene.add(mesh);

        // Create trail
        const trail = createTrail(getPriorityColor(mission.priority));
        this.scene.add(trail);

        // Create placeholder path line (will be updated with orbital path)
        const homePos = new THREE.Vector3(0, 0, 0);
        const pathPoints: THREE.Vector3[] = [homePos];
        for (const routePlanet of route) {
            pathPoints.push(
                new THREE.Vector3(
                    routePlanet.position_x || 0,
                    routePlanet.position_y || 0,
                    routePlanet.position_z || 0,
                ),
            );
        }
        pathPoints.push(homePos); // Return to home

        const pathLine = createRocketPathLine(
            pathPoints,
            getPriorityColor(mission.priority),
        );
        this.scene.add(pathLine);

        const instance: RocketInstance = {
            mesh,
            mission,
            planet,
            route, // Always set route for orbital mechanics
            currentSegment: 0,
            angle: 0, // Kept for compatibility
            orbitRadius,
            speed,
            trail,
            trailPositions: [],
            pathLine,
            travelProgress: 0, // Start at home
            direction: 1, // Moving towards planet
        };

        // Calculate orbital path and update visualization
        this.calculateRocketPath(instance);

        // Update path line with curved orbital waypoints
        if (instance.orbitalPath) {
            this.scene.remove(pathLine);
            pathLine.geometry.dispose();
            if (pathLine.material instanceof THREE.Material) {
                pathLine.material.dispose();
            }

            // Create new path line from orbital waypoints
            const orbitalPoints: THREE.Vector3[] = [];
            instance.orbitalPath.forEach((segment) => {
                orbitalPoints.push(...segment.waypoints);
            });

            const newPathLine = createRocketPathLine(
                orbitalPoints,
                getPriorityColor(mission.priority),
            );
            this.scene.add(newPathLine);
            instance.pathLine = newPathLine;
        }

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

        // Remove path line
        if (rocket.pathLine) {
            this.scene.remove(rocket.pathLine);
            rocket.pathLine.geometry.dispose();
            if (rocket.pathLine.material instanceof THREE.Material) {
                rocket.pathLine.material.dispose();
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
     * Boost engine glow during gravitational assists
     */
    private boostEngineGlow(
        rocket: RocketInstance,
        speedMultiplier: number,
    ): void {
        const rocketMesh = rocket.mesh.children[0];
        if (!rocketMesh) return;

        const glow = rocketMesh.children.find(
            (child) => child instanceof THREE.Sprite,
        ) as THREE.Sprite | undefined;

        if (glow && glow.material instanceof THREE.SpriteMaterial) {
            // Boost intensity based on speed multiplier
            const boostIntensity = (speedMultiplier - 1.0) / 1.5; // 0-1 range
            glow.material.opacity = 0.6 + boostIntensity * 0.4; // 0.6 to 1.0
            glow.scale.set(1 + boostIntensity, 1 + boostIntensity, 1);

            // Shift color toward white for higher speeds
            const baseColor = new THREE.Color(
                getPriorityColor(rocket.mission.priority),
            );
            const boostedColor = new THREE.Color(baseColor).lerp(
                new THREE.Color(0xffffff),
                boostIntensity * 0.5,
            );
            glow.material.color = boostedColor;
        }
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

            // Dispose path line
            if (rocket.pathLine) {
                this.scene.remove(rocket.pathLine);
                rocket.pathLine.geometry.dispose();
                if (rocket.pathLine.material instanceof THREE.Material) {
                    rocket.pathLine.material.dispose();
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
