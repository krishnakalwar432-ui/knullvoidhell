import React, { useState, useRef, useEffect, useCallback } from "react";
import KnullvoidLogo from "@/components/KnullvoidLogo";
import CosmicVoidLogo from "@/components/CosmicVoidLogo";
import InteractiveCosmicBackground from "@/components/InteractiveCosmicBackground";
import { Link } from "react-router-dom";
import { Play, Zap, Star, Trophy, Clock } from "lucide-react";

interface Game {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  color: string;
  isImplemented: boolean;
}

interface NeonGameInterfaceProps {
  games: Game[];
  onGameSelect?: (gameId: string) => void;
}

interface ParticleEffect {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

const NeonGameInterface: React.FC<NeonGameInterfaceProps> = ({
  games,
  onGameSelect,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const hoveredGameRef = useRef<string | null>(null);
  const [hoveredGame, setHoveredGame] = useState<string | null>(null);
  const [particles, setParticles] = useState<ParticleEffect[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState("");

  const categories = [
    "All",
    "Racing",
    "Platform",
    "Shooter",
    "Arcade",
    "RPG",
    "Simulation",
    "Sports",
    "Music",
    "Creative",
    "Idle",
  ];

  const filteredGames = games.filter((game) => {
    const matchesCategory =
      selectedCategory === "All" || game.category === selectedCategory;
    const matchesSearch =
      game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch && game.isImplemented;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    const animate = () => {
      // Update particles
      setParticles((prev) => {
        let newParticles = prev
          .map((particle) => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            life: particle.life - 1,
            vx: particle.vx * 0.98,
            vy: particle.vy * 0.98,
          }))
          .filter((particle) => particle.life > 0);

        // Add new particles on hover
        if (hoveredGameRef.current && newParticles.length < 50) {
          const rect = document
            .getElementById(`game-${hoveredGameRef.current}`)
            ?.getBoundingClientRect();
          if (rect) {
            for (let i = 0; i < 3; i++) {
              newParticles.push({
                x: rect.left + Math.random() * rect.width,
                y: rect.top + Math.random() * rect.height,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 60,
                maxLife: 60,
                color: "#00ffff",
                size: Math.random() * 3 + 1,
              });
            }
          }
        }

        return newParticles;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Separate effect for drawing particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw particles
    particles.forEach((particle) => {
      const alpha = particle.life / particle.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();

      // Glow effect
      ctx.globalAlpha = alpha * 0.3;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }, [particles]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "text-green-400 border-green-400";
      case "medium":
        return "text-yellow-400 border-yellow-400";
      case "hard":
        return "text-red-400 border-red-400";
      default:
        return "text-gray-400 border-gray-400";
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return <Star className="w-4 h-4" />;
      case "medium":
        return <Zap className="w-4 h-4" />;
      case "hard":
        return <Trophy className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      <InteractiveCosmicBackground />

      {/* Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-10 pointer-events-none"
        style={{ mixBlendMode: "screen" }}
      />

      {/* Main Content */}
      <div id="main" className="relative z-20 container mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mx-auto flex items-center justify-center">
            <KnullvoidLogo />
          </div>
          <p className="text-xl text-gray-300 mt-4 mb-8">
            Cyber arcade • 3D interactive neon experiences
          </p>
          <div className="flex items-center justify-center gap-4 mb-6">
            <Link
              to="/news"
              aria-label="News and updates"
              className="group relative px-5 py-2.5 rounded-lg bg-black/60 border border-cyan-500/50 text-cyan-400 font-semibold overflow-hidden transition-all duration-300 hover:border-cyan-400 hover:text-white hover:shadow-[0_0_20px_rgba(0,255,255,0.4),inset_0_0_20px_rgba(0,255,255,0.1)]"
            >
              <span className="relative z-10">News</span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/20 to-cyan-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
            </Link>
            <Link
              to="/leaderboards"
              aria-label="Leaderboards"
              className="group relative px-5 py-2.5 rounded-lg bg-black/60 border border-purple-500/50 text-purple-400 font-semibold overflow-hidden transition-all duration-300 hover:border-purple-400 hover:text-white hover:shadow-[0_0_20px_rgba(168,85,247,0.4),inset_0_0_20px_rgba(168,85,247,0.1)]"
            >
              <span className="relative z-10">Leaderboards</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/20 to-purple-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
            </Link>
            <Link
              to="/profile"
              aria-label="Profile"
              className="group relative px-5 py-2.5 rounded-lg bg-black/60 border border-pink-500/50 text-pink-400 font-semibold overflow-hidden transition-all duration-300 hover:border-pink-400 hover:text-white hover:shadow-[0_0_20px_rgba(236,72,153,0.4),inset_0_0_20px_rgba(236,72,153,0.1)]"
            >
              <span className="relative z-10">Profile</span>
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-pink-500/20 to-pink-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
            </Link>
          </div>

          {/* 2D Experience Buttons */}
          <div className="mb-6 flex flex-col md:flex-row items-center justify-center gap-4 flex-wrap">
            {/* Experience 2D Extreme - External Link */}
            <div className="flex flex-col items-center gap-2">
              <a
                href="https://8ff75f87.knullvoid-multigame.pages.dev/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Experience 2D Extreme - Opens external link"
                className="extreme-button-glow group relative inline-flex items-center justify-center px-6 py-3 font-bold text-white text-base overflow-hidden rounded-lg transition-all duration-300 hover:scale-110 extreme-button-screen-glitch"
                style={{
                  background: "linear-gradient(135deg, #ff00d4 0%, #7000ff 50%, #00ffff 100%)",
                  textShadow: "0 0 10px #00ffff, 0 0 20px #ff00d4",
                }}
              >
                <Zap className="mr-2 w-5 h-5 animate-pulse" />
                <span className="relative">
                  EXPERIENCE 2D EXTREME
                  <span
                    className="absolute inset-0 bg-white/20 blur-lg rounded-lg -z-10 group-hover:blur-xl transition-all duration-300"
                    style={{
                      animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                    }}
                  />
                </span>
              </a>
              <p className="text-xs text-cyan-400/60 italic animate-pulse">
                ⚡ Extreme realm ⚡
              </p>
            </div>

            {/* Experience 2D Ultra - External Link */}
            <div className="flex flex-col items-center gap-2">
              <a
                href="https://celebrated-youtiao-c2b678.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Experience 2D Ultra - Opens external link"
                className="extreme-button-glow group relative inline-flex items-center justify-center px-6 py-3 font-bold text-white text-base overflow-hidden rounded-lg transition-all duration-300 hover:scale-110 extreme-button-screen-glitch"
                style={{
                  background: "linear-gradient(135deg, #00ffff 0%, #ff00d4 50%, #00ff9d 100%)",
                  textShadow: "0 0 10px #ff00d4, 0 0 20px #00ff9d",
                }}
              >
                <Zap className="mr-2 w-5 h-5 animate-pulse" />
                <span className="relative">
                  EXPERIENCE 2D ULTRA
                  <span
                    className="absolute inset-0 bg-white/20 blur-lg rounded-lg -z-10 group-hover:blur-xl transition-all duration-300"
                    style={{
                      animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                    }}
                  />
                </span>
              </a>
              <p className="text-xs text-cyan-400/60 italic animate-pulse">
                ⚡ Ultra dimension ⚡
              </p>
            </div>
          </div>

          {/* 3D Interface and Download Buttons */}
          <div className="mb-8 flex flex-col items-center gap-4">
            {/* Experience 3D Interface - External Link */}
            <a
              href="https://genuine-cuchufli-f719de.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Experience 3D Interface - Opens external link"
              className="group relative inline-flex items-center px-8 py-3.5 rounded-xl bg-black/70 border-2 border-cyan-400/60 text-cyan-300 font-bold text-lg overflow-hidden transition-all duration-300 hover:border-cyan-300 hover:text-white hover:shadow-[0_0_30px_rgba(0,255,255,0.5),0_0_60px_rgba(0,255,255,0.2),inset_0_0_30px_rgba(0,255,255,0.1)] hover:scale-105"
            >
              <Zap className="mr-3 w-6 h-6 group-hover:animate-pulse" />
              <span className="relative z-10">Experience 3D Interface</span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-400/30 to-cyan-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </a>

            {/* 4K and PC Download */}
            <a
              href="https://clinquant-alfajores-6ca9f0.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="4K and PC Download - Opens external link"
              className="group relative inline-flex items-center px-8 py-3.5 rounded-xl bg-black/70 border-2 border-amber-500/60 text-amber-300 font-bold text-lg overflow-hidden transition-all duration-300 hover:border-amber-300 hover:text-white hover:shadow-[0_0_30px_rgba(251,191,36,0.5),0_0_60px_rgba(251,191,36,0.2),inset_0_0_30px_rgba(251,191,36,0.1)] hover:scale-105"
            >
              <Star className="mr-3 w-6 h-6 group-hover:animate-pulse" />
              <span className="relative z-10">4K & PC Download</span>
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-400/30 to-amber-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </a>

            {/* Interactive Game */}
            <a
              href="https://beautiful-sawine-e210e5.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Interactive Game - Opens external link"
              className="group relative inline-flex items-center px-8 py-3.5 rounded-xl bg-black/70 border-2 border-emerald-500/60 text-emerald-300 font-bold text-lg overflow-hidden transition-all duration-300 hover:border-emerald-300 hover:text-white hover:shadow-[0_0_30px_rgba(16,185,129,0.5),0_0_60px_rgba(16,185,129,0.2),inset_0_0_30px_rgba(16,185,129,0.1)] hover:scale-105"
            >
              <Play className="mr-3 w-6 h-6 group-hover:animate-pulse" />
              <span className="relative z-10">Interactive Game</span>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-400/30 to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </a>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-center">
          <input
            type="text"
            placeholder="Search games..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-black/50 border border-cyan-400/50 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none backdrop-blur-sm"
          />

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 backdrop-blur-sm ${selectedCategory === category
                  ? "bg-cyan-500 text-white"
                  : "bg-black/30 border border-cyan-400/30 text-cyan-400 hover:border-cyan-400 hover:bg-cyan-400/10"
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredGames.map((game) => (
            <div
              key={game.id}
              id={`game-${game.id}`}
              className="group relative"
              onMouseEnter={() => {
                setHoveredGame(game.id);
                hoveredGameRef.current = game.id;
              }}
              onMouseLeave={() => {
                setHoveredGame(null);
                hoveredGameRef.current = null;
              }}
            >
              <Link
                to={`/game/${game.id}`}
                onClick={() => onGameSelect?.(game.id)}
                className="block"
              >
                <div className="relative p-6 bg-black/40 backdrop-blur-sm border border-gray-700/50 rounded-xl transform transition-all duration-300 hover:scale-105 hover:bg-black/60 hover:border-cyan-400/50 overflow-hidden">
                  {/* Glow effect on hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-xl`}
                    style={{
                      background: `linear-gradient(45deg, ${game.color}40, transparent)`,
                    }}
                  />

                  {/* Game Title */}
                  <h3 className="text-xl font-bold mb-2 text-white group-hover:text-cyan-400 transition-colors">
                    {game.title}
                  </h3>

                  {/* Game Description */}
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {game.description}
                  </p>

                  {/* Game Info */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2 py-1 bg-purple-900/50 text-purple-300 text-xs rounded">
                      {game.category}
                    </span>

                    <div
                      className={`flex items-center gap-1 text-xs ${getDifficultyColor(game.difficulty)}`}
                    >
                      {getDifficultyIcon(game.difficulty)}
                      {game.difficulty}
                    </div>
                  </div>

                  {/* Play Button */}
                  <div className="flex items-center justify-center">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border border-cyan-400/30 rounded-lg group-hover:border-cyan-400 group-hover:bg-gradient-to-r group-hover:from-cyan-600/40 group-hover:to-purple-600/40 transition-all">
                      <Play className="w-4 h-4 text-cyan-400" />
                      <span className="text-cyan-400 font-medium">PLAY</span>
                    </div>
                  </div>

                  {/* Neon accent line */}
                  <div
                    className="absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-500 rounded-b-xl"
                    style={{ backgroundColor: game.color }}
                  />
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* No games found */}
        {filteredGames.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-xl mb-4">No games found</div>
            <p className="text-gray-500">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-8 px-8 py-4 bg-black/30 backdrop-blur-sm border border-gray-700/50 rounded-xl">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">
                {filteredGames.length}
              </div>
              <div className="text-sm text-gray-400">Available Games</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {categories.length - 1}
              </div>
              <div className="text-sm text-gray-400">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-400">∞</div>
              <div className="text-sm text-gray-400">Fun Factor</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeonGameInterface;
