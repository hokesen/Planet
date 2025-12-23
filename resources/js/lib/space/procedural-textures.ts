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
            this.lerp(u, this.grad(this.p[aa], x, y), this.grad(this.p[ba], x - 1, y)),
            this.lerp(
                u,
                this.grad(this.p[ab], x, y - 1),
                this.grad(this.p[bb], x - 1, y - 1)
            )
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
    persistence: number
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

const TERRAIN_COLORS = {
    deepOcean: { r: 15, g: 50, b: 90 },      // Deep blue
    ocean: { r: 30, g: 80, b: 150 },         // Ocean blue
    shallowOcean: { r: 50, g: 120, b: 180 }, // Light blue
    beach: { r: 194, g: 178, b: 128 },       // Sandy
    lowland: { r: 80, g: 140, b: 60 },       // Green
    highland: { r: 100, g: 120, b: 70 },     // Dark green
    mountain: { r: 120, g: 110, b: 100 },    // Brown/gray
    snowCap: { r: 240, g: 245, b: 250 },     // White/ice
};

/**
 * Interpolate between two colors
 */
function lerpColor(color1: TerrainColor, color2: TerrainColor, t: number): TerrainColor {
    return {
        r: Math.floor(color1.r + (color2.r - color1.r) * t),
        g: Math.floor(color1.g + (color2.g - color1.g) * t),
        b: Math.floor(color1.b + (color2.b - color1.b) * t),
    };
}

/**
 * Get terrain color based on height and latitude
 */
function getTerrainColor(height: number, latitude: number): TerrainColor {
    // Ice caps at poles (latitude close to 1 or -1)
    const polarDistance = Math.abs(latitude);
    if (polarDistance > 0.8 && height > 0.3) {
        return TERRAIN_COLORS.snowCap;
    }

    // Height-based terrain
    if (height < 0.3) {
        return TERRAIN_COLORS.deepOcean;
    } else if (height < 0.4) {
        const t = (height - 0.3) / 0.1;
        return lerpColor(TERRAIN_COLORS.deepOcean, TERRAIN_COLORS.ocean, t);
    } else if (height < 0.45) {
        const t = (height - 0.4) / 0.05;
        return lerpColor(TERRAIN_COLORS.ocean, TERRAIN_COLORS.shallowOcean, t);
    } else if (height < 0.48) {
        const t = (height - 0.45) / 0.03;
        return lerpColor(TERRAIN_COLORS.shallowOcean, TERRAIN_COLORS.beach, t);
    } else if (height < 0.6) {
        const t = (height - 0.48) / 0.12;
        return lerpColor(TERRAIN_COLORS.beach, TERRAIN_COLORS.lowland, t);
    } else if (height < 0.75) {
        const t = (height - 0.6) / 0.15;
        return lerpColor(TERRAIN_COLORS.lowland, TERRAIN_COLORS.highland, t);
    } else if (height < 0.85) {
        const t = (height - 0.75) / 0.1;
        return lerpColor(TERRAIN_COLORS.highland, TERRAIN_COLORS.mountain, t);
    } else {
        const t = (height - 0.85) / 0.15;
        return lerpColor(TERRAIN_COLORS.mountain, TERRAIN_COLORS.snowCap, t);
    }
}

/**
 * Generate procedural planet texture
 */
export function generatePlanetTexture(
    size: number = 512,
    seed?: number
): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Use planet ID or random seed
    const planetSeed = seed !== undefined ? seed : Math.random();
    const noise = new PerlinNoise(planetSeed);

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
            const lon = u * Math.PI * 2;     // 0 to 2π

            // Spherical to 3D coordinates
            const sx = Math.cos(lat) * Math.cos(lon);
            const sy = Math.cos(lat) * Math.sin(lon);
            const sz = Math.sin(lat);

            // Sample noise in 3D space (project to 2D)
            const scale = 4;
            const height = octaveNoise(
                noise,
                sx * scale,
                sy * scale,
                6,
                0.5
            );

            // Normalize height to 0-1
            const normalizedHeight = (height + 1) / 2;

            // Calculate latitude for ice caps (-1 to 1)
            const latitude = Math.sin(lat);

            // Get terrain color
            const color = getTerrainColor(normalizedHeight, latitude);

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
