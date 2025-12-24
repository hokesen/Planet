import type { Galaxy3D } from '@/types/space';
import * as THREE from 'three';

/**
 * Calculate the center point of all planets in a galaxy
 */
function calculateGalaxyCenter(galaxy: Galaxy3D): THREE.Vector3 {
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
        sumZ / galaxy.planets.length,
    );
}

/**
 * Calculate the radius needed to encompass all planets in a galaxy
 */
function calculateGalaxyRadius(
    galaxy: Galaxy3D,
    center: THREE.Vector3,
): number {
    if (galaxy.planets.length === 0) {
        return 50; // Default radius
    }

    let maxDistance = 0;

    galaxy.planets.forEach((planet) => {
        const planetPos = new THREE.Vector3(
            planet.position_x || 0,
            planet.position_y || 0,
            planet.position_z || 0,
        );
        const distance = center.distanceTo(planetPos);
        if (distance > maxDistance) {
            maxDistance = distance;
        }
    });

    // Add padding (planet size + orbit radius)
    return maxDistance + 30;
}

/**
 * Create a dotted line sphere boundary for a galaxy
 */
export function createGalaxyBoundary(
    galaxy: Galaxy3D,
): THREE.LineSegments | null {
    if (galaxy.planets.length === 0) {
        return null;
    }

    const center = calculateGalaxyCenter(galaxy);
    const radius = calculateGalaxyRadius(galaxy, center);

    // Create wireframe sphere geometry
    const geometry = new THREE.SphereGeometry(radius, 32, 16);
    const wireframeGeometry = new THREE.WireframeGeometry(geometry);

    // Create dotted line material
    const material = new THREE.LineDashedMaterial({
        color: new THREE.Color(galaxy.color),
        dashSize: 3,
        gapSize: 2,
        transparent: true,
        opacity: 0.3,
        linewidth: 1,
    });

    const boundary = new THREE.LineSegments(wireframeGeometry, material);
    boundary.position.copy(center);
    boundary.computeLineDistances(); // Required for dashed lines

    // Store galaxy data for potential interaction
    boundary.userData = {
        type: 'galaxy_boundary',
        galaxy: galaxy,
    };

    return boundary;
}

/**
 * Create all galaxy boundaries for the scene
 */
export function createAllGalaxyBoundaries(
    scene: THREE.Scene,
    galaxies: Galaxy3D[],
): THREE.LineSegments[] {
    const boundaries: THREE.LineSegments[] = [];

    galaxies.forEach((galaxy) => {
        const boundary = createGalaxyBoundary(galaxy);
        if (boundary) {
            scene.add(boundary);
            boundaries.push(boundary);
        }
    });

    return boundaries;
}

/**
 * Remove all galaxy boundaries from the scene
 */
export function removeGalaxyBoundaries(
    scene: THREE.Scene,
    boundaries: THREE.LineSegments[],
): void {
    boundaries.forEach((boundary) => {
        scene.remove(boundary);
        boundary.geometry.dispose();
        if (boundary.material instanceof THREE.Material) {
            boundary.material.dispose();
        }
    });
}
