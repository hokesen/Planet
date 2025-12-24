import { BlackHoleManager } from '@/lib/space/black-hole-manager';
import {
    createAllGalaxyBoundaries,
    removeGalaxyBoundaries,
} from '@/lib/space/galaxy-boundaries';
import { InteractionHandler } from '@/lib/space/interaction-handler';
import { PlanetManager } from '@/lib/space/planet-manager';
import { RocketManager } from '@/lib/space/rocket-manager';
import {
    addHomeBase,
    addStarfield,
    handleResize,
    setupLighting,
    setupScene,
} from '@/lib/space/scene-setup';
import type { Galaxy3D, Mission3D, Planet3D } from '@/types/space';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export interface SpaceVisualizationProps {
    galaxies: Galaxy3D[];
    onRocketClick?: (mission: Mission3D) => void;
    onPlanetClick?: (planet: Planet3D) => void;
    onGalaxyClick?: (galaxy: Galaxy3D) => void;
    onWormholeClick?: () => void;
}

export function SpaceVisualization({
    galaxies,
    onRocketClick,
    onPlanetClick,
    onGalaxyClick,
    onWormholeClick,
}: SpaceVisualizationProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sceneDataRef = useRef<{
        scene: THREE.Scene;
        camera: THREE.PerspectiveCamera;
        renderer: THREE.WebGLRenderer;
        planetManager: PlanetManager;
        rocketManager: RocketManager;
        blackHoleManager: BlackHoleManager;
        interactionHandler: InteractionHandler;
        galaxyBoundaries: THREE.LineSegments[];
        animationId?: number;
        lastTime: number;
    } | null>(null);

    // Store callbacks in refs to avoid recreating the scene when they change
    const callbacksRef = useRef({
        onRocketClick,
        onPlanetClick,
        onGalaxyClick,
        onWormholeClick,
    });
    useEffect(() => {
        callbacksRef.current = {
            onRocketClick,
            onPlanetClick,
            onGalaxyClick,
            onWormholeClick,
        };
    }, [onRocketClick, onPlanetClick, onGalaxyClick, onWormholeClick]);

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

        // Initialize black hole manager (must be before planet manager)
        const blackHoleManager = new BlackHoleManager(scene, galaxies);
        blackHoleManager.initialize();

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
                onRocketClick: (mission) =>
                    callbacksRef.current.onRocketClick?.(mission),
                onPlanetClick: (planet) =>
                    callbacksRef.current.onPlanetClick?.(planet),
                onGalaxyClick: (galaxy) =>
                    callbacksRef.current.onGalaxyClick?.(galaxy),
                onWormholeClick: () => callbacksRef.current.onWormholeClick?.(),
            },
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
            blackHoleManager,
            interactionHandler,
            galaxyBoundaries,
            lastTime: performance.now(),
        };

        // Animation loop
        const animate = (currentTime: number) => {
            if (!sceneDataRef.current) return;

            const deltaTime = Math.min(
                (currentTime - sceneDataRef.current.lastTime) / 1000,
                0.1,
            ); // Cap delta to prevent issues
            sceneDataRef.current.lastTime = currentTime;

            // Automatic camera rotation (disabled - manual control takes precedence)
            // User can now drag to rotate the camera manually

            // Update black holes (rotation, pulsing glow)
            sceneDataRef.current.blackHoleManager.update(deltaTime);

            // Update planets (rotation, orbital movement, effects)
            sceneDataRef.current.planetManager.update(deltaTime);

            // Update rockets (linear travel, path lines)
            sceneDataRef.current.rocketManager.update(deltaTime);

            // Render scene
            sceneDataRef.current.renderer.render(
                sceneDataRef.current.scene,
                sceneDataRef.current.camera,
            );

            // Continue animation
            sceneDataRef.current.animationId = requestAnimationFrame(animate);
        };

        // Start animation
        sceneDataRef.current.animationId = requestAnimationFrame(animate);

        // Handle window resize
        const onResize = () => {
            if (!sceneDataRef.current || !canvas) return;
            handleResize(
                canvas,
                sceneDataRef.current.camera,
                sceneDataRef.current.renderer,
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

                sceneDataRef.current.blackHoleManager.dispose();
                sceneDataRef.current.planetManager.dispose();
                sceneDataRef.current.rocketManager.dispose();
                sceneDataRef.current.interactionHandler.dispose();
                removeGalaxyBoundaries(
                    sceneDataRef.current.scene,
                    sceneDataRef.current.galaxyBoundaries,
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
