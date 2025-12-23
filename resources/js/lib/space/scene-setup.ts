import * as THREE from 'three';
import type { Galaxy3D } from '@/types/space';

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

    // Create camera (fixed cinematic angle)
    const camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 2000);
    camera.position.set(150, 100, 150); // Elevated 3/4 view
    camera.lookAt(0, 0, 0); // Look at origin (home base)

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
export function setupLighting(
    scene: THREE.Scene,
    galaxies: Galaxy3D[]
): void {
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
            (index % 3 - 1) * 50,
            Math.sin(angle) * radius
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
        new THREE.BufferAttribute(positions, 3)
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
 * Create animated rainbow material
 */
function createRainbowMaterial(): THREE.MeshStandardMaterial {
    // Start with a vibrant purple-pink
    const material = new THREE.MeshStandardMaterial({
        color: 0xff00ff,
        emissive: 0xff00ff,
        emissiveIntensity: 0.6,
        metalness: 0.9,
        roughness: 0.1,
        opacity: 1.0, // Fully opaque
        transparent: false,
    });

    return material;
}

/**
 * Create text sprite label
 */
function createHomeLabel(): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;

    canvas.width = 512;
    canvas.height = 128;

    context.font = 'Bold 60px Arial';
    context.fillStyle = '#ffffff';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('Home', canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(25, 6.25, 1);

    return sprite;
}

/**
 * Add home base object at origin
 */
export function addHomeBase(scene: THREE.Scene): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(12, 64, 64); // Larger, higher quality
    const material = createRainbowMaterial();

    const homeBase = new THREE.Mesh(geometry, material);
    homeBase.position.set(0, 0, 0);
    homeBase.userData.type = 'home_base';

    scene.add(homeBase);

    // Add "Home" label above
    const label = createHomeLabel();
    label.position.y = 20;
    homeBase.add(label);

    // Add first rainbow ring
    const ring1Geometry = new THREE.RingGeometry(15, 17, 128);
    const ring1Material = new THREE.MeshBasicMaterial({
        color: 0xff00ff, // Magenta
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
    });
    const ring1 = new THREE.Mesh(ring1Geometry, ring1Material);
    ring1.rotation.x = Math.PI / 2;
    homeBase.add(ring1);

    // Add second rainbow ring (outer)
    const ring2Geometry = new THREE.RingGeometry(20, 22, 128);
    const ring2Material = new THREE.MeshBasicMaterial({
        color: 0x00ffff, // Cyan
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
    });
    const ring2 = new THREE.Mesh(ring2Geometry, ring2Material);
    ring2.rotation.x = Math.PI / 2;
    ring2.rotation.z = Math.PI / 4; // Slight rotation for visual interest
    homeBase.add(ring2);

    // Store rings for animation
    homeBase.userData.rings = [ring1, ring2];
    homeBase.userData.material = material;

    return homeBase;
}

/**
 * Handle window resize
 */
export function handleResize(
    canvas: HTMLCanvasElement,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer
): void {
    const rect = canvas.getBoundingClientRect();
    const aspect = rect.width / rect.height;

    camera.aspect = aspect;
    camera.updateProjectionMatrix();

    renderer.setSize(rect.width, rect.height);
}
