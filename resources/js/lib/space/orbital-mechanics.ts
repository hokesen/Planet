import * as THREE from 'three';

/**
 * Orbital Mechanics Physics Engine
 * Implements Keplerian orbital mechanics for rocket trajectories
 */

/**
 * Calculate gravitational parameter from mass
 */
export function calculateGM(mass: number): number {
    const G = 1.0; // Normalized gravitational constant
    return G * mass;
}

/**
 * Calculate sphere of influence radius for a body
 * Objects within this radius feel significant gravity from the body
 */
export function calculateInfluenceRadius(
    bodyMass: number,
    orbitRadius: number,
): number {
    // Sphere of influence approximation: SOI = a * (m/M)^(2/5)
    // Simplified for visual appeal
    return orbitRadius * Math.pow(bodyMass / 1000, 0.4);
}

/**
 * Calculate speed multiplier from gravitational assist
 * Returns value between 1.0 (no boost) and 2.5 (maximum boost)
 */
export function calculateGravityAssist(
    rocketPos: THREE.Vector3,
    bodyPos: THREE.Vector3,
    bodyMass: number,
    influenceRadius: number,
): number {
    const distance = rocketPos.distanceTo(bodyPos);

    // Outside influence radius - no assist
    if (distance > influenceRadius) {
        return 1.0;
    }

    // Calculate assist strength based on proximity
    // Closer = stronger assist (inversely proportional to distance)
    const proximityFactor = 1.0 - distance / influenceRadius;

    // Mass factor - more massive bodies give stronger assists
    const massFactor = Math.log10(bodyMass + 1) / 3.0; // Normalized

    // Speed multiplier: 1.0 (no boost) to 2.5 (max boost)
    const speedBoost = 1.0 + proximityFactor * massFactor * 1.5;

    return Math.min(speedBoost, 2.5);
}

/**
 * Calculate the true anomaly (angular position on orbit) for a given position
 */
function getTrueAnomaly(
    position: THREE.Vector3,
    center: THREE.Vector3,
    periapsisDirection: THREE.Vector3,
    semiMajorAxis: number,
    eccentricity: number,
): number {
    // Vector from center to position
    const posVec = new THREE.Vector3().subVectors(position, center);

    // Calculate angle from periapsis direction
    const angle = Math.atan2(
        posVec.dot(
            new THREE.Vector3().crossVectors(
                periapsisDirection,
                new THREE.Vector3(0, 1, 0),
            ),
        ),
        posVec.dot(periapsisDirection),
    );

    return angle;
}

/**
 * Sample points along an elliptical orbit
 * Returns array of waypoints from startPos to endPos along the ellipse
 */
export function sampleEllipticalOrbit(
    center: THREE.Vector3,
    semiMajorAxis: number,
    eccentricity: number,
    periapsisDirection: THREE.Vector3,
    startPos: THREE.Vector3,
    endPos: THREE.Vector3,
    numSamples: number = 64,
): THREE.Vector3[] {
    // Calculate semi-minor axis
    const semiMinorAxis =
        semiMajorAxis * Math.sqrt(1 - eccentricity * eccentricity);

    // Create perpendicular direction for the ellipse
    const up = new THREE.Vector3(0, 1, 0);
    let semiMinorDir = new THREE.Vector3().crossVectors(
        periapsisDirection,
        up,
    );

    // Handle case where periapsis is aligned with Y axis
    if (semiMinorDir.length() < 0.01) {
        semiMinorDir = new THREE.Vector3().crossVectors(
            periapsisDirection,
            new THREE.Vector3(1, 0, 0),
        );
    }
    semiMinorDir.normalize();

    // Calculate angular positions for start and end
    const startAngle = getTrueAnomaly(
        startPos,
        center,
        periapsisDirection,
        semiMajorAxis,
        eccentricity,
    );
    const endAngle = getTrueAnomaly(
        endPos,
        center,
        periapsisDirection,
        semiMajorAxis,
        eccentricity,
    );

    // Ensure we take the shorter arc
    let angleRange = endAngle - startAngle;
    if (angleRange > Math.PI) {
        angleRange -= 2 * Math.PI;
    } else if (angleRange < -Math.PI) {
        angleRange += 2 * Math.PI;
    }

    // Sample points between start and end angle
    const waypoints: THREE.Vector3[] = [];
    for (let i = 0; i <= numSamples; i++) {
        const t = i / numSamples;
        const angle = startAngle + t * angleRange;

        // Calculate radial distance using ellipse equation
        const r =
            (semiMajorAxis * (1 - eccentricity * eccentricity)) /
            (1 + eccentricity * Math.cos(angle));

        // Calculate position on ellipse
        const x = r * Math.cos(angle);
        const y = r * Math.sin(angle);

        // Transform to 3D space
        const point = new THREE.Vector3()
            .addScaledVector(periapsisDirection, x)
            .addScaledVector(semiMinorDir, y)
            .add(center);

        waypoints.push(point);
    }

    return waypoints;
}

/**
 * Calculate Hohmann transfer orbit between two positions
 * Returns orbital elements and sampled waypoints
 */
export function calculateHohmannTransfer(
    startPos: THREE.Vector3,
    endPos: THREE.Vector3,
    centralBody: THREE.Vector3,
    centralGM: number,
): {
    semiMajorAxis: number;
    eccentricity: number;
    periapsisDirection: THREE.Vector3;
    waypoints: THREE.Vector3[];
} {
    // Calculate orbital radii from central body
    const r1 = startPos.distanceTo(centralBody);
    const r2 = endPos.distanceTo(centralBody);

    // Semi-major axis of transfer ellipse (average of radii)
    const semiMajorAxis = (r1 + r2) / 2;

    // Eccentricity of transfer ellipse
    const eccentricity = Math.abs(r2 - r1) / (r2 + r1);

    // Direction to periapsis (closest approach)
    // For Hohmann transfer, periapsis is at the smaller radius
    let periapsisPos: THREE.Vector3;
    let apoapsisPos: THREE.Vector3;

    if (r1 < r2) {
        periapsisPos = startPos.clone();
        apoapsisPos = endPos.clone();
    } else {
        periapsisPos = endPos.clone();
        apoapsisPos = startPos.clone();
    }

    const periapsisDirection = new THREE.Vector3()
        .subVectors(periapsisPos, centralBody)
        .normalize();

    // Generate waypoints along the ellipse
    const waypoints = sampleEllipticalOrbit(
        centralBody,
        semiMajorAxis,
        eccentricity,
        periapsisDirection,
        startPos,
        endPos,
        64, // number of samples
    );

    return {
        semiMajorAxis,
        eccentricity,
        periapsisDirection,
        waypoints,
    };
}

/**
 * Calculate the arc length of a path defined by waypoints
 */
export function calculatePathLength(waypoints: THREE.Vector3[]): number {
    let length = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
        length += waypoints[i].distanceTo(waypoints[i + 1]);
    }
    return length;
}
