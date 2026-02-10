import React, { useRef, useEffect, useState, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  life: number;
  maxLife: number;
}

interface GlowPoint {
  x: number;
  y: number;
  size: number;
  opacity: number;
  color: string;
}

const InteractiveCosmicBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const glowPointsRef = useRef<GlowPoint[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize canvas and particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };

    resizeCanvas();

    // Create initial particles
    const createParticles = () => {
      const newParticles: Particle[] = [];
      for (let i = 0; i < 80; i++) {
        newParticles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.6 + 0.2,
          color: ["#00ffff", "#ff00d4", "#00ff9d", "#ff9900", "#7000ff"][
            Math.floor(Math.random() * 5)
          ],
          life: 255,
          maxLife: 255,
        });
      }
      particlesRef.current = newParticles;
    };

    createParticles();

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.targetX = e.clientX - rect.left;
      mouseRef.current.targetY = e.clientY - rect.top;
    };

    // Animation loop
    const animate = () => {
      // Clear canvas with fade effect
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw gradient background
      const gradient = ctx.createRadialGradient(
        mouseRef.current.x,
        mouseRef.current.y,
        0,
        mouseRef.current.x,
        mouseRef.current.y,
        Math.max(canvas.width, canvas.height),
      );
      gradient.addColorStop(0, "rgba(0, 255, 255, 0.05)");
      gradient.addColorStop(0.3, "rgba(112, 0, 255, 0.03)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Smooth mouse position
      mouseRef.current.x +=
        (mouseRef.current.targetX - mouseRef.current.x) * 0.1;
      mouseRef.current.y +=
        (mouseRef.current.targetY - mouseRef.current.y) * 0.1;

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.995;
        particle.vy *= 0.995;

        // Pull towards mouse
        const dx = mouseRef.current.x - particle.x;
        const dy = mouseRef.current.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 200) {
          const force = (200 - distance) / 200;
          particle.vx += (dx / distance) * force * 0.02;
          particle.vy += (dy / distance) * force * 0.02;
          particle.opacity = Math.min(1, particle.opacity + 0.05);
        } else {
          particle.opacity = Math.max(0.1, particle.opacity - 0.01);
        }

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.opacity * 0.7;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        // Draw glow around particle
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.opacity * 0.2;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
        ctx.fill();

        return true;
      });

      ctx.globalAlpha = 1;

      // Draw glow at mouse position
      const mouseGlowGradient = ctx.createRadialGradient(
        mouseRef.current.x,
        mouseRef.current.y,
        0,
        mouseRef.current.x,
        mouseRef.current.y,
        150,
      );
      mouseGlowGradient.addColorStop(0, "rgba(0, 255, 255, 0.15)");
      mouseGlowGradient.addColorStop(0.5, "rgba(255, 0, 212, 0.05)");
      mouseGlowGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = mouseGlowGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Spawn new particles occasionally
      if (Math.random() < 0.3 && particlesRef.current.length < 100) {
        particlesRef.current.push({
          x: mouseRef.current.x + (Math.random() - 0.5) * 40,
          y: mouseRef.current.y + (Math.random() - 0.5) * 40,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 1.5 + 0.5,
          opacity: 0,
          color: ["#00ffff", "#ff00d4", "#00ff9d", "#ff9900", "#7000ff"][
            Math.floor(Math.random() * 5)
          ],
          life: 255,
          maxLife: 255,
        });
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Draw animated grid lines for extra visual interest
    const drawGrid = () => {
      ctx.strokeStyle = "rgba(0, 255, 255, 0.05)";
      ctx.lineWidth = 1;

      const gridSize = 100;
      const offsetX = (Math.sin(Date.now() * 0.0001) * 20) % gridSize;
      const offsetY = (Math.cos(Date.now() * 0.0001) * 20) % gridSize;

      for (let x = offsetX; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      for (let y = offsetY; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    };

    // Start animation
    animate();

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", resizeCanvas);

    setIsInitialized(true);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden bg-black -z-10"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none" />

      {/* Radial gradient overlay for depth */}
      <div
        className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-20"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(0, 255, 255, 0.1) 0%, transparent 70%)",
        }}
      />
    </div>
  );
};

export default InteractiveCosmicBackground;
