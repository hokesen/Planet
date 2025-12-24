import type { Galaxy3D } from '@/types/space';
import * as THREE from 'three';

export interface SceneSetupConfig {
    canvas: HTMLCanvasElement;
    galaxies: Galaxy3D[];
}

export interface SceneComponents {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
}

/**
 * Initialize the Three.js scene with camera, renderer, and lighting
 */
export function setupScene(canvas: HTMLCanvasElement): SceneComponents {
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000510); // Dark space blue

    // Calculate aspect ratio
    const rect = canvas.getBoundingClientRect();
    const aspect = rect.width / rect.height;

    // Create camera (fixed cinematic angle, angled down 10 degrees)
    const camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 2000);
    camera.position.set(150, 80, 150); // Lower Y for downward angle
    camera.lookAt(0, -10, 0); // Look slightly below origin for 10-degree downward tilt

    // Create renderer
    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
    });

    renderer.setSize(rect.width, rect.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2 for performance

    return { scene, camera, renderer };
}

/**
 * Add lighting to the scene
 */
export function setupLighting(scene: THREE.Scene, galaxies: Galaxy3D[]): void {
    // Ambient light for base visibility
    const ambient = new THREE.AmbientLight(0x404040, 1.5);
    scene.add(ambient);

    // Main directional light (sun)
    const sun = new THREE.DirectionalLight(0xffffff, 2);
    sun.position.set(100, 200, 100);
    sun.castShadow = false; // Disable shadows for performance
    scene.add(sun);

    // Add colored accent lights at galaxy centers
    galaxies.forEach((galaxy, index) => {
        if (!galaxy.color) return;

        const color = new THREE.Color(galaxy.color);
        const light = new THREE.PointLight(color, 0.5, 300);

        // Position based on galaxy index (will be updated when we position planets)
        const angle = (index / galaxies.length) * Math.PI * 2;
        const radius = 200;
        light.position.set(
            Math.cos(angle) * radius,
            ((index % 3) - 1) * 50,
            Math.sin(angle) * radius,
        );

        scene.add(light);
    });
}

/**
 * Add starfield background
 */
export function addStarfield(scene: THREE.Scene): void {
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 5000;
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 2000;
    }

    starsGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3),
    );

    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1,
        sizeAttenuation: true,
    });

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
}

/**
 * Create text sprite label for wormhole - currently unused
 */
// function createWormholeLabel(): THREE.Sprite {
//     const canvas = document.createElement('canvas');
//     const context = canvas.getContext('2d')!;

//     canvas.width = 512;
//     canvas.height = 128;

//     context.font = 'Bold 48px Arial';
//     context.fillStyle = '#ffffff';
//     context.textAlign = 'center';
//     context.textBaseline = 'middle';
//     context.fillText('Refueling Wormhole', canvas.width / 2, canvas.height / 2);

//     const texture = new THREE.CanvasTexture(canvas);
//     const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
//     const sprite = new THREE.Sprite(material);
//     sprite.scale.set(20, 5, 1); // Match planet label size

//     return sprite;
// }

/**
 * Add wormhole (refueling station) at origin
 */
export function addHomeBase(scene: THREE.Scene): THREE.Group {
    const wormholeGroup = new THREE.Group();
    wormholeGroup.position.set(0, 0, 0);
    wormholeGroup.userData.type = 'home_base';

    // Dark center void
    const voidGeometry = new THREE.SphereGeometry(6, 32, 32);
    const voidMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.9,
    });
    const voidMesh = new THREE.Mesh(voidGeometry, voidMaterial);
    wormholeGroup.add(voidMesh);

    // Create multiple swirling energy rings
    const rings: THREE.Mesh[] = [];
    for (let i = 0; i < 5; i++) {
        const innerRadius = 7 + i * 2;
        const outerRadius = innerRadius + 1.5;
        const ringGeometry = new THREE.RingGeometry(
            innerRadius,
            outerRadius,
            64,
        );

        // Gradient from purple to cyan for wormhole effect
        const colors = [0x9d00ff, 0x7700ff, 0x4400ff, 0x0088ff, 0x00ffff];
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: colors[i],
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6 - i * 0.1,
        });

        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        ring.rotation.z = (i * Math.PI) / 8; // Offset rotation for swirl effect
        wormholeGroup.add(ring);
        rings.push(ring);
    }

    // Add "Refueling Wormhole" label - currently disabled
    // const label = createWormholeLabel();
    // label.position.y = 25;
    // wormholeGroup.add(label);

    scene.add(wormholeGroup);

    // Store rings for animation
    wormholeGroup.userData.rings = rings;

    return wormholeGroup;
}

/**
 * Handle window resize
 */
export function handleResize(
    canvas: HTMLCanvasElement,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
): void {
    const rect = canvas.getBoundingClientRect();
    const aspect = rect.width / rect.height;

    camera.aspect = aspect;
    camera.updateProjectionMatrix();

    renderer.setSize(rect.width, rect.height);
}
