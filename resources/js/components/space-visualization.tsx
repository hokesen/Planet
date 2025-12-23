import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { Galaxy3D, Planet3D, Mission3D } from '@/types/space';
import {
    setupScene,
    setupLighting,
    addStarfield,
    addHomeBase,
    handleResize,
} from '@/lib/space/scene-setup';
import { PlanetManager } from '@/lib/space/planet-manager';
import { RocketManager } from '@/lib/space/rocket-manager';
import { InteractionHandler } from '@/lib/space/interaction-handler';
import {
    createAllGalaxyBoundaries,
    removeGalaxyBoundaries,
} from '@/lib/space/galaxy-boundaries';

export interface SpaceVisualizationProps {
    galaxies: Galaxy3D[];
    onRocketClick?: (mission: Mission3D) => void;
    onPlanetClick?: (planet: Planet3D) => void;
}

export function SpaceVisualization({
    galaxies,
    onRocketClick,
    onPlanetClick,
}: SpaceVisualizationProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sceneDataRef = useRef<{
        scene: THREE.Scene;
        camera: THREE.PerspectiveCamera;
        renderer: THREE.WebGLRenderer;
        planetManager: PlanetManager;
        rocketManager: RocketManager;
        interactionHandler: InteractionHandler;
        galaxyBoundaries: THREE.LineSegments[];
        animationId?: number;
        lastTime: number;
    } | null>(null);

    useEffect(() => {
        // SSR safety check
        if (typeof window === 'undefined') return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Initialize scene
        const { scene, camera, renderer } = setupScene(canvas);

        // Add lighting
        setupLighting(scene, galaxies);

        // Add starfield background
        addStarfield(scene);

        // Add home base
        addHomeBase(scene);

        // Initialize planet manager
        const planetManager = new PlanetManager(scene, galaxies);
        planetManager.initialize();

        // Initialize rocket manager
        const rocketManager = new RocketManager(scene);

        // Collect all missions from all galaxies
        const allMissions: Mission3D[] = [];
        galaxies.forEach((galaxy) => {
            galaxy.planets.forEach((planet) => {
                if (planet.missions) {
                    allMissions.push(...planet.missions);
                }
            });
        });

        // Initialize rockets with helper to get planet by ID
        rocketManager.initialize(allMissions, (planetId) => {
            return planetManager.getPlanet(planetId)?.planet;
        });

        // Initialize interaction handler
        const interactionHandler = new InteractionHandler(
            camera,
            scene,
            canvas,
            {
                onRocketClick,
                onPlanetClick,
            }
        );

        // Add galaxy boundaries
        const galaxyBoundaries = createAllGalaxyBoundaries(scene, galaxies);

        // Store scene data
        sceneDataRef.current = {
            scene,
            camera,
            renderer,
            planetManager,
            rocketManager,
            interactionHandler,
            galaxyBoundaries,
            lastTime: performance.now(),
        };

        // Animation loop
        const animate = (currentTime: number) => {
            if (!sceneDataRef.current) return;

            const deltaTime = Math.min(
                (currentTime - sceneDataRef.current.lastTime) / 1000,
                0.1
            ); // Cap delta to prevent issues
            sceneDataRef.current.lastTime = currentTime;

            // Slowly rotate camera around home (0,0,0)
            const cameraRotationSpeed = 0.05; // Slow rotation
            const currentAngle = Math.atan2(
                sceneDataRef.current.camera.position.z,
                sceneDataRef.current.camera.position.x
            );
            const newAngle = currentAngle + cameraRotationSpeed * deltaTime;
            const radius = Math.sqrt(
                sceneDataRef.current.camera.position.x ** 2 +
                    sceneDataRef.current.camera.position.z ** 2
            );

            sceneDataRef.current.camera.position.x = Math.cos(newAngle) * radius;
            sceneDataRef.current.camera.position.z = Math.sin(newAngle) * radius;
            sceneDataRef.current.camera.lookAt(0, 0, 0);

            // Update planets (rotation, effects)
            sceneDataRef.current.planetManager.update(deltaTime);

            // Update rockets (orbital animation)
            sceneDataRef.current.rocketManager.update(deltaTime);

            // Render scene
            sceneDataRef.current.renderer.render(
                sceneDataRef.current.scene,
                sceneDataRef.current.camera
            );

            // Continue animation
            sceneDataRef.current.animationId =
                requestAnimationFrame(animate);
        };

        // Start animation
        sceneDataRef.current.animationId = requestAnimationFrame(animate);

        // Handle window resize
        const onResize = () => {
            if (!sceneDataRef.current || !canvas) return;
            handleResize(
                canvas,
                sceneDataRef.current.camera,
                sceneDataRef.current.renderer
            );
        };

        window.addEventListener('resize', onResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', onResize);

            if (sceneDataRef.current) {
                if (sceneDataRef.current.animationId) {
                    cancelAnimationFrame(sceneDataRef.current.animationId);
                }

                sceneDataRef.current.planetManager.dispose();
                sceneDataRef.current.rocketManager.dispose();
                sceneDataRef.current.interactionHandler.dispose();
                removeGalaxyBoundaries(
                    sceneDataRef.current.scene,
                    sceneDataRef.current.galaxyBoundaries
                );
                sceneDataRef.current.renderer.dispose();
                sceneDataRef.current = null;
            }
        };
    }, [galaxies]);

    return (
        <canvas
            ref={canvasRef}
            className="h-full w-full"
            style={{ display: 'block' }}
        />
    );
}
