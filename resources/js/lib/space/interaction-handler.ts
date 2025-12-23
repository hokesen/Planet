import * as THREE from 'three';
import type { Mission3D, Planet3D } from '@/types/space';

export interface InteractionCallbacks {
    onRocketClick?: (mission: Mission3D) => void;
    onPlanetClick?: (planet: Planet3D) => void;
    onEmptySpaceClick?: () => void;
}

/**
 * Handles mouse interactions with the 3D scene using raycasting
 */
export class InteractionHandler {
    private raycaster: THREE.Raycaster;
    private mouse: THREE.Vector2;
    private hoveredObject: THREE.Object3D | null = null;

    constructor(
        private camera: THREE.Camera,
        private scene: THREE.Scene,
        private domElement: HTMLElement,
        private callbacks: InteractionCallbacks
    ) {
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Bind event listeners
        this.domElement.addEventListener('click', this.onClick.bind(this));
        this.domElement.addEventListener(
            'mousemove',
            this.onMouseMove.bind(this)
        );
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
                const { type, mission, planet } = clickedObject.userData;

                if (type === 'rocket' && mission && this.callbacks.onRocketClick) {
                    this.callbacks.onRocketClick(mission as Mission3D);
                } else if (
                    type === 'planet' &&
                    planet &&
                    this.callbacks.onPlanetClick
                ) {
                    this.callbacks.onPlanetClick(planet as Planet3D);
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
     * Handle mouse move events (for hover effects)
     */
    private onMouseMove(event: MouseEvent): void {
        this.updateMousePosition(event);
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
                this.domElement.style.cursor = 'default';
            }
        } else {
            this.domElement.style.cursor = 'default';
        }
    }

    /**
     * Find the interactable parent object (rocket or planet)
     */
    private findInteractableObject(
        object: THREE.Object3D
    ): THREE.Object3D | null {
        let current: THREE.Object3D | null = object;

        while (current) {
            if (
                current.userData.type === 'rocket' ||
                current.userData.type === 'planet'
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
        }
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

        if (this.hoveredObject) {
            this.resetHoverEffect(this.hoveredObject);
            this.hoveredObject = null;
        }
    }
}
