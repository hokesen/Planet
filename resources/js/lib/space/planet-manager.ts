import * as THREE from 'three';
import type { Galaxy3D, Planet3D, PlanetInstance, Vector3D } from '@/types/space';
import { getPlanetTexture } from './procedural-textures';

/**
 * Get planet radius based on size
 */
export function getPlanetRadius(size: string): number {
    const sizes = {
        small: 5,
        medium: 10,
        large: 18,
        massive: 25,
    };

    return sizes[size as keyof typeof sizes] || 10;
}

/**
 * Get orbit radius based on planet size
 */
export function getOrbitRadius(size: string): number {
    const base = getPlanetRadius(size);
    return base + 10; // Extra space around planet for rockets
}

/**
 * Generate a distinct color for each planet based on its global index
 */
function getPlanetColor(globalIndex: number): string {
    const colors = [
        '#FF6B6B', // Red
        '#4ECDC4', // Teal
        '#FFE66D', // Yellow
        '#A8DADC', // Light Blue
        '#FF8C42', // Orange
        '#95E1D3', // Mint
        '#F38181', // Pink
        '#AA96DA', // Purple
        '#FCBAD3', // Light Pink
        '#A8E6CF', // Green
        '#FFD93D', // Gold
        '#6BCF7F', // Light Green
    ];

    return colors[globalIndex % colors.length];
}

/**
 * Auto-position planets using Fibonacci sphere distribution
 * Planets are clustered by galaxy in 3D space
 */
export function autoPositionPlanets(galaxies: Galaxy3D[]): void {
    const galaxySpacing = 150;
    let globalPlanetIndex = 0;

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

            // Assign a unique color if not set
            if (!planet.color) {
                planet.color = getPlanetColor(globalPlanetIndex);
            }

            globalPlanetIndex++;
        });
    });
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

        // Create planet meshes
        this.galaxies.forEach((galaxy) => {
            galaxy.planets.forEach((planet) => {
                const mesh = createPlanet(planet, galaxy.color);
                addPlanetEffects(mesh, planet);

                this.scene.add(mesh);

                const instance: PlanetInstance = {
                    mesh,
                    planet,
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
     * Update planet animations (rotation, effects)
     */
    update(deltaTime: number): void {
        this.planets.forEach((instance) => {
            // Slow rotation on Y axis
            instance.mesh.rotation.y += 0.1 * deltaTime;

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
            instance.mesh.geometry.dispose();
            if (instance.mesh.material instanceof THREE.Material) {
                instance.mesh.material.dispose();
            }
            this.scene.remove(instance.mesh);
        });
        this.planets.clear();
    }
}
