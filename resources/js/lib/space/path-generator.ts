import type { OrbitalPathSegment, Planet3D } from '@/types/space';
import * as THREE from 'three';
import {
    calculateGM,
    calculateGravityAssist,
    calculateHohmannTransfer,
    calculateInfluenceRadius,
    calculatePathLength,
} from './orbital-mechanics';
import { getPlanetMass } from './planet-manager';

/**
 * Path Generator for Multi-Planet Routes
 * Generates curved orbital paths with gravitational assists
 */

interface RouteWaypoint {
    type: 'home' | 'planet';
    position: THREE.Vector3;
    mass: number;
    gm: number;
    planet?: Planet3D;
}

/**
 * Find opportunities for gravitational assists along a path
 * Checks if the path passes near any massive bodies
 */
function findGravityAssistOpportunity(
    pathWaypoints: THREE.Vector3[],
    allWaypoints: RouteWaypoint[],
    currentSegmentIndex: number,
    galaxyCenters: Map<number, THREE.Vector3>,
    blackHoleMasses: Map<number, number>,
): OrbitalPathSegment['assistBody'] | undefined {
    // Check each point along the path
    for (const waypoint of pathWaypoints) {
        // Check black holes (most massive bodies)
        for (const [galaxyId, center] of galaxyCenters.entries()) {
            const mass = blackHoleMasses.get(galaxyId) || 1000;
            const distance = waypoint.distanceTo(center);
            const influenceRadius = calculateInfluenceRadius(mass, 80); // Galaxy orbit radius ~80

            if (distance < influenceRadius) {
                return {
                    position: center.clone(),
                    mass,
                    gm: calculateGM(mass),
                    influenceRadius,
                    speedMultiplier: 1.5, // Base multiplier
                };
            }
        }

        // Check planets in route (skip current start/end planets)
        for (let i = 0; i < allWaypoints.length; i++) {
            // Skip the current segment's start and end points
            if (
                i === currentSegmentIndex ||
                i === currentSegmentIndex + 1
            ) {
                continue;
            }

            const body = allWaypoints[i];
            if (body.type === 'planet' && body.planet) {
                const distance = waypoint.distanceTo(body.position);
                const mass = body.mass;
                const influenceRadius = calculateInfluenceRadius(mass, 15); // Planetary SOI

                if (distance < influenceRadius) {
                    return {
                        position: body.position.clone(),
                        mass,
                        gm: calculateGM(mass),
                        influenceRadius,
                        speedMultiplier: 1.2, // Smaller boost for planets
                    };
                }
            }
        }
    }

    return undefined;
}

/**
 * Determine the central body (galaxy center or origin) for a transfer between two points
 */
function determineCentralBody(
    startWaypoint: RouteWaypoint,
    endWaypoint: RouteWaypoint,
    galaxyCenters: Map<number, THREE.Vector3>,
    blackHoleMasses: Map<number, number>,
): { position: THREE.Vector3; gm: number } {
    // If both points are planets in the same galaxy, use galaxy center as central body
    if (
        startWaypoint.type === 'planet' &&
        endWaypoint.type === 'planet' &&
        startWaypoint.planet &&
        endWaypoint.planet
    ) {
        const startGalaxyId = startWaypoint.planet.galaxy_id;
        const endGalaxyId = endWaypoint.planet.galaxy_id;

        if (startGalaxyId === endGalaxyId) {
            // Same galaxy - use galaxy center (black hole)
            const center = galaxyCenters.get(startGalaxyId);
            const mass = blackHoleMasses.get(startGalaxyId) || 1000;
            if (center) {
                return {
                    position: center.clone(),
                    gm: calculateGM(mass),
                };
            }
        }
    }

    // Different galaxies or involving home base - use origin as central body
    return {
        position: new THREE.Vector3(0, 0, 0),
        gm: calculateGM(10000), // Very massive central body
    };
}

/**
 * Generate complete orbital path for a multi-planet route
 * Returns array of curved path segments from Home → P1 → P2 → ... → Home
 */
export function generateOrbitalPath(
    route: Planet3D[], // Ordered list of planets to visit
    homePos: THREE.Vector3,
    galaxyCenters: Map<number, THREE.Vector3>,
    blackHoleMasses: Map<number, number>,
): OrbitalPathSegment[] {
    const segments: OrbitalPathSegment[] = [];

    // Build complete route: Home → Planet1 → Planet2 → ... → Home
    const fullRoute: RouteWaypoint[] = [
        { type: 'home', position: homePos.clone(), mass: 0, gm: 0 },
        ...route.map((p) => ({
            type: 'planet' as const,
            position: new THREE.Vector3(
                p.position_x || 0,
                p.position_y || 0,
                p.position_z || 0,
            ),
            mass: p.mass || getPlanetMass(p.size),
            gm: p.gm || calculateGM(p.mass || getPlanetMass(p.size)),
            planet: p,
        })),
        { type: 'home', position: homePos.clone(), mass: 0, gm: 0 },
    ];

    // Generate segments between each pair of waypoints
    for (let i = 0; i < fullRoute.length - 1; i++) {
        const start = fullRoute[i];
        const end = fullRoute[i + 1];

        // Determine central body for this transfer
        const centralBody = determineCentralBody(
            start,
            end,
            galaxyCenters,
            blackHoleMasses,
        );

        // Calculate Hohmann transfer orbit
        const transfer = calculateHohmannTransfer(
            start.position,
            end.position,
            centralBody.position,
            centralBody.gm,
        );

        // Check for gravitational assists from nearby bodies
        const assistBody = findGravityAssistOpportunity(
            transfer.waypoints,
            fullRoute,
            i,
            galaxyCenters,
            blackHoleMasses,
        );

        // Calculate segment length (sum of distances between waypoints)
        const segmentLength = calculatePathLength(transfer.waypoints);

        // Determine segment type
        let segmentType: OrbitalPathSegment['type'] = 'transfer';
        if (assistBody) {
            segmentType = 'gravity_assist';
        } else if (i === 0) {
            segmentType = 'departure';
        } else if (i === fullRoute.length - 2) {
            segmentType = 'arrival';
        }

        segments.push({
            type: segmentType,
            startPos: start.position.clone(),
            endPos: end.position.clone(),
            semiMajorAxis: transfer.semiMajorAxis,
            eccentricity: transfer.eccentricity,
            periapsisDirection: transfer.periapsisDirection.clone(),
            waypoints: transfer.waypoints.map((wp) => wp.clone()),
            assistBody: assistBody
                ? {
                      ...assistBody,
                      position: assistBody.position.clone(),
                  }
                : undefined,
            segmentLength,
            baseSpeed: 1.0, // Will be scaled by mission type speed
        });
    }

    return segments;
}

/**
 * Check if a path needs recalculation based on how much planets have moved
 * Returns true if any destination planet has moved more than threshold distance
 */
export function shouldRecalculatePath(
    route: Planet3D[],
    existingSegments: OrbitalPathSegment[],
    threshold: number = 5, // Distance threshold for recalculation
): boolean {
    if (!existingSegments || existingSegments.length === 0) {
        return true;
    }

    // Check if planets have moved significantly from their expected positions
    for (let i = 0; i < route.length && i < existingSegments.length; i++) {
        const planet = route[i];
        const segment = existingSegments[i + 1]; // +1 because first segment is from home

        if (segment) {
            const currentPos = new THREE.Vector3(
                planet.position_x || 0,
                planet.position_y || 0,
                planet.position_z || 0,
            );

            const expectedPos = segment.endPos;
            const displacement = currentPos.distanceTo(expectedPos);

            // If planet has moved more than threshold, recalculate
            if (displacement > threshold) {
                return true;
            }
        }
    }

    return false;
}
