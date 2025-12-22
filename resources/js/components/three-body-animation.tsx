import { useEffect, useRef } from 'react';

export function ThreeBodyAnimation() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const updateSize = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
        };
        updateSize();
        window.addEventListener('resize', updateSize);

        const centerX = canvas.getBoundingClientRect().width / 2;
        const centerY = canvas.getBoundingClientRect().height / 2;

        // Three-body problem simulation with stable initial conditions
        const scale =
            Math.min(
                canvas.getBoundingClientRect().width,
                canvas.getBoundingClientRect().height,
            ) / 400;
        const orbitRadius = 70 * scale;

        const bodies = [
            {
                x: centerX,
                y: centerY - orbitRadius,
                vx: 0.6,
                vy: 0,
                mass: 1,
                color: '#3b82f6',
                radius: 12,
                trail: [] as { x: number; y: number }[],
            },
            {
                x: centerX + orbitRadius * Math.cos(Math.PI / 6),
                y: centerY + orbitRadius * Math.sin(Math.PI / 6),
                vx: -0.3,
                vy: -0.52,
                mass: 1,
                color: '#8b5cf6',
                radius: 12,
                trail: [] as { x: number; y: number }[],
            },
            {
                x: centerX - orbitRadius * Math.cos(Math.PI / 6),
                y: centerY + orbitRadius * Math.sin(Math.PI / 6),
                vx: -0.3,
                vy: 0.52,
                mass: 1,
                color: '#ec4899',
                radius: 12,
                trail: [] as { x: number; y: number }[],
            },
        ];

        const G = 150; // Gravitational constant
        const maxTrailLength = 250;
        const dt = 0.9; // Time step - smaller = more accurate but slower
        const softening = 5; // Prevents extreme forces at close distances

        const simulate = () => {
            // Calculate forces and update velocities
            for (let i = 0; i < bodies.length; i++) {
                let fx = 0;
                let fy = 0;

                // Gravitational forces between bodies
                for (let j = 0; j < bodies.length; j++) {
                    if (i !== j) {
                        const dx = bodies[j].x - bodies[i].x;
                        const dy = bodies[j].y - bodies[i].y;
                        const distSq =
                            dx * dx + dy * dy + softening * softening;
                        const dist = Math.sqrt(distSq);

                        const force =
                            (G * bodies[i].mass * bodies[j].mass) / distSq;
                        fx += (force * dx) / dist;
                        fy += (force * dy) / dist;
                    }
                }

                bodies[i].vx += (fx / bodies[i].mass) * dt;
                bodies[i].vy += (fy / bodies[i].mass) * dt;
            }

            // Update positions and trails
            for (const body of bodies) {
                body.x += body.vx * dt;
                body.y += body.vy * dt;

                // Add to trail
                body.trail.push({ x: body.x, y: body.y });
                if (body.trail.length > maxTrailLength) {
                    body.trail.shift();
                }
            }
        };

        const drawStickFigure = (
            ctx: CanvasRenderingContext2D,
            x: number,
            y: number,
            angle: number,
            scale: number,
        ) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);

            const size = scale * 0.2;

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 1;
            ctx.lineCap = 'round';

            // Head (shifted so feet are at origin)
            ctx.beginPath();
            ctx.arc(0, -size * 12, size * 2, 0, Math.PI * 2);
            ctx.stroke();

            // Body
            ctx.beginPath();
            ctx.moveTo(0, -size * 10);
            ctx.lineTo(0, -size * 4);
            ctx.stroke();

            // Arms
            ctx.beginPath();
            ctx.moveTo(-size * 3, -size * 8);
            ctx.lineTo(0, -size * 7);
            ctx.lineTo(size * 3, -size * 8);
            ctx.stroke();

            // Legs (feet at origin 0, 0)
            ctx.beginPath();
            ctx.moveTo(0, -size * 4);
            ctx.lineTo(-size * 2, 0);
            ctx.moveTo(0, -size * 4);
            ctx.lineTo(size * 2, 0);
            ctx.stroke();

            ctx.restore();
        };

        const draw = () => {
            const rect = canvas.getBoundingClientRect();
            ctx.clearRect(0, 0, rect.width, rect.height);

            // Draw trails
            for (const body of bodies) {
                if (body.trail.length > 1) {
                    ctx.strokeStyle = body.color;
                    ctx.lineWidth = 1.5;
                    ctx.globalAlpha = 0.15;

                    for (let i = 1; i < body.trail.length; i++) {
                        const alpha = i / body.trail.length;
                        ctx.globalAlpha = alpha * 0.2;
                        ctx.beginPath();
                        ctx.moveTo(body.trail[i - 1].x, body.trail[i - 1].y);
                        ctx.lineTo(body.trail[i].x, body.trail[i].y);
                        ctx.stroke();
                    }
                    ctx.globalAlpha = 1;
                }
            }

            // Draw bodies with glow effect
            for (let i = 0; i < bodies.length; i++) {
                const body = bodies[i];

                // Glow
                const gradient = ctx.createRadialGradient(
                    body.x,
                    body.y,
                    0,
                    body.x,
                    body.y,
                    body.radius * 2,
                );
                gradient.addColorStop(0, body.color + 'aa');
                gradient.addColorStop(0.5, body.color + '44');
                gradient.addColorStop(1, body.color + '00');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(body.x, body.y, body.radius * 2, 0, Math.PI * 2);
                ctx.fill();

                // Planet
                ctx.fillStyle = body.color;
                ctx.beginPath();
                ctx.arc(body.x, body.y, body.radius, 0, Math.PI * 2);
                ctx.fill();

                // Highlight
                const highlightGradient = ctx.createRadialGradient(
                    body.x - body.radius / 3,
                    body.y - body.radius / 3,
                    0,
                    body.x,
                    body.y,
                    body.radius,
                );
                highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
                highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
                highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

                ctx.fillStyle = highlightGradient;
                ctx.beginPath();
                ctx.arc(body.x, body.y, body.radius, 0, Math.PI * 2);
                ctx.fill();

                // Draw stick figure on the first planet (blue)
                if (i === 0) {
                    // Calculate angle from center to planet position
                    const angleFromCenter = Math.atan2(
                        body.y - centerY,
                        body.x - centerX,
                    );

                    // Position stick figure on surface pointing radially outward
                    const figureX =
                        body.x + Math.cos(angleFromCenter) * body.radius;
                    const figureY =
                        body.y + Math.sin(angleFromCenter) * body.radius;

                    // Rotate stick figure to align with radial direction (add PI/2 to make it stand upright)
                    const figureRotation = angleFromCenter + Math.PI / 2;

                    drawStickFigure(
                        ctx,
                        figureX,
                        figureY,
                        figureRotation,
                        body.radius,
                    );
                }
            }
        };

        let animationId: number;

        const animate = () => {
            simulate();
            draw();
            animationId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', updateSize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="h-full w-full"
            style={{ display: 'block' }}
        />
    );
}
