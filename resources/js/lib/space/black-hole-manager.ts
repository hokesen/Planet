import * as THREE from 'three';
import type { Galaxy3D } from '@/types/space';

/**
 * Create a text sprite label for galaxy name
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

    // Scale sprite
    sprite.scale.set(20, 5, 1);

    return sprite;
}

/**
 * Calculate the center point of all planets in a galaxy
 */
export function calculateGalaxyCenter(galaxy: Galaxy3D): THREE.Vector3 {
    if (galaxy.planets.length === 0) {
        return new THREE.Vector3(0, 0, 0);
    }

    let sumX = 0;
    let sumY = 0;
    let sumZ = 0;

    galaxy.planets.forEach((planet) => {
        sumX += planet.position_x || 0;
        sumY += planet.position_y || 0;
        sumZ += planet.position_z || 0;
    });

    return new THREE.Vector3(
        sumX / galaxy.planets.length,
        sumY / galaxy.planets.length,
        sumZ / galaxy.planets.length
    );
}

/**
 * Create a black hole mesh - simple, small, and purely black
 */
export function createBlackHole(galaxy: Galaxy3D, center: THREE.Vector3): THREE.Group {
    const group = new THREE.Group();
    const galaxyColor = new THREE.Color(galaxy.color);

    // Main black hole sphere - smaller and purely black
    const blackHoleRadius = 3;
    const blackHoleGeometry = new THREE.SphereGeometry(blackHoleRadius, 32, 32);
    const blackHoleMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
    });
    const blackHoleMesh = new THREE.Mesh(blackHoleGeometry, blackHoleMaterial);
    group.add(blackHoleMesh);

    // Subtle event horizon ring (very thin)
    const ringGeometry = new THREE.RingGeometry(
        blackHoleRadius * 1.1,
        blackHoleRadius * 1.3,
        64
    );
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: galaxyColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
    });
    const accretionDisk = new THREE.Mesh(ringGeometry, ringMaterial);
    accretionDisk.rotation.x = Math.PI / 2;
    group.add(accretionDisk);

    // Position at galaxy center
    group.position.copy(center);

    // Add galaxy name label above black hole
    const label = createTextSprite(galaxy.name, galaxyColor.getStyle());
    label.position.y = blackHoleRadius + 10; // Position above black hole
    group.add(label);

    // Store galaxy data for interaction
    group.userData = {
        type: 'black_hole',
        galaxy: galaxy,
        accretionDisk: accretionDisk,
        glow: null,
    };

    return group;
}

/**
 * Black Hole Manager class to handle all black hole operations
 */
export class BlackHoleManager {
    private blackHoles: Map<number, THREE.Group> = new Map();
    private galaxyCenters: Map<number, THREE.Vector3> = new Map();

    constructor(
        private scene: THREE.Scene,
        private galaxies: Galaxy3D[]
    ) {}

    /**
     * Initialize all black holes in the scene
     */
    initialize(): void {
        this.galaxies.forEach((galaxy) => {
            const center = calculateGalaxyCenter(galaxy);
            this.galaxyCenters.set(galaxy.id, center);

            const blackHole = createBlackHole(galaxy, center);
            this.scene.add(blackHole);
            this.blackHoles.set(galaxy.id, blackHole);
        });
    }

    /**
     * Get the center position of a galaxy
     */
    getGalaxyCenter(galaxyId: number): THREE.Vector3 | undefined {
        return this.galaxyCenters.get(galaxyId);
    }

    /**
     * Get all galaxy centers
     */
    getAllCenters(): Map<number, THREE.Vector3> {
        return this.galaxyCenters;
    }

    /**
     * Update black hole animations (rotating accretion disk)
     */
    update(deltaTime: number): void {
        this.blackHoles.forEach((blackHole) => {
            const { accretionDisk } = blackHole.userData;

            // Rotate accretion disk
            if (accretionDisk) {
                accretionDisk.rotation.z += 0.5 * deltaTime;
            }
        });
    }

    /**
     * Clean up resources
     */
    dispose(): void {
        this.blackHoles.forEach((blackHole) => {
            blackHole.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.geometry.dispose();
                    if (child.material instanceof THREE.Material) {
                        child.material.dispose();
                    }
                }
            });
            this.scene.remove(blackHole);
        });
        this.blackHoles.clear();
        this.galaxyCenters.clear();
    }
}
