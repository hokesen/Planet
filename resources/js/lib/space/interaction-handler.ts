import type { CameraController } from '@/lib/space/camera-controller';
import type { Galaxy3D, Mission3D, Planet3D } from '@/types/space';
import * as THREE from 'three';

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
    private lastDragPosition: THREE.Vector2 = new THREE.Vector2();
    private dragVelocity: number = 0;
    private cameraController: CameraController | null = null;

    constructor(
        private camera: THREE.Camera,
        private scene: THREE.Scene,
        private domElement: HTMLElement,
        private callbacks: InteractionCallbacks,
    ) {
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Bind event listeners
        this.domElement.addEventListener('click', this.onClick.bind(this));
        this.domElement.addEventListener(
            'mousemove',
            this.onMouseMove.bind(this),
        );
        this.domElement.addEventListener(
            'mousedown',
            this.onMouseDown.bind(this),
        );
        this.domElement.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.domElement.addEventListener(
            'mouseleave',
            this.onMouseUp.bind(this),
        );
        this.domElement.addEventListener('wheel', this.onWheel.bind(this), {
            passive: false,
        });
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
                intersects[0].object,
            );

            if (clickedObject) {
                const { type, mission, planet, galaxy } =
                    clickedObject.userData;

                // Disable manual camera control when clicking on objects
                if (this.cameraController) {
                    this.cameraController.disableManualControl();
                }

                if (
                    type === 'rocket' &&
                    mission &&
                    this.callbacks.onRocketClick
                ) {
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
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        this.dragStart.set(x, y);
        this.lastDragPosition.set(x, y);
        this.dragVelocity = 0;
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
     * Handle wheel events (for zoom)
     */
    private onWheel(event: WheelEvent): void {
        event.preventDefault();

        if (this.camera instanceof THREE.PerspectiveCamera && this.cameraController) {
            // Get current distance from camera controller
            let cameraDistance = this.cameraController.getCameraDistance();

            // Zoom in/out by changing camera distance
            const zoomSpeed = 0.05;
            cameraDistance += event.deltaY * zoomSpeed;

            // Clamp distance to reasonable values
            cameraDistance = Math.max(50, Math.min(500, cameraDistance));

            // Update camera controller
            this.cameraController.updateManualDistance(cameraDistance);
        }
    }

    /**
     * Handle mouse move events (for hover effects and dragging)
     */
    private onMouseMove(event: MouseEvent): void {
        this.updateMousePosition(event);

        // Handle camera drag rotation
        if (this.isDragging && this.cameraController) {
            const rect = this.domElement.getBoundingClientRect();
            const currentX = event.clientX - rect.left;
            const currentY = event.clientY - rect.top;
            const deltaX = currentX - this.dragStart.x;

            // Calculate drag velocity (pixels moved since last frame)
            const velocityX = Math.abs(currentX - this.lastDragPosition.x);
            const velocityY = Math.abs(currentY - this.lastDragPosition.y);
            this.dragVelocity = Math.sqrt(velocityX * velocityX + velocityY * velocityY);

            // Get current angle from camera controller
            let cameraAngle = this.cameraController.getCameraAngle();

            // Update camera angle based on drag (sensitivity: 0.005)
            cameraAngle -= deltaX * 0.005;

            // Update camera controller with velocity information
            this.cameraController.updateManualAngle(cameraAngle, this.dragVelocity);

            this.dragStart.x = currentX;
            this.lastDragPosition.set(currentX, currentY);
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
                intersects[0].object,
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
        object: THREE.Object3D,
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
                    const material =
                        child.material as THREE.MeshStandardMaterial;
                    if (material.emissive) {
                        material.emissiveIntensity = 0.5;
                    }
                }
            });
        } else if (object.userData.type === 'black_hole') {
            // Scale up slightly on hover
            object.scale.set(1.2, 1.2, 1.2);
            // Show galaxy label on hover
            if (object.userData.label) {
                object.userData.label.visible = true;
            }
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
                    const material =
                        child.material as THREE.MeshStandardMaterial;
                    if (material.emissive) {
                        material.emissiveIntensity = 0.2;
                    }
                }
            });
        } else if (object.userData.type === 'black_hole') {
            // Reset scale
            object.scale.set(1, 1, 1);
            // Hide galaxy label when not hovering
            if (object.userData.label) {
                object.userData.label.visible = false;
            }
        } else if (object.userData.type === 'home_base') {
            // Reset wormhole
            object.scale.set(1, 1, 1);
            if (object.userData.glow) {
                object.userData.glow.material.opacity = 0.15;
            }
        }
    }

    /**
     * Set camera controller (for coordinating manual camera control)
     */
    setCameraController(controller: CameraController): void {
        this.cameraController = controller;
    }

    /**
     * Clean up event listeners
     */
    dispose(): void {
        this.domElement.removeEventListener('click', this.onClick.bind(this));
        this.domElement.removeEventListener(
            'mousemove',
            this.onMouseMove.bind(this),
        );
        this.domElement.removeEventListener(
            'mousedown',
            this.onMouseDown.bind(this),
        );
        this.domElement.removeEventListener(
            'mouseup',
            this.onMouseUp.bind(this),
        );
        this.domElement.removeEventListener(
            'mouseleave',
            this.onMouseUp.bind(this),
        );
        this.domElement.removeEventListener('wheel', this.onWheel.bind(this));

        if (this.hoveredObject) {
            this.resetHoverEffect(this.hoveredObject);
            this.hoveredObject = null;
        }
    }
}
