import * as THREE from 'three';
import type { Galaxy3D, Planet3D, PlanetInstance, MoonInstance } from '@/types/space';
import { getPlanetTexture } from './procedural-textures';
import { calculateGalaxyCenter } from './black-hole-manager';

/**
 * Get planet radius based on size (reduced to 1/3 of original)
 */
export function getPlanetRadius(size: string): number {
    const sizes = {
        small: 1.7,
        medium: 3.3,
        large: 6,
        massive: 8.3,
    };

    return sizes[size as keyof typeof sizes] || 3.3;
}

/**
 * Get orbit radius based on planet size
 */
export function getOrbitRadius(size: string): number {
    const base = getPlanetRadius(size);
    return base + 10; // Extra space around planet for rockets
}

/**
 * Generate a randomized color for each planet based on its ID
 */
function getPlanetColor(planetId: number): string {
    const random = (seed: number) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    };

    // Generate random HSL values
    const hue = random(planetId * 12.345) * 360;
    const saturation = 60 + random(planetId * 23.456) * 30; // 60-90%
    const lightness = 50 + random(planetId * 34.567) * 20; // 50-70%

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Auto-position planets using Fibonacci sphere distribution
 * Planets are clustered by galaxy in 3D space
 */
export function autoPositionPlanets(galaxies: Galaxy3D[]): void {
    galaxies.forEach((galaxy, gIndex) => {
        // Position galaxy center in circular pattern
        // For single galaxy, position at origin; for multiple, spread in circle
        const angle = (gIndex / galaxies.length) * Math.PI * 2;
        const radius = galaxies.length > 1 ? 80 : 0; // Smaller radius, closer to origin
        const centerX = Math.cos(angle) * radius;
        const centerZ = Math.sin(angle) * radius;
        const centerY = (gIndex % 3 - 1) * 20; // Less vertical variation

        // Distribute planets within galaxy using fibonacci sphere
        const galaxyRadius = 40; // Smaller cluster radius

        galaxy.planets.forEach((planet, pIndex) => {
            // Skip if not using auto-positioning
            if (
                planet.position_x !== null &&
                planet.position_y !== null &&
                planet.position_z !== null &&
                !planet.use_auto_positioning
            ) {
                return;
            }

            // Fibonacci sphere algorithm
            const phi = Math.acos(1 - (2 * (pIndex + 0.5)) / galaxy.planets.length);
            const theta = Math.PI * (1 + Math.sqrt(5)) * pIndex;

            planet.position_x =
                centerX + galaxyRadius * Math.sin(phi) * Math.cos(theta);
            planet.position_y =
                centerY + galaxyRadius * Math.sin(phi) * Math.sin(theta);
            planet.position_z = centerZ + galaxyRadius * Math.cos(phi);

            // Set orbit radius if not set
            if (planet.orbit_radius === null) {
                planet.orbit_radius = getOrbitRadius(planet.size);
            }

            // Assign a unique randomized color if not set
            if (!planet.color) {
                planet.color = getPlanetColor(planet.id);
            }
        });
    });
}

/**
 * Get orbital speed based on planet size (smaller planets orbit faster)
 */
function getOrbitalSpeed(size: string, distance: number): number {
    const baseSpeeds = {
        small: 0.15,
        medium: 0.12,
        large: 0.08,
        massive: 0.05,
    };

    const baseSpeed = baseSpeeds[size as keyof typeof baseSpeeds] || 0.1;
    // Adjust speed based on distance (farther = slower, like Kepler's laws)
    return baseSpeed * (30 / Math.max(distance, 1));
}

/**
 * Create a dotted orbit line for a planet
 */
function createOrbitLine(
    center: THREE.Vector3,
    distance: number,
    color: string
): THREE.Line {
    const points: THREE.Vector3[] = [];
    const segments = 128;

    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(
            center.x + distance * Math.cos(angle),
            center.y,
            center.z + distance * Math.sin(angle)
        ));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineDashedMaterial({
        color: new THREE.Color(color),
        dashSize: 2,
        gapSize: 2,
        transparent: true,
        opacity: 0.3,
    });

    const line = new THREE.Line(geometry, material);
    line.computeLineDistances(); // Required for dashed lines

    return line;
}

/**
 * Create a text sprite label
 */
function createTextSprite(text: string, color: string = '#ffffff'): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;

    // Set canvas size
    canvas.width = 512;
    canvas.height = 128;

    // Configure text
    context.font = 'Bold 48px Arial';
    context.fillStyle = color;
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    // Draw text
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    // Create sprite
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);

    // Scale sprite (adjust as needed)
    sprite.scale.set(20, 5, 1);

    return sprite;
}

/**
 * Create a planet mesh with material and effects
 */
export function createPlanet(
    planet: Planet3D,
    galaxyColor: string
): THREE.Mesh {
    const radius = getPlanetRadius(planet.size);
    const geometry = new THREE.SphereGeometry(radius, 64, 64); // Higher quality for texture detail

    // Generate procedural texture
    const textureCanvas = getPlanetTexture(planet.id);
    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.needsUpdate = true;

    // Use planet color or fallback to galaxy color for glow
    const color = new THREE.Color(planet.color || galaxyColor);

    const material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.8,
        metalness: 0.1,
        // Subtle emissive glow using planet color
        emissive: color,
        emissiveIntensity: 0.1,
    });

    const mesh = new THREE.Mesh(geometry, material);

    // Position the planet
    mesh.position.set(
        planet.position_x || 0,
        planet.position_y || 0,
        planet.position_z || 0
    );

    // Add text label above planet
    const label = createTextSprite(planet.name, color.getStyle());
    label.position.y = radius + 8; // Position above planet
    mesh.add(label);

    // Store planet data for interaction
    mesh.userData = {
        type: 'planet',
        planet: planet,
    };

    return mesh;
}

/**
 * Create moons orbiting a planet (0-3 random moons)
 */
function createMoons(planetId: number, planetRadius: number): MoonInstance[] {
    const random = (seed: number) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    };

    // Determine number of moons (0-3)
    const moonCount = Math.floor(random(planetId * 45.678) * 4);
    const moons: MoonInstance[] = [];

    for (let i = 0; i < moonCount; i++) {
        const moonRadius = 0.3 + random(planetId * 56.789 + i) * 0.5; // 0.3-0.8
        const moonGeometry = new THREE.SphereGeometry(moonRadius, 16, 16);

        // Random gray color for moon
        const grayValue = Math.floor(120 + random(planetId * 67.890 + i) * 80);
        const moonMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(`rgb(${grayValue}, ${grayValue}, ${grayValue})`),
            roughness: 0.9,
            metalness: 0.1,
        });

        const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);

        // Orbital parameters
        const orbitDistance = planetRadius + 5 + i * 3; // Spacing between moons
        const orbitSpeed = 0.8 - i * 0.2; // Inner moons orbit faster
        const orbitAngle = random(planetId * 78.901 + i) * Math.PI * 2; // Random start position

        moons.push({
            mesh: moonMesh,
            orbitAngle,
            orbitDistance,
            orbitSpeed,
        });
    }

    return moons;
}

/**
 * Add visual effects based on planet health status
 */
export function addPlanetEffects(
    mesh: THREE.Mesh,
    planet: Planet3D
): void {
    const radius = getPlanetRadius(planet.size);

    // Add glow effect based on health status
    if (planet.health_status === 'critical') {
        // Pulsing red glow for critical planets
        const glowGeometry = new THREE.SphereGeometry(radius * 1.2, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.3,
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        mesh.add(glow);
    } else if (planet.health_status === 'thriving') {
        // Bright particles for thriving planets
        const particleCount = 50;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i++) {
            positions[i] = (Math.random() - 0.5) * radius * 3;
        }

        particles.setAttribute(
            'position',
            new THREE.BufferAttribute(positions, 3)
        );

        const particleMaterial = new THREE.PointsMaterial({
            color: 0xffff00,
            size: 0.5,
            transparent: true,
            opacity: 0.6,
        });

        const particleSystem = new THREE.Points(particles, particleMaterial);
        mesh.add(particleSystem);
    }

    // Add ring for completed planets
    if (planet.status === 'completed') {
        const ringGeometry = new THREE.RingGeometry(
            radius * 1.3,
            radius * 1.5,
            64
        );
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5,
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        mesh.add(ring);
    }
}

/**
 * Planet Manager class to handle all planet-related operations
 */
export class PlanetManager {
    private planets: Map<number, PlanetInstance> = new Map();
    private galaxyCenters: Map<number, THREE.Vector3> = new Map();

    constructor(
        private scene: THREE.Scene,
        private galaxies: Galaxy3D[]
    ) {}

    /**
     * Initialize all planets in the scene
     */
    initialize(): void {
        // Auto-position planets that need it
        autoPositionPlanets(this.galaxies);

        // Calculate and store galaxy centers
        this.galaxies.forEach((galaxy) => {
            const center = calculateGalaxyCenter(galaxy);
            this.galaxyCenters.set(galaxy.id, center);
        });

        // Create planet meshes
        this.galaxies.forEach((galaxy) => {
            const galaxyCenter = this.galaxyCenters.get(galaxy.id)!;

            galaxy.planets.forEach((planet) => {
                const mesh = createPlanet(planet, galaxy.color);
                addPlanetEffects(mesh, planet);

                this.scene.add(mesh);

                // Calculate orbit parameters
                const planetPos = new THREE.Vector3(
                    planet.position_x || 0,
                    planet.position_y || 0,
                    planet.position_z || 0
                );
                const orbitDistance = Math.sqrt(
                    Math.pow(planetPos.x - galaxyCenter.x, 2) +
                    Math.pow(planetPos.z - galaxyCenter.z, 2)
                );
                const orbitAngle = Math.atan2(
                    planetPos.z - galaxyCenter.z,
                    planetPos.x - galaxyCenter.x
                );
                const orbitSpeed = getOrbitalSpeed(planet.size, orbitDistance);

                // Create orbit line
                const orbitLine = createOrbitLine(
                    galaxyCenter,
                    orbitDistance,
                    planet.color || galaxy.color
                );
                this.scene.add(orbitLine);

                // Create and add moons
                const radius = getPlanetRadius(planet.size);
                const moons = createMoons(planet.id, radius);
                moons.forEach(moon => {
                    mesh.add(moon.mesh); // Add moon to planet (so it moves with planet)
                    // Position moon in orbit
                    moon.mesh.position.set(
                        moon.orbitDistance * Math.cos(moon.orbitAngle),
                        0,
                        moon.orbitDistance * Math.sin(moon.orbitAngle)
                    );
                });

                const instance: PlanetInstance = {
                    mesh,
                    planet,
                    orbitAngle,
                    orbitDistance,
                    orbitSpeed,
                    orbitLine,
                    moons,
                };

                this.planets.set(planet.id, instance);
            });
        });
    }

    /**
     * Get a planet instance by ID
     */
    getPlanet(planetId: number): PlanetInstance | undefined {
        return this.planets.get(planetId);
    }

    /**
     * Get all planet instances
     */
    getAllPlanets(): PlanetInstance[] {
        return Array.from(this.planets.values());
    }

    /**
     * Update planet animations (rotation, orbital movement, effects)
     */
    update(deltaTime: number): void {
        this.planets.forEach((instance) => {
            // Get galaxy center for this planet
            const galaxyCenter = this.galaxyCenters.get(instance.planet.galaxy_id);
            if (!galaxyCenter) return;

            // Update orbital position
            instance.orbitAngle += instance.orbitSpeed * deltaTime;

            // Calculate new position in orbit (circular orbit in XZ plane)
            const newX = galaxyCenter.x + instance.orbitDistance * Math.cos(instance.orbitAngle);
            const newZ = galaxyCenter.z + instance.orbitDistance * Math.sin(instance.orbitAngle);
            const newY = galaxyCenter.y; // Keep Y at galaxy center level

            instance.mesh.position.set(newX, newY, newZ);

            // Update planet data for rocket targeting
            instance.planet.position_x = newX;
            instance.planet.position_y = newY;
            instance.planet.position_z = newZ;

            // Slow rotation on Y axis (planet spinning)
            instance.mesh.rotation.y += 0.1 * deltaTime;

            // Update moon orbits
            if (instance.moons) {
                instance.moons.forEach(moon => {
                    // Update moon orbital angle
                    moon.orbitAngle += moon.orbitSpeed * deltaTime;

                    // Update moon position around planet
                    moon.mesh.position.set(
                        moon.orbitDistance * Math.cos(moon.orbitAngle),
                        0,
                        moon.orbitDistance * Math.sin(moon.orbitAngle)
                    );
                });
            }

            // Pulse effect for critical planets
            if (instance.planet.health_status === 'critical') {
                const glow = instance.mesh.children.find(
                    (child) => child instanceof THREE.Mesh && child !== instance.mesh
                );
                if (glow && glow instanceof THREE.Mesh && glow.material instanceof THREE.MeshBasicMaterial) {
                    const pulse = Math.sin(Date.now() * 0.003) * 0.2 + 0.3;
                    glow.material.opacity = pulse;
                }
            }
        });
    }

    /**
     * Clean up resources
     */
    dispose(): void {
        this.planets.forEach((instance) => {
            // Dispose planet mesh
            instance.mesh.geometry.dispose();
            if (instance.mesh.material instanceof THREE.Material) {
                instance.mesh.material.dispose();
            }
            this.scene.remove(instance.mesh);

            // Dispose orbit line
            if (instance.orbitLine) {
                instance.orbitLine.geometry.dispose();
                if (instance.orbitLine.material instanceof THREE.Material) {
                    instance.orbitLine.material.dispose();
                }
                this.scene.remove(instance.orbitLine);
            }
        });
        this.planets.clear();
        this.galaxyCenters.clear();
    }
}
