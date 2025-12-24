import type { Galaxy3D, RocketInstance } from '@/types/space';
import * as THREE from 'three';

export type CameraMode =
    | { type: 'wormhole' }
    | { type: 'galaxy'; galaxyId: number }
    | { type: 'mission'; missionId: number };

export interface CameraTarget {
    position: THREE.Vector3;
    lookAt: THREE.Vector3;
}

/**
 * Camera controller for managing different camera modes
 * Handles smooth transitions between wormhole, galaxy, and mission POV views
 * Supports manual camera control via drag rotation
 */
export class CameraController {
    private currentMode: CameraMode = { type: 'wormhole' };
    private targetPosition: THREE.Vector3;
    private targetLookAt: THREE.Vector3;
    private baseLerpSpeed: number = 2.0; // Base speed of camera transitions
    private lerpSpeed: number = 2.0; // Current lerp speed (adjusted by drag velocity)
    private minLerpSpeed: number = 2.0; // Minimum lerp speed
    private maxLerpSpeed: number = 10.0; // Maximum lerp speed for fast drags
    private manualControl: boolean = false; // Whether user is manually controlling camera
    private cameraAngle: number = 0; // Current horizontal camera angle (for wormhole/galaxy modes)
    private verticalAngle: number = 0; // Current vertical camera angle (pitch)
    private cameraDistance: number = 0; // Current camera distance
    private orbitCenter: THREE.Vector3 = new THREE.Vector3(0, 0, 0); // Center point for camera orbit

    constructor(
        private camera: THREE.PerspectiveCamera,
        private galaxies: Galaxy3D[],
        private getRocketByMissionId: (missionId: number) => RocketInstance | undefined,
        private getGalaxyCenters: () => Map<number, THREE.Vector3>,
    ) {
        // Initialize with wormhole view
        this.targetPosition = new THREE.Vector3(150, 80, 150);
        this.targetLookAt = new THREE.Vector3(0, -10, 0);

        // Calculate initial angle and distance
        this.cameraAngle = Math.atan2(
            this.camera.position.z,
            this.camera.position.x,
        );
        this.cameraDistance = Math.sqrt(
            this.camera.position.x ** 2 +
                this.camera.position.y ** 2 +
                this.camera.position.z ** 2,
        );
    }

    /**
     * Set the camera mode
     */
    setMode(mode: CameraMode): void {
        this.currentMode = mode;
        this.manualControl = false; // Reset manual control when changing modes
        this.updateTargets();
    }

    /**
     * Get the current camera mode
     */
    getMode(): CameraMode {
        return this.currentMode;
    }

    /**
     * Enable manual camera control (called when user drags)
     * Initializes angle and distance relative to current orbit center
     */
    enableManualControl(): void {
        if (!this.manualControl) {
            // First time entering manual control - calculate current angles and distance
            const relativePos = new THREE.Vector3()
                .subVectors(this.camera.position, this.orbitCenter);

            this.cameraAngle = Math.atan2(relativePos.z, relativePos.x);
            this.cameraDistance = relativePos.length();

            // Calculate and lock vertical angle
            const horizontalRadius = Math.sqrt(
                relativePos.x ** 2 + relativePos.z ** 2,
            );
            this.verticalAngle = Math.atan2(relativePos.y, horizontalRadius);
        }

        this.manualControl = true;
    }

    /**
     * Disable manual camera control (called when clicking objects or switching modes)
     */
    disableManualControl(): void {
        this.manualControl = false;
        // Reset lerp speed to base
        this.lerpSpeed = this.baseLerpSpeed;
    }

    /**
     * Update manual camera angle (called from InteractionHandler)
     * @param angle - New camera angle
     * @param dragVelocity - Optional drag velocity to adjust lerp speed
     */
    updateManualAngle(angle: number, dragVelocity?: number): void {
        this.cameraAngle = angle;

        // Adjust lerp speed based on drag velocity
        if (dragVelocity !== undefined) {
            // Map drag velocity to lerp speed (faster drag = faster camera)
            // dragVelocity is in pixels per frame, scale it appropriately
            const velocityFactor = Math.min(dragVelocity / 20, 1.0); // Normalize to 0-1
            this.lerpSpeed = this.minLerpSpeed + velocityFactor * (this.maxLerpSpeed - this.minLerpSpeed);
        }

        this.enableManualControl();
    }

    /**
     * Update manual camera distance (called from InteractionHandler)
     */
    updateManualDistance(distance: number): void {
        this.cameraDistance = distance;
        this.enableManualControl();
    }

    /**
     * Get camera angle for wormhole/galaxy modes
     */
    getCameraAngle(): number {
        return this.cameraAngle;
    }

    /**
     * Get camera distance for wormhole/galaxy modes
     */
    getCameraDistance(): number {
        return this.cameraDistance;
    }

    /**
     * Update target position and lookAt based on current mode
     */
    private updateTargets(): void {
        switch (this.currentMode.type) {
            case 'wormhole':
                this.orbitCenter.set(0, -10, 0);
                this.targetPosition.set(150, 80, 150);
                this.targetLookAt.set(0, -10, 0);
                break;

            case 'galaxy': {
                const galaxyCenters = this.getGalaxyCenters();
                const center = galaxyCenters.get(this.currentMode.galaxyId);

                if (center) {
                    // Set orbit center to galaxy center
                    this.orbitCenter.copy(center);

                    // Position camera above and offset from galaxy center
                    this.targetPosition.copy(center).add(new THREE.Vector3(80, 60, 80));
                    this.targetLookAt.copy(center);
                }
                break;
            }

            case 'mission': {
                const rocket = this.getRocketByMissionId(this.currentMode.missionId);

                if (rocket) {
                    // POV follows behind and above the rocket
                    // Will be updated continuously in update() method
                    const rocketPos = rocket.mesh.position.clone();

                    // Get rocket's forward direction (the direction it's flying)
                    const forward = new THREE.Vector3(0, 0, 1);
                    forward.applyQuaternion(rocket.mesh.quaternion);

                    // Position camera behind rocket (opposite of forward direction)
                    this.targetPosition.copy(rocketPos).sub(forward.multiplyScalar(25)).add(new THREE.Vector3(0, 12, 0));
                    this.targetLookAt.copy(rocketPos).add(forward.multiplyScalar(15)); // Look ahead of rocket
                }
                break;
            }
        }
    }

    /**
     * Update camera position (call this in animation loop)
     */
    update(deltaTime: number): void {
        // Update targets for mission mode (rocket is moving)
        if (this.currentMode.type === 'mission') {
            const rocket = this.getRocketByMissionId(this.currentMode.missionId);

            if (rocket) {
                const rocketPos = rocket.mesh.position.clone();

                // Get rocket's forward direction (the direction it's flying)
                const forward = new THREE.Vector3(0, 0, 1);
                forward.applyQuaternion(rocket.mesh.quaternion);

                // Update target to follow rocket smoothly
                this.targetPosition.copy(rocketPos).sub(forward.multiplyScalar(25)).add(new THREE.Vector3(0, 12, 0));
                this.targetLookAt.copy(rocketPos).add(forward.multiplyScalar(15));
            }
        } else if (this.currentMode.type === 'galaxy') {
            // Update galaxy center position (galaxies rotate)
            const galaxyCenters = this.getGalaxyCenters();
            const center = galaxyCenters.get(this.currentMode.galaxyId);

            if (center) {
                // Update orbit center
                this.orbitCenter.copy(center);

                // If manual control, use manual angle and distance relative to galaxy center
                if (this.manualControl) {
                    // Set target position relative to orbit center (galaxy center)
                    // Use stored vertical angle instead of recalculating
                    this.targetPosition.set(
                        this.orbitCenter.x + Math.cos(this.cameraAngle) * Math.cos(this.verticalAngle) * this.cameraDistance,
                        this.orbitCenter.y + Math.sin(this.verticalAngle) * this.cameraDistance,
                        this.orbitCenter.z + Math.sin(this.cameraAngle) * Math.cos(this.verticalAngle) * this.cameraDistance,
                    );
                } else {
                    // Auto position
                    this.targetPosition.copy(center).add(new THREE.Vector3(80, 60, 80));
                }
                this.targetLookAt.copy(center);
            }
        } else if (this.currentMode.type === 'wormhole') {
            // Wormhole mode with manual control support
            if (this.manualControl) {
                // Set target position relative to orbit center
                // Use stored vertical angle instead of recalculating
                this.targetPosition.set(
                    this.orbitCenter.x + Math.cos(this.cameraAngle) * Math.cos(this.verticalAngle) * this.cameraDistance,
                    this.orbitCenter.y + Math.sin(this.verticalAngle) * this.cameraDistance,
                    this.orbitCenter.z + Math.sin(this.cameraAngle) * Math.cos(this.verticalAngle) * this.cameraDistance,
                );
                this.targetLookAt.copy(this.orbitCenter);
            } else {
                // Auto position
                this.targetPosition.set(150, 80, 150);
                this.targetLookAt.set(0, -10, 0);
            }
        }

        // Smoothly interpolate camera position
        this.camera.position.lerp(this.targetPosition, this.lerpSpeed * deltaTime);

        // Smoothly interpolate lookAt point
        const currentLookAt = new THREE.Vector3();
        this.camera.getWorldDirection(currentLookAt);
        currentLookAt.multiplyScalar(100).add(this.camera.position);

        currentLookAt.lerp(this.targetLookAt, this.lerpSpeed * deltaTime);
        this.camera.lookAt(currentLookAt);
    }

    /**
     * Dispose of resources
     */
    dispose(): void {
        // Nothing to dispose currently
    }
}
