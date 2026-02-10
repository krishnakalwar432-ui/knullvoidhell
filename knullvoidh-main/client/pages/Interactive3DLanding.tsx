import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';

interface ParticleSystem {
  particles: Particle[];
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
}

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  opacity: number;
  color: string;
  rotationSpeed: number;
  rotation: number;
}

interface FloatingObject {
  x: number;
  y: number;
  z: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  size: number;
  color: string;
  glowIntensity: number;
  hovered: boolean;
  type: 'sphere' | 'cube' | 'pyramid';
}

const Interactive3DLanding: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleSystemRef = useRef<ParticleSystem>({ particles: [], canvas: null, ctx: null });
  const animationFrameRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0 });
  const scrollRef = useRef(0);
  
  const [floatingObjects, setFloatingObjects] = useState<FloatingObject[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize particle system
  const initParticleSystem = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    particleSystemRef.current = { particles: [], canvas, ctx };

    // Create particles
    const numParticles = 150;
    for (let i = 0; i < numParticles; i++) {
      particleSystemRef.current.particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random() * 1000,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        vz: (Math.random() - 0.5) * 2,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.8 + 0.2,
        color: ['#00f2ff', '#ff00d4', '#00ff9d', '#ff9900'][Math.floor(Math.random() * 4)],
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        rotation: 0
      });
    }

    // Create floating objects
    const objects: FloatingObject[] = [];
    for (let i = 0; i < 8; i++) {
      objects.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random() * 500 + 100,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        size: Math.random() * 40 + 20,
        color: ['#00f2ff', '#ff00d4', '#00ff9d', '#ff9900'][Math.floor(Math.random() * 4)],
        glowIntensity: 0.5,
        hovered: false,
        type: ['sphere', 'cube', 'pyramid'][Math.floor(Math.random() * 3)] as 'sphere' | 'cube' | 'pyramid'
      });
    }
    setFloatingObjects(objects);
  }, []);

  // Draw 3D objects
  const draw3DObject = useCallback((ctx: CanvasRenderingContext2D, obj: FloatingObject) => {
    const { x, y, z, size, color, glowIntensity, type, rotationX, rotationY, rotationZ } = obj;
    
    // Calculate perspective
    const perspective = 800;
    const scale = perspective / (perspective + z);
    const screenX = x * scale + mouseRef.current.x * 0.1;
    const screenY = y * scale + mouseRef.current.y * 0.1;
    const screenSize = size * scale;

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(rotationZ);

    // Glow effect
    if (glowIntensity > 0) {
      const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, screenSize * 2);
      glowGradient.addColorStop(0, `${color}${Math.floor(glowIntensity * 255).toString(16).padStart(2, '0')}`);
      glowGradient.addColorStop(0.5, `${color}30`);
      glowGradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(0, 0, screenSize * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw shape
    ctx.fillStyle = color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    switch (type) {
      case 'sphere':
        // 3D sphere effect
        const sphereGradient = ctx.createRadialGradient(-screenSize * 0.3, -screenSize * 0.3, 0, 0, 0, screenSize);
        sphereGradient.addColorStop(0, '#ffffff');
        sphereGradient.addColorStop(0.3, color);
        sphereGradient.addColorStop(1, '#000000');
        ctx.fillStyle = sphereGradient;
        ctx.beginPath();
        ctx.arc(0, 0, screenSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;

      case 'cube':
        // 3D cube with perspective
        const cubeSize = screenSize;
        ctx.fillStyle = color;
        ctx.fillRect(-cubeSize/2, -cubeSize/2, cubeSize, cubeSize);
        ctx.strokeRect(-cubeSize/2, -cubeSize/2, cubeSize, cubeSize);
        
        // Add 3D depth lines
        ctx.strokeStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-cubeSize/2, -cubeSize/2);
        ctx.lineTo(-cubeSize/2 + 10, -cubeSize/2 - 10);
        ctx.moveTo(cubeSize/2, -cubeSize/2);
        ctx.lineTo(cubeSize/2 + 10, -cubeSize/2 - 10);
        ctx.moveTo(cubeSize/2, cubeSize/2);
        ctx.lineTo(cubeSize/2 + 10, cubeSize/2 - 10);
        ctx.moveTo(-cubeSize/2, cubeSize/2);
        ctx.lineTo(-cubeSize/2 + 10, cubeSize/2 - 10);
        ctx.stroke();
        break;

      case 'pyramid':
        // 3D pyramid
        ctx.beginPath();
        ctx.moveTo(0, -screenSize);
        ctx.lineTo(-screenSize, screenSize);
        ctx.lineTo(screenSize, screenSize);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Add 3D lines
        ctx.beginPath();
        ctx.moveTo(0, -screenSize);
        ctx.lineTo(10, -screenSize + 10);
        ctx.stroke();
        break;
    }

    ctx.restore();
  }, []);

  // Animation loop
  const animate = useCallback(() => {
    const { canvas, ctx, particles } = particleSystemRef.current;
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add gradient overlay
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, 'rgba(26, 26, 26, 0.8)');
    gradient.addColorStop(0.5, 'rgba(18, 18, 18, 0.9)');
    gradient.addColorStop(1, 'rgba(10, 10, 10, 1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update and draw particles
    particles.forEach(particle => {
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.z += particle.vz;
      particle.rotation += particle.rotationSpeed;

      // Wrap around screen
      if (particle.x < 0) particle.x = canvas.width;
      if (particle.x > canvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = canvas.height;
      if (particle.y > canvas.height) particle.y = 0;
      if (particle.z < 0) particle.z = 1000;
      if (particle.z > 1000) particle.z = 0;

      // Calculate perspective
      const perspective = 800;
      const scale = perspective / (perspective + particle.z);
      const screenX = particle.x * scale;
      const screenY = particle.y * scale;
      const screenSize = particle.size * scale;

      // Draw particle
      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.rotate(particle.rotation);
      ctx.globalAlpha = particle.opacity * scale;
      
      const particleGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, screenSize * 2);
      particleGradient.addColorStop(0, particle.color);
      particleGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = particleGradient;
      
      ctx.beginPath();
      ctx.arc(0, 0, screenSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Update and draw floating objects
    setFloatingObjects(prev => prev.map(obj => {
      const updated = { ...obj };
      
      // Rotate objects
      updated.rotationX += 0.01;
      updated.rotationY += 0.015;
      updated.rotationZ += 0.008;
      
      // Mouse interaction
      const mouseDistance = Math.sqrt(
        Math.pow(mouseRef.current.x - obj.x, 2) + 
        Math.pow(mouseRef.current.y - obj.y, 2)
      );
      
      if (mouseDistance < 100) {
        updated.glowIntensity = Math.min(1, updated.glowIntensity + 0.05);
        updated.hovered = true;
      } else {
        updated.glowIntensity = Math.max(0.3, updated.glowIntensity - 0.02);
        updated.hovered = false;
      }

      draw3DObject(ctx, updated);
      return updated;
    }));

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [draw3DObject]);

  // Mouse movement handler
  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseRef.current = {
      x: e.clientX - window.innerWidth / 2,
      y: e.clientY - window.innerHeight / 2
    };
  }, []);

  // Scroll handler
  const handleScroll = useCallback(() => {
    scrollRef.current = window.scrollY;
  }, []);

  // Window resize handler
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  }, []);

  useEffect(() => {
    initParticleSystem();
    animate();
    setIsLoaded(true);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [initParticleSystem, animate, handleMouseMove, handleScroll, handleResize]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* 3D Canvas Background */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0"
        style={{ background: 'linear-gradient(45deg, #0a0a0a, #1a1a1a)' }}
      />

      {/* Overlay gradient */}
      <div className="fixed inset-0 z-10 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none" />

      {/* Content */}
      <div className="relative z-20 min-h-screen flex flex-col">
        {/* Header */}
        <header className={`transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
          <nav className="flex justify-between items-center p-6 backdrop-blur-sm bg-black/30">
            <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              CYBERGAMES
            </div>
            <div className="flex space-x-6">
              <Link 
                to="/" 
                className="px-4 py-2 border border-cyan-400/50 hover:border-cyan-400 hover:bg-cyan-400/10 text-cyan-400 transition-all duration-300 backdrop-blur-sm"
              >
                Games
              </Link>
              <button className="px-4 py-2 border border-purple-400/50 hover:border-purple-400 hover:bg-purple-400/10 text-purple-400 transition-all duration-300 backdrop-blur-sm">
                About
              </button>
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-6">
          <div className={`text-center max-w-4xl transition-all duration-1500 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
            <h1 className="text-6xl md:text-8xl font-black mb-6 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight">
              IMMERSIVE
              <br />
              <span className="text-4xl md:text-6xl">GAMING UNIVERSE</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
              Experience the future of gaming with our collection of 
              <span className="text-cyan-400 font-semibold"> cutting-edge </span>
              interactive experiences
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                to="/"
                className="group px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-bold rounded-lg transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25"
              >
                <span className="flex items-center">
                  ENTER GAMES
                  <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>
              
              <button className="px-8 py-4 border-2 border-cyan-400/50 hover:border-cyan-400 hover:bg-cyan-400/10 text-cyan-400 font-bold rounded-lg transition-all duration-300 backdrop-blur-sm">
                EXPLORE TECH
              </button>
            </div>
          </div>
        </main>

        {/* Features Section */}
        <section className={`py-20 px-6 transition-all duration-2000 delay-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              NEXT-GEN FEATURES
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "3D IMMERSION",
                  description: "Experience games in stunning 3D environments with real-time rendering",
                  color: "cyan"
                },
                {
                  title: "AI POWERED",
                  description: "Intelligent gameplay mechanics that adapt to your playing style",
                  color: "purple"
                },
                {
                  title: "CROSS PLATFORM",
                  description: "Play seamlessly across all devices with cloud synchronization",
                  color: "pink"
                }
              ].map((feature, index) => (
                <div 
                  key={feature.title}
                  className={`p-6 backdrop-blur-sm bg-black/30 border border-${feature.color}-400/30 hover:border-${feature.color}-400 rounded-lg transform hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-${feature.color}-500/25`}
                >
                  <h3 className={`text-xl font-bold mb-4 text-${feature.color}-400`}>
                    {feature.title}
                  </h3>
                  <p className="text-gray-300">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="p-6 backdrop-blur-sm bg-black/30 border-t border-gray-800">
          <div className="text-center text-gray-400">
            <p>&copy; 2024 CyberGames. Experience the Future.</p>
          </div>
        </footer>
      </div>

      {/* Interactive Elements Overlay */}
      <div className="fixed inset-0 z-30 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-purple-400 rounded-full animate-ping" />
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse" />
      </div>
    </div>
  );
};

export default Interactive3DLanding;
