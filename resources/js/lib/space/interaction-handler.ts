import * as THREE from 'three';
import type { Mission3D, Planet3D, Galaxy3D } from '@/types/space';

export interface InteractionCallbacks {
    onRocketClick?: (mission: Mission3D) => void;
    onPlanetClick?: (planet: Planet3D) => void;
    onGalaxyClick?: (galaxy: Galaxy3D) => void;
    onWormholeClick?: () => void;
    onEmptySpaceClick?: () => void;
}

/**
 * Handles mouse interactions with the 3D scene using raycasting
 */
export class InteractionHandler {
    private raycaster: THREE.Raycaster;
    private mouse: THREE.Vector2;
    private hoveredObject: THREE.Object3D | null = null;
    private isDragging: boolean = false;
    private dragStart: THREE.Vector2 = new THREE.Vector2();
    private cameraAngle: number = 0;

    constructor(
        private camera: THREE.Camera,
        private scene: THREE.Scene,
        private domElement: HTMLElement,
        private callbacks: InteractionCallbacks
    ) {
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Calculate initial camera angle
        if (this.camera instanceof THREE.PerspectiveCamera) {
            this.cameraAngle = Math.atan2(
                this.camera.position.z,
                this.camera.position.x
            );
        }

        // Bind event listeners
        this.domElement.addEventListener('click', this.onClick.bind(this));
        this.domElement.addEventListener(
            'mousemove',
            this.onMouseMove.bind(this)
        );
        this.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.domElement.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.domElement.addEventListener('mouseleave', this.onMouseUp.bind(this));
    }

    /**
     * Update mouse position from event
     */
    private updateMousePosition(event: MouseEvent): void {
        const rect = this.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    /**
     * Get objects intersected by raycaster
     */
    private getIntersectedObjects(): THREE.Intersection[] {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        return this.raycaster.intersectObjects(this.scene.children, true);
    }

    /**
     * Handle click events
     */
    private onClick(event: MouseEvent): void {
        this.updateMousePosition(event);
        const intersects = this.getIntersectedObjects();

        if (intersects.length > 0) {
            // Find the first object with userData
            const clickedObject = this.findInteractableObject(
                intersects[0].object
            );

            if (clickedObject) {
                const { type, mission, planet, galaxy } = clickedObject.userData;

                if (type === 'rocket' && mission && this.callbacks.onRocketClick) {
                    this.callbacks.onRocketClick(mission as Mission3D);
                } else if (
                    type === 'planet' &&
                    planet &&
                    this.callbacks.onPlanetClick
                ) {
                    this.callbacks.onPlanetClick(planet as Planet3D);
                } else if (
                    type === 'black_hole' &&
                    galaxy &&
                    this.callbacks.onGalaxyClick
                ) {
                    this.callbacks.onGalaxyClick(galaxy as Galaxy3D);
                } else if (
                    type === 'home_base' &&
                    this.callbacks.onWormholeClick
                ) {
                    this.callbacks.onWormholeClick();
                }
            }
        } else {
            // Clicked on empty space
            if (this.callbacks.onEmptySpaceClick) {
                this.callbacks.onEmptySpaceClick();
            }
        }
    }

    /**
     * Handle mouse down events (start dragging)
     */
    private onMouseDown(event: MouseEvent): void {
        const rect = this.domElement.getBoundingClientRect();
        this.dragStart.set(
            event.clientX - rect.left,
            event.clientY - rect.top
        );
        this.isDragging = true;
        this.domElement.style.cursor = 'grabbing';
    }

    /**
     * Handle mouse up events (stop dragging)
     */
    private onMouseUp(): void {
        this.isDragging = false;
        this.domElement.style.cursor = 'default';
    }

    /**
     * Handle mouse move events (for hover effects and dragging)
     */
    private onMouseMove(event: MouseEvent): void {
        this.updateMousePosition(event);

        // Handle camera drag rotation
        if (this.isDragging) {
            const rect = this.domElement.getBoundingClientRect();
            const currentX = event.clientX - rect.left;
            const deltaX = currentX - this.dragStart.x;

            // Update camera angle based on drag (sensitivity: 0.005)
            this.cameraAngle -= deltaX * 0.005;

            // Update camera position
            if (this.camera instanceof THREE.PerspectiveCamera) {
                const radius = Math.sqrt(
                    this.camera.position.x ** 2 +
                        this.camera.position.z ** 2
                );
                this.camera.position.x = Math.cos(this.cameraAngle) * radius;
                this.camera.position.z = Math.sin(this.cameraAngle) * radius;
                this.camera.lookAt(0, -10, 0);
            }

            this.dragStart.x = currentX;
            return;
        }

        // Handle hover effects when not dragging
        const intersects = this.getIntersectedObjects();

        // Reset previous hover
        if (this.hoveredObject) {
            this.resetHoverEffect(this.hoveredObject);
            this.hoveredObject = null;
        }

        if (intersects.length > 0) {
            const hoveredObject = this.findInteractableObject(
                intersects[0].object
            );

            if (hoveredObject) {
                this.hoveredObject = hoveredObject;
                this.applyHoverEffect(hoveredObject);
                this.domElement.style.cursor = 'pointer';
            } else {
                this.domElement.style.cursor = 'grab';
            }
        } else {
            this.domElement.style.cursor = 'grab';
        }
    }

    /**
     * Find the interactable parent object (rocket, planet, black hole, or wormhole)
     */
    private findInteractableObject(
        object: THREE.Object3D
    ): THREE.Object3D | null {
        let current: THREE.Object3D | null = object;

        while (current) {
            if (
                current.userData.type === 'rocket' ||
                current.userData.type === 'planet' ||
                current.userData.type === 'black_hole' ||
                current.userData.type === 'home_base'
            ) {
                return current;
            }
            current = current.parent;
        }

        return null;
    }

    /**
     * Apply hover effect to object
     */
    private applyHoverEffect(object: THREE.Object3D): void {
        if (object.userData.type === 'rocket') {
            // Scale up rocket slightly
            object.scale.set(1.2, 1.2, 1.2);
        } else if (object.userData.type === 'planet') {
            // Brighten planet
            object.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    const material = child.material as THREE.MeshStandardMaterial;
                    if (material.emissive) {
                        material.emissiveIntensity = 0.5;
                    }
                }
            });
        } else if (object.userData.type === 'black_hole') {
            // Scale up slightly on hover
            object.scale.set(1.2, 1.2, 1.2);
        } else if (object.userData.type === 'home_base') {
            // Brighten wormhole on hover
            object.scale.set(1.1, 1.1, 1.1);
            if (object.userData.glow) {
                object.userData.glow.material.opacity = 0.3;
            }
        }
    }

    /**
     * Reset hover effect on object
     */
    private resetHoverEffect(object: THREE.Object3D): void {
        if (object.userData.type === 'rocket') {
            // Reset scale
            object.scale.set(1, 1, 1);
        } else if (object.userData.type === 'planet') {
            // Reset brightness
            object.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    const material = child.material as THREE.MeshStandardMaterial;
                    if (material.emissive) {
                        material.emissiveIntensity = 0.2;
                    }
                }
            });
        } else if (object.userData.type === 'black_hole') {
            // Reset scale
            object.scale.set(1, 1, 1);
        } else if (object.userData.type === 'home_base') {
            // Reset wormhole
            object.scale.set(1, 1, 1);
            if (object.userData.glow) {
                object.userData.glow.material.opacity = 0.15;
            }
        }
    }

    /**
     * Get current camera angle (for external use)
     */
    getCameraAngle(): number {
        return this.cameraAngle;
    }

    /**
     * Set camera angle (for external use)
     */
    setCameraAngle(angle: number): void {
        this.cameraAngle = angle;
    }

    /**
     * Clean up event listeners
     */
    dispose(): void {
        this.domElement.removeEventListener('click', this.onClick.bind(this));
        this.domElement.removeEventListener(
            'mousemove',
            this.onMouseMove.bind(this)
        );
        this.domElement.removeEventListener('mousedown', this.onMouseDown.bind(this));
        this.domElement.removeEventListener('mouseup', this.onMouseUp.bind(this));
        this.domElement.removeEventListener('mouseleave', this.onMouseUp.bind(this));

        if (this.hoveredObject) {
            this.resetHoverEffect(this.hoveredObject);
            this.hoveredObject = null;
        }
    }
}
