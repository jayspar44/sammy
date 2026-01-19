import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Lightweight canvas-based confetti animation.
 * Triggers a burst of confetti particles when `trigger` becomes true.
 * Renders via portal to ensure it's above all other content.
 */
// Default colors defined outside component to avoid recreating on each render
const DEFAULT_COLORS = ['#818cf8', '#fbbf24', '#ffffff', '#a78bfa', '#f472b6']; // indigo, yellow, white, violet, pink

const ConfettiCanvas = ({
    trigger,
    duration = 2500,
    particleCount = 60,
    colors = DEFAULT_COLORS,
    onComplete,
}) => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const hasTriggeredRef = useRef(false);

    useEffect(() => {
        // Only trigger once per trigger=true, reset when trigger becomes false
        if (!trigger) {
            hasTriggeredRef.current = false;
            return;
        }

        // Already triggered for this cycle, don't re-trigger
        if (hasTriggeredRef.current) return;
        hasTriggeredRef.current = true;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Set canvas size
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Create particles
        const particles = Array.from({ length: particleCount }, () => {
            const x = canvas.width / 2 + (Math.random() - 0.5) * 100;
            const y = canvas.height * 0.6;

            return {
                x,
                y,
                vx: (Math.random() - 0.5) * 15,
                vy: -Math.random() * 20 - 10,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 8 + 4,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10,
                shape: Math.random() > 0.5 ? 'rect' : 'circle',
            };
        });

        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;

            if (elapsed > duration) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                if (onComplete) onComplete();
                return;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((particle) => {
                // Update physics
                particle.vy += 0.5; // gravity
                particle.vx *= 0.99; // air resistance
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.rotation += particle.rotationSpeed;

                // Draw particle
                ctx.save();
                ctx.translate(particle.x, particle.y);
                ctx.rotate((particle.rotation * Math.PI) / 180);
                ctx.fillStyle = particle.color;

                if (particle.shape === 'rect') {
                    ctx.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
                } else {
                    ctx.beginPath();
                    ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.restore();
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        // Start animation
        animate();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    // Only depend on trigger - other props are read at trigger time
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trigger]);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            const canvas = canvasRef.current;
            if (canvas) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!trigger) return null;

    return createPortal(
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-[9999] pointer-events-none"
            style={{ width: '100vw', height: '100vh' }}
        />,
        document.body
    );
};

export default ConfettiCanvas;
