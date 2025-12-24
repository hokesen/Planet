/**
 * Simple 2D Perlin Noise implementation for procedural generation
 * Based on Ken Perlin's improved noise
 */
class PerlinNoise {
    private permutation: number[];
    private p: number[];

    constructor(seed: number = Math.random()) {
        // Generate permutation table based on seed
        this.permutation = [];
        for (let i = 0; i < 256; i++) {
            this.permutation[i] = i;
        }

        // Shuffle using seed
        const random = this.seededRandom(seed);
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [this.permutation[i], this.permutation[j]] = [
                this.permutation[j],
                this.permutation[i],
            ];
        }

        // Duplicate permutation array
        this.p = new Array(512);
        for (let i = 0; i < 512; i++) {
            this.p[i] = this.permutation[i % 256];
        }
    }

    private seededRandom(seed: number): () => number {
        let s = seed;
        return () => {
            s = Math.sin(s) * 10000;
            return s - Math.floor(s);
        };
    }

    private fade(t: number): number {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    private lerp(t: number, a: number, b: number): number {
        return a + t * (b - a);
    }

    private grad(hash: number, x: number, y: number): number {
        const h = hash & 3;
        const u = h < 2 ? x : y;
        const v = h < 2 ? y : x;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    noise(x: number, y: number): number {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;

        x -= Math.floor(x);
        y -= Math.floor(y);

        const u = this.fade(x);
        const v = this.fade(y);

        const a = this.p[X] + Y;
        const aa = this.p[a];
        const ab = this.p[a + 1];
        const b = this.p[X + 1] + Y;
        const ba = this.p[b];
        const bb = this.p[b + 1];

        return this.lerp(
            v,
            this.lerp(
                u,
                this.grad(this.p[aa], x, y),
                this.grad(this.p[ba], x - 1, y),
            ),
            this.lerp(
                u,
                this.grad(this.p[ab], x, y - 1),
                this.grad(this.p[bb], x - 1, y - 1),
            ),
        );
    }
}

/**
 * Multi-octave noise for more natural terrain
 */
function octaveNoise(
    noise: PerlinNoise,
    x: number,
    y: number,
    octaves: number,
    persistence: number,
): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
        total += noise.noise(x * frequency, y * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= persistence;
        frequency *= 2;
    }

    return total / maxValue;
}

/**
 * Color for different terrain types
 */
interface TerrainColor {
    r: number;
    g: number;
    b: number;
}

/**
 * Generate randomized terrain colors based on planet seed
 */
function generateTerrainColors(seed: number) {
    const random = (s: number) => {
        const x = Math.sin(s) * 10000;
        return x - Math.floor(x);
    };

    // Randomize ocean hue (blue to teal to purple)
    const oceanHue = random(seed * 1.1);
    const oceanR = Math.floor(15 + oceanHue * 40);
    const oceanG = Math.floor(50 + oceanHue * 80);
    const oceanB = Math.floor(90 + random(seed * 1.2) * 100);

    // Randomize land hue (green to orange to red)
    const landHue = random(seed * 2.3);
    const landR = Math.floor(60 + landHue * 80);
    const landG = Math.floor(100 + landHue * 60);
    const landB = Math.floor(30 + landHue * 50);

    // Dramatically randomize ice caps - create truly alien variations
    const iceColorType = random(seed * 3.7);
    let iceR, iceG, iceB;

    if (iceColorType < 0.15) {
        // Pure white ice caps (like Earth)
        iceR = Math.floor(250 + random(seed * 3.71) * 5);
        iceG = Math.floor(250 + random(seed * 3.72) * 5);
        iceB = Math.floor(250 + random(seed * 3.73) * 5);
    } else if (iceColorType < 0.3) {
        // Deep blue ice caps (frozen nitrogen)
        iceR = Math.floor(150 + random(seed * 3.74) * 50);
        iceG = Math.floor(180 + random(seed * 3.75) * 40);
        iceB = Math.floor(240 + random(seed * 3.76) * 15);
    } else if (iceColorType < 0.45) {
        // Pink/magenta ice caps (frozen methane)
        iceR = Math.floor(240 + random(seed * 3.77) * 15);
        iceG = Math.floor(180 + random(seed * 3.78) * 40);
        iceB = Math.floor(230 + random(seed * 3.79) * 25);
    } else if (iceColorType < 0.6) {
        // Amber/orange ice caps (sulfur deposits)
        iceR = Math.floor(240 + random(seed * 3.8) * 15);
        iceG = Math.floor(200 + random(seed * 3.81) * 40);
        iceB = Math.floor(140 + random(seed * 3.82) * 50);
    } else if (iceColorType < 0.75) {
        // Mint/cyan ice caps (frozen ammonia)
        iceR = Math.floor(180 + random(seed * 3.83) * 40);
        iceG = Math.floor(240 + random(seed * 3.84) * 15);
        iceB = Math.floor(220 + random(seed * 3.85) * 35);
    } else if (iceColorType < 0.9) {
        // Purple/violet ice caps (exotic compounds)
        iceR = Math.floor(200 + random(seed * 3.86) * 40);
        iceG = Math.floor(170 + random(seed * 3.87) * 50);
        iceB = Math.floor(240 + random(seed * 3.88) * 15);
    } else {
        // Pale green ice caps (chlorine ice)
        iceR = Math.floor(190 + random(seed * 3.89) * 40);
        iceG = Math.floor(240 + random(seed * 3.9) * 15);
        iceB = Math.floor(190 + random(seed * 3.91) * 40);
    }

    return {
        deepOcean: { r: oceanR, g: oceanG, b: oceanB },
        ocean: { r: oceanR + 15, g: oceanG + 30, b: oceanB + 60 },
        shallowOcean: { r: oceanR + 35, g: oceanG + 70, b: oceanB + 90 },
        beach: {
            r: 194 + random(seed * 4.1) * 40,
            g: 178 + random(seed * 4.2) * 40,
            b: 128 + random(seed * 4.3) * 40,
        },
        lowland: { r: landR, g: landG, b: landB },
        highland: { r: landR + 20, g: landG + 20, b: landB + 10 },
        mountain: { r: 120, g: 110, b: 100 },
        snowCap: { r: iceR, g: iceG, b: iceB },
    };
}

/**
 * Interpolate between two colors
 */
function lerpColor(
    color1: TerrainColor,
    color2: TerrainColor,
    t: number,
): TerrainColor {
    return {
        r: Math.floor(color1.r + (color2.r - color1.r) * t),
        g: Math.floor(color1.g + (color2.g - color1.g) * t),
        b: Math.floor(color1.b + (color2.b - color1.b) * t),
    };
}

/**
 * Get terrain color based on height, latitude, and noise for jagged ice caps
 */
function getTerrainColor(
    height: number,
    latitude: number,
    terrainColors: ReturnType<typeof generateTerrainColors>,
    jaggedNoise: number,
    iceCapSize: number,
    iceCapAsymmetry: number,
    spiralNoise: number,
    patchNoise: number,
): TerrainColor {
    // Ice caps at poles with much more dramatic variation
    const polarDistance = Math.abs(latitude);

    // Ice cap size varies dramatically per planet (0.75 = huge caps, 0.95 = tiny caps)
    // Range reduced by 2x - ice caps are now smaller
    const baseThreshold = 0.75 + iceCapSize * 0.2;

    // Asymmetric ice caps (north vs south poles can be different sizes)
    const asymmetryFactor =
        latitude > 0 ? 1 + iceCapAsymmetry * 0.3 : 1 - iceCapAsymmetry * 0.3;

    // Complex shape using multiple noise layers
    const jaggedBoundary = jaggedNoise * 0.2; // Jagged edges
    const spiralEffect = spiralNoise * 0.1; // Spiral patterns
    const patchEffect = patchNoise > 0.6 ? 0.05 : 0; // Random patches

    const iceCapThreshold =
        (baseThreshold + jaggedBoundary + spiralEffect + patchEffect) *
        asymmetryFactor;

    if (polarDistance > iceCapThreshold && height > 0.3) {
        return terrainColors.snowCap;
    }

    // Height-based terrain
    if (height < 0.3) {
        return terrainColors.deepOcean;
    } else if (height < 0.4) {
        const t = (height - 0.3) / 0.1;
        return lerpColor(terrainColors.deepOcean, terrainColors.ocean, t);
    } else if (height < 0.45) {
        const t = (height - 0.4) / 0.05;
        return lerpColor(terrainColors.ocean, terrainColors.shallowOcean, t);
    } else if (height < 0.48) {
        const t = (height - 0.45) / 0.03;
        return lerpColor(terrainColors.shallowOcean, terrainColors.beach, t);
    } else if (height < 0.6) {
        const t = (height - 0.48) / 0.12;
        return lerpColor(terrainColors.beach, terrainColors.lowland, t);
    } else if (height < 0.75) {
        const t = (height - 0.6) / 0.15;
        return lerpColor(terrainColors.lowland, terrainColors.highland, t);
    } else if (height < 0.85) {
        const t = (height - 0.75) / 0.1;
        return lerpColor(terrainColors.highland, terrainColors.mountain, t);
    } else {
        const t = (height - 0.85) / 0.15;
        return lerpColor(terrainColors.mountain, terrainColors.snowCap, t);
    }
}

/**
 * Generate procedural planet texture
 */
export function generatePlanetTexture(
    size: number = 512,
    seed?: number,
): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Use planet ID or random seed
    const planetSeed = seed !== undefined ? seed : Math.random();
    const noise = new PerlinNoise(planetSeed);

    // Generate randomized terrain colors for this planet
    const terrainColors = generateTerrainColors(planetSeed);

    // Generate random ice cap parameters per planet
    const random = (s: number) => {
        const x = Math.sin(s) * 10000;
        return x - Math.floor(x);
    };
    const iceCapSize = random(planetSeed * 5.1); // 0-1, controls overall ice cap size
    const iceCapAsymmetry = random(planetSeed * 5.2); // 0-1, controls north/south asymmetry

    // Random rotation angles for more continent variety
    const rotationX = random(planetSeed * 5.3) * Math.PI * 2;
    const rotationY = random(planetSeed * 5.4) * Math.PI * 2;
    const rotationZ = random(planetSeed * 5.5) * Math.PI * 2;

    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    // Generate texture using spherical mapping
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            // Convert to spherical coordinates
            const u = x / size;
            const v = y / size;

            // Latitude and longitude
            const lat = (v - 0.5) * Math.PI; // -π/2 to π/2
            const lon = u * Math.PI * 2; // 0 to 2π

            // Spherical to 3D coordinates
            let sx = Math.cos(lat) * Math.cos(lon);
            let sy = Math.cos(lat) * Math.sin(lon);
            let sz = Math.sin(lat);

            // Apply random rotation for more continent variety
            // Rotation around X axis
            let tempY = sy * Math.cos(rotationX) - sz * Math.sin(rotationX);
            let tempZ = sy * Math.sin(rotationX) + sz * Math.cos(rotationX);
            sy = tempY;
            sz = tempZ;

            // Rotation around Y axis
            let tempX = sx * Math.cos(rotationY) + sz * Math.sin(rotationY);
            tempZ = -sx * Math.sin(rotationY) + sz * Math.cos(rotationY);
            sx = tempX;
            sz = tempZ;

            // Rotation around Z axis
            tempX = sx * Math.cos(rotationZ) - sy * Math.sin(rotationZ);
            tempY = sx * Math.sin(rotationZ) + sy * Math.cos(rotationZ);
            sx = tempX;
            sy = tempY;

            // Sample noise in 3D space (project to 2D)
            const scale = 4;
            const height = octaveNoise(noise, sx * scale, sy * scale, 6, 0.5);

            // Normalize height to 0-1
            const normalizedHeight = (height + 1) / 2;

            // Calculate latitude for ice caps (-1 to 1)
            const latitude = Math.sin(lat);

            // Generate multiple noise layers for complex ice cap shapes
            const jaggedNoise = octaveNoise(noise, lon * 8, lat * 8, 3, 0.5);
            const spiralNoise = octaveNoise(
                noise,
                lon * 12 + lat * 6,
                lat * 12,
                4,
                0.6,
            );
            const patchNoise = octaveNoise(noise, lon * 16, lat * 16, 2, 0.4);

            // Get terrain color with enhanced ice cap parameters
            const color = getTerrainColor(
                normalizedHeight,
                latitude,
                terrainColors,
                jaggedNoise,
                iceCapSize,
                iceCapAsymmetry,
                spiralNoise,
                patchNoise,
            );

            // Add slight variation for texture
            const variation = octaveNoise(noise, sx * 20, sy * 20, 2, 0.3) * 10;

            const index = (y * size + x) * 4;
            data[index] = Math.min(255, Math.max(0, color.r + variation));
            data[index + 1] = Math.min(255, Math.max(0, color.g + variation));
            data[index + 2] = Math.min(255, Math.max(0, color.b + variation));
            data[index + 3] = 255; // Alpha
        }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

/**
 * Cache for generated textures to avoid regenerating
 */
const textureCache = new Map<number, HTMLCanvasElement>();

/**
 * Get or generate planet texture (cached)
 */
export function getPlanetTexture(planetId: number): HTMLCanvasElement {
    if (!textureCache.has(planetId)) {
        const texture = generatePlanetTexture(512, planetId);
        textureCache.set(planetId, texture);
    }
    return textureCache.get(planetId)!;
}

/**
 * Clear texture cache (useful for cleanup)
 */
export function clearTextureCache(): void {
    textureCache.clear();
}
