import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Zap, Star, Trophy, Clock, Search, ArrowUp,
  Gamepad2, Layers, Flame, TrendingUp, Heart,
  Keyboard, X
} from "lucide-react";
import { ExternalLink } from "lucide-react";
import { useTheme } from "@/themes/ThemeProvider";
import DynamicLogo from "@/themes/components/DynamicLogo";
import ThemeBackground from "@/themes/components/ThemeBackground";
import ThemeSelector from "@/themes/components/ThemeSelector";
import ThemeTransition from "@/themes/components/ThemeTransition";
import DynamicButton from "@/themes/components/DynamicButton";
import EnhancedButton from "@/components/buttons/EnhancedButton";
import LightningCanvas from "@/components/LightningCanvas";
import StardustTrail from "@/components/StardustTrail";
import RippleEffect from "@/components/RippleEffect";
import { gameCategories } from "@shared/games";
import TiltCard from "@/components/enhancements/TiltCard";

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

// ── Typewriter Hook ──
function useTypewriter(texts: string[], speed = 60) {
  const [display, setDisplay] = useState("");
  const idx = useRef(0);
  const charIdx = useRef(0);
  const deleting = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const current = texts[idx.current];
      if (!deleting.current) {
        charIdx.current++;
        setDisplay(current.slice(0, charIdx.current));
        if (charIdx.current >= current.length) deleting.current = true;
      } else {
        charIdx.current--;
        setDisplay(current.slice(0, charIdx.current));
        if (charIdx.current <= 0) {
          deleting.current = false;
          idx.current = (idx.current + 1) % texts.length;
        }
      }
    }, deleting.current ? speed / 2 : speed);
    return () => clearInterval(interval);
  }, [texts, speed]);

  return display;
}

// ── Animated Counter ──
function AnimatedCounter({ target, duration = 1200, suffix = "" }: { target: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <div ref={ref}>{count}{suffix}</div>;
}

// ── Favorites hook (localStorage) ──
function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("knullvoid-favorites");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  const toggle = useCallback((id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem("knullvoid-favorites", JSON.stringify([...next]));
      return next;
    });
  }, []);

  return { favorites, toggle, count: favorites.size };
}

// ── Recently Played hook ──
function useRecentlyPlayed() {
  const [recent, setRecent] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("knullvoid-recent");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const add = useCallback((id: string) => {
    setRecent(prev => {
      const next = [id, ...prev.filter(x => x !== id)].slice(0, 8);
      localStorage.setItem("knullvoid-recent", JSON.stringify(next));
      return next;
    });
  }, []);

  return { recent, add };
}

const NeonGameInterface: React.FC<NeonGameInterfaceProps> = ({ games, onGameSelect }) => {
  const { currentTheme, themeName } = useTheme();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [diceSpinning, setDiceSpinning] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [canvasEffectsEnabled, setCanvasEffectsEnabled] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);
  const c = currentTheme.colors;

  const { favorites, toggle: toggleFavorite, count: favCount } = useFavorites();
  const { recent, add: addRecent } = useRecentlyPlayed();

  const taglines = [
    "Cyber arcade • Dynamic space experiences",
    "80+ games • Infinite replayability",
    "Enter the void • Play forever",
    "Neon dreams • Pixel glory",
    "Press / to search • R for random",
  ];
  const tagline = useTypewriter(taglines, 55);

  const implementedGames = useMemo(() => games.filter(g => g.isImplemented), [games]);

  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      const matchesCategory = selectedCategory === "All" || game.category === selectedCategory;
      const matchesSearch =
        game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFavorites = !showFavoritesOnly || favorites.has(game.id);
      return matchesCategory && matchesSearch && game.isImplemented && matchesFavorites;
    });
  }, [games, selectedCategory, searchTerm, showFavoritesOnly, favorites]);

  const recentGames = useMemo(() => {
    return recent.map(id => implementedGames.find(g => g.id === id)).filter(Boolean) as Game[];
  }, [recent, implementedGames]);

  // Scroll logic
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setScrollProgress(height > 0 ? (winScroll / height) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  // Random game
  const playRandomGame = useCallback(() => {
    const pool = showFavoritesOnly && favCount > 0
      ? implementedGames.filter(g => favorites.has(g.id))
      : implementedGames;
    setDiceSpinning(true);
    setTimeout(() => {
      const random = pool[Math.floor(Math.random() * pool.length)];
      if (random) { addRecent(random.id); navigate(`/game/${random.id}`); }
      setDiceSpinning(false);
    }, 600);
  }, [implementedGames, navigate, showFavoritesOnly, favorites, favCount, addRecent]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "/") { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === "r" || e.key === "R") { e.preventDefault(); playRandomGame(); }
      if (e.key === "f" || e.key === "F") { e.preventDefault(); setShowFavoritesOnly(p => !p); }
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) { e.preventDefault(); setShowShortcuts(p => !p); }
      if (e.key === "Escape") { setShowShortcuts(false); setSearchTerm(""); searchRef.current?.blur(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [playRandomGame]);

  const handleGameClick = (gameId: string) => {
    addRecent(gameId);
    onGameSelect?.(gameId);
  };

  const getDifficultyStyle = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy": return { color: "#4ade80", bg: "rgba(74,222,128,0.1)" };
      case "medium": return { color: "#fbbf24", bg: "rgba(251,191,36,0.1)" };
      case "hard": return { color: "#f87171", bg: "rgba(248,113,113,0.1)" };
      default: return { color: "#9ca3af", bg: "rgba(156,163,175,0.1)" };
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy": return <Star className="w-3.5 h-3.5" />;
      case "medium": return <Zap className="w-3.5 h-3.5" />;
      case "hard": return <Trophy className="w-3.5 h-3.5" />;
      default: return <Clock className="w-3.5 h-3.5" />;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.03 } },
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35 } },
  };

  const categoryIcons: Record<string, React.ReactNode> = {
    "All": <Gamepad2 className="w-3.5 h-3.5" />,
    "Action": <Flame className="w-3.5 h-3.5" />,
    "Racing": <TrendingUp className="w-3.5 h-3.5" />,
    "Puzzle": <Layers className="w-3.5 h-3.5" />,
  };

  return (
    <div className="relative min-h-screen overflow-hidden grain-overlay" style={{ background: c.bg }}>
      <ThemeBackground />
      <ThemeTransition />
      <ThemeSelector />

      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 z-[100]" style={{ background: `${c.cardBorder}` }}>
        <motion.div
          className="h-full"
          style={{
            width: `${scrollProgress}%`,
            background: `linear-gradient(90deg, ${c.primary}, ${c.secondary}, ${c.accent})`,
            boxShadow: `0 0 10px ${c.glow}`,
          }}
        />
      </div>

      {/* News Ticker */}
      <div className="relative z-30 overflow-hidden border-b" style={{ background: c.card, borderColor: c.cardBorder }}>
        <div className="marquee-text py-1.5 text-xs font-medium" style={{ color: c.textMuted, fontFamily: currentTheme.font }}>
          🎮 Welcome to KNULLVOID — {implementedGames.length}+ games available &nbsp;•&nbsp;
          🔥 New: Neon Drift, Shadow Bot Protocol, Cyber Strike Arena &nbsp;•&nbsp;
          ⌨️ Press ? for keyboard shortcuts &nbsp;•&nbsp;
          ❤️ Favorite games with the heart icon &nbsp;•&nbsp;
          🏆 Compete on leaderboards
        </div>
      </div>

      {/* Main Content */}
      <div id="main" className="relative z-20 container mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center mb-4"><DynamicLogo /></div>

          <p className="text-lg md:text-xl mt-3 mb-6 h-8 typewriter-cursor" style={{ color: c.textMuted, fontFamily: currentTheme.font }}>
            {tagline}
          </p>

          <motion.div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-6 badge-bounce"
            style={{ background: `${c.primary}15`, borderColor: `${c.primary}40`, color: c.primary, fontFamily: currentTheme.font }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
          >
            <Gamepad2 className="w-4 h-4" />
            <span className="text-sm font-bold">{implementedGames.length} Games</span>
            {favCount > 0 && <span className="ml-1 text-xs opacity-70">• {favCount} ❤️</span>}
          </motion.div>

          {/* Nav Buttons */}
          <div className="flex items-center justify-center gap-3 mb-6 flex-wrap">
            {[
              { to: "/news", label: "News" },
              { to: "/leaderboards", label: "Leaderboards" },
              { to: "/profile", label: "Profile" },
              { to: "/login", label: "Login" },
            ].map(({ to, label }) => (
              <Link key={to} to={to}>
                <EnhancedButton variant="primary" size="sm" glow ripple>{label}</EnhancedButton>
              </Link>
            ))}
            {/* RANDOM BUTTON - Golden Dice Roller */}
            <motion.button
              onClick={playRandomGame}
              disabled={diceSpinning}
              className="relative px-4 py-2 rounded-lg text-sm font-bold text-white transition-all duration-300 overflow-hidden group flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #FFB800 0%, #FF9800 100%)',
                boxShadow: '0 0 20px rgba(255, 184, 0, 0.6)',
                border: '2px solid rgba(255, 184, 0, 0.8)',
              }}
              whileHover={{ scale: 1.08, boxShadow: '0 0 30px rgba(255, 184, 0, 1)' }}
              whileTap={{ scale: 0.95 }}
              aria-label="Play a random game"
            >
              <motion.span
                initial={{ rotate: 0, scale: 1 }}
                animate={diceSpinning ? { rotate: 360, scale: [1, 1.2, 1] } : { rotate: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: "linear", repeat: diceSpinning ? Infinity : 0 }}
                className="inline-block text-lg"
              >
                🎲
              </motion.span>
              <span className="font-bold tracking-wider">{diceSpinning ? 'ROLLING' : 'RANDOM'}</span>
              
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30"
                animate={{ x: ['−100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.button>

            {/* FAVS BUTTON - Glowing Pink Heart */}
            <motion.button
              onClick={() => setShowFavoritesOnly(p => !p)}
              className="relative px-4 py-2 rounded-lg text-sm font-bold text-white transition-all duration-300 overflow-hidden group flex items-center gap-2"
              style={{
                background: showFavoritesOnly
                  ? 'linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)'
                  : 'linear-gradient(135deg, rgba(236, 72, 153, 0.4) 0%, rgba(244, 63, 94, 0.4) 100%)',
                boxShadow: showFavoritesOnly
                  ? '0 0 25px rgba(236, 72, 153, 0.8)'
                  : '0 0 12px rgba(236, 72, 153, 0.4)',
                border: '2px solid rgba(236, 72, 153, 0.8)',
              }}
              whileHover={{
                scale: 1.08,
                boxShadow: showFavoritesOnly
                  ? '0 0 35px rgba(236, 72, 153, 1)'
                  : '0 0 20px rgba(236, 72, 153, 0.7)',
              }}
              whileTap={{ scale: 0.95 }}
              aria-pressed={showFavoritesOnly}
              aria-label="Toggle favorites filter"
            >
              <motion.span
                initial={{ scale: 1 }}
                animate={showFavoritesOnly ? { scale: [1, 1.25, 1], rotate: [0, -12, 0] } : { scale: 1 }}
                transition={{ duration: 0.5, type: 'spring' }}
                className="inline-block text-lg"
              >
                <Heart className={`w-5 h-5 ${showFavoritesOnly ? "fill-current" : ""}`} />
              </motion.span>
              <span className="font-bold tracking-wider">FAVS</span>
              {favCount > 0 && (
                <motion.span
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs font-black"
                >
                  {favCount}
                </motion.span>
              )}
              
              {/* Pulse glow when active */}
              {showFavoritesOnly && (
                <motion.div
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-pink-400/0 via-pink-400/40 to-pink-400/0"
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.button>
            <EnhancedButton 
              variant="icon" 
              size="sm" 
              onClick={() => setShowShortcuts(p => !p)}
              glow
              ripple
              aria-label="Keyboard shortcuts" 
            >
              <Keyboard className="w-4 h-4" />
            </EnhancedButton>
          </div>

          {/* External Links */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            {[
              { href: "https://8ff75f87.knullvoid-multigame.pages.dev/", label: "2D Extreme", icon: <Zap className="w-4 h-4" /> },
              { href: "https://celebrated-youtiao-c2b678.netlify.app/", label: "2D Ultra", icon: <Zap className="w-4 h-4" /> },
              { href: "https://genuine-cuchufli-f719de.netlify.app/", label: "3D Interface", icon: <Star className="w-4 h-4" /> },
              { href: "https://clinquant-alfajores-6ca9f0.netlify.app/", label: "4K Download", icon: <Star className="w-4 h-4" /> },
              { href: "https://beautiful-sawine-e210e5.netlify.app/", label: "Interactive", icon: <Play className="w-4 h-4" /> },
            ].map(({ href, label, icon }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
                aria-label={`Open ${label} in a new tab`}
                title={`Open ${label} (external)`}
              >
                <EnhancedButton
                  variant="external"
                  size="sm"
                  glow
                  ripple
                  className="flex items-center gap-2 px-3 py-1.5 shadow-2xl hover:scale-105 transform-gpu transition-transform"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md flex items-center justify-center bg-white/6 text-white/90 drop-shadow-sm">
                      {icon}
                    </span>
                    <span className="truncate max-w-[8rem]">{label}</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-80" />
                </EnhancedButton>
              </a>
            ))}
          </div>
        </div>

        {/* Recently Played */}
        {recentGames.length > 0 && !showFavoritesOnly && (
          <motion.div className="mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h2 className="text-sm uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: c.textMuted, fontFamily: currentTheme.font }}>
              <Clock className="w-4 h-4" /> Recently Played
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {recentGames.map((game) => (
                <Link key={game.id} to={`/game/${game.id}`} onClick={() => handleGameClick(game.id)} className="flex-shrink-0 group">
                  <motion.div
                    className="relative px-4 py-3 rounded-xl border backdrop-blur-sm transition-all w-48 card-shine-effect"
                    style={{ background: c.card, borderColor: c.cardBorder, fontFamily: currentTheme.font }}
                    whileHover={{ scale: 1.05, y: -2 }}
                  >
                    <div className="text-sm font-bold truncate mb-1" style={{ color: c.text }}>{game.title}</div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: `${c.secondary}20`, color: c.secondary }}>{game.category}</span>
                      <Play className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: c.primary }} />
                    </div>
                    <div className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-500" style={{ backgroundColor: game.color }} />
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Search & Category Filters */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: c.textMuted }} />
            <input
              ref={searchRef}
              type="text"
              placeholder='Search games... ( / )'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-8 py-2.5 rounded-lg border backdrop-blur-sm text-sm transition-all duration-300 focus:outline-none focus:ring-2 w-72"
              style={{
                background: c.card, borderColor: c.cardBorder, color: c.text,
                fontFamily: currentTheme.font,
                boxShadow: searchTerm ? `0 0 12px ${c.glow}` : "none",
              }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity" style={{ color: c.textMuted }}>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2 justify-center">
          {gameCategories.map((category) => (
            <motion.button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 backdrop-blur-sm border flex items-center gap-1.5"
              style={{
                background: selectedCategory === category ? c.primary : c.buttonBg,
                color: selectedCategory === category ? c.bg : c.buttonText,
                borderColor: selectedCategory === category ? c.primary : c.cardBorder,
                fontFamily: currentTheme.font,
                boxShadow: selectedCategory === category ? `0 0 12px ${c.glow}` : 'none',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {categoryIcons[category] || <Layers className="w-3.5 h-3.5" />}
              {category}
            </motion.button>
          ))}
        </div>

        {/* Results count */}
        <motion.div
          className="text-center mb-4 text-sm"
          style={{ color: c.textMuted, fontFamily: currentTheme.font }}
          key={`${filteredGames.length}-${showFavoritesOnly}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {showFavoritesOnly && <span>❤️ </span>}
          Showing <span style={{ color: c.primary, fontWeight: 700 }}>{filteredGames.length}</span> game{filteredGames.length !== 1 ? "s" : ""}
          {selectedCategory !== "All" && <> in <span style={{ color: c.secondary }}>{selectedCategory}</span></>}
          {searchTerm && <> matching "<span style={{ color: c.accent }}>{searchTerm}</span>"</>}
          {showFavoritesOnly && <span style={{ color: c.accent }}> (favorites only)</span>}
        </motion.div>

        {/* ── GRID VIEW (Original Matrix Style) ── */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          key={`grid-${selectedCategory}-${searchTerm}-${showFavoritesOnly}`}
        >
          <AnimatePresence mode="popLayout">
            {filteredGames.map((game, index) => {
              const diffStyle = getDifficultyStyle(game.difficulty);
              const isFav = favorites.has(game.id);
              return (
                <motion.div key={game.id} variants={cardVariants} layout exit={{ opacity: 0, scale: 0.9 }}>
                  <TiltCard glowColor={`${game.color}40`} intensity={10}>
                    <div className="relative group">
                      {/* Favorite button */}
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(game.id); }}
                        className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-125"
                        style={{
                          background: isFav ? `${c.primary}30` : "rgba(0,0,0,0.4)",
                          color: isFav ? "#f43f5e" : c.textMuted,
                        }}
                        title={isFav ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFav ? "fill-current" : ""}`} />
                      </button>

                      <Link to={`/game/${game.id}`} onClick={() => handleGameClick(game.id)} className="block">
                        <div
                          className="relative p-5 rounded-xl border backdrop-blur-sm transition-all duration-300 overflow-hidden hover:scale-[1.03] hover:-translate-y-1 card-shine-effect"
                          style={{ background: c.card, borderColor: c.cardBorder, fontFamily: currentTheme.font }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = c.primary;
                            e.currentTarget.style.boxShadow = `0 0 20px ${c.glow}, inset 0 0 20px rgba(255,255,255,0.02)`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = c.cardBorder;
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          {/* Hover gradient overlay */}
                          <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-xl pointer-events-none"
                            style={{ background: `linear-gradient(135deg, ${game.color}40, transparent)` }}
                          />

                          {/* Index badge */}
                          <div
                            className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold opacity-20 group-hover:opacity-50 transition-opacity"
                            style={{ background: `${c.primary}20`, color: c.primary }}
                          >
                            {index + 1}
                          </div>

                          <h3 className="text-lg font-bold mb-1.5 transition-colors duration-300 px-6" style={{ color: c.text }}>
                            <span
                              className="group-hover:text-transparent group-hover:bg-clip-text"
                              style={{ WebkitBackgroundClip: 'text', backgroundImage: `linear-gradient(135deg, ${c.primary}, ${c.secondary})` }}
                            >
                              {game.title}
                            </span>
                          </h3>

                          <p className="text-sm mb-3 line-clamp-2" style={{ color: c.textMuted }}>{game.description}</p>

                          <div className="flex items-center justify-between mb-3">
                            <span className="px-2 py-0.5 text-xs rounded-full border" style={{ background: `${c.secondary}20`, borderColor: `${c.secondary}40`, color: c.secondary }}>
                              {game.category}
                            </span>
                            <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ color: diffStyle.color, background: diffStyle.bg }}>
                              {getDifficultyIcon(game.difficulty)}
                              {game.difficulty}
                            </div>
                          </div>

                          <div className="flex items-center justify-center">
                            <div
                              className="flex items-center gap-2 px-4 py-1.5 rounded-lg border text-sm font-bold transition-all duration-300 group-hover:shadow-lg kv-btn-shimmer"
                              style={{
                                background: `linear-gradient(135deg, ${c.buttonBg}, ${c.primary}18)`,
                                borderColor: c.cardBorder,
                                color: c.buttonText,
                                fontFamily: currentTheme.font,
                                textTransform: 'uppercase' as const,
                                letterSpacing: '0.08em',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = c.primary;
                                e.currentTarget.style.boxShadow = `0 0 15px ${c.glow}, inset 0 0 10px rgba(255,255,255,0.04)`;
                                e.currentTarget.style.background = `linear-gradient(135deg, ${c.primary}30, ${c.secondary}25)`;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = c.cardBorder;
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.background = `linear-gradient(135deg, ${c.buttonBg}, ${c.primary}18)`;
                              }}
                            >
                              <Play className="w-3.5 h-3.5 group-hover:scale-125 transition-transform" />
                              PLAY
                            </div>
                          </div>

                          {/* Bottom accent line */}
                          <div className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-500" style={{ backgroundColor: game.color }} />
                        </div>
                      </Link>
                    </div>
                  </TiltCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* No results */}
        {filteredGames.length === 0 && (
          <motion.div className="text-center py-16" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-5xl mb-4">{showFavoritesOnly ? "💔" : "🔍"}</div>
            <div className="text-xl mb-3" style={{ color: c.textMuted }}>
              {showFavoritesOnly ? "No favorites yet" : "No games found"}
            </div>
            <p className="text-sm mb-4" style={{ color: `${c.textMuted}80` }}>
              {showFavoritesOnly ? "Click the heart icon on any game to add it" : "Try adjusting your search or filter"}
            </p>
            <EnhancedButton 
              variant="destructive" 
              size="sm" 
              onClick={() => { setSearchTerm(""); setSelectedCategory("All"); setShowFavoritesOnly(false); }}
              ripple
              glow
            >
              Clear Filters
            </EnhancedButton>
          </motion.div>
        )}

        {/* Stats Footer */}
        <div className="mt-16 mb-8">
          <motion.div
            className="mx-auto max-w-2xl rounded-2xl border backdrop-blur-md p-8"
            style={{ background: c.card, borderColor: c.cardBorder, fontFamily: currentTheme.font }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-center text-sm uppercase tracking-widest mb-6" style={{ color: c.textMuted }}>Platform Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: "Games", value: implementedGames.length, icon: <Gamepad2 className="w-5 h-5" />, color: c.primary },
                { label: "Categories", value: gameCategories.length - 1, icon: <Layers className="w-5 h-5" />, color: c.secondary },
                { label: "Favorites", value: favCount, icon: <Heart className="w-5 h-5" />, color: "#f43f5e" },
                { label: "Fun Factor", value: 100, suffix: "%", icon: <Flame className="w-5 h-5" />, color: c.accent },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="flex justify-center mb-2 opacity-60" style={{ color: stat.color }}>{stat.icon}</div>
                  <div className="text-3xl font-black mb-1" style={{ color: stat.color }}>
                    <AnimatedCounter target={stat.value} suffix={stat.suffix || ""} />
                  </div>
                  <div className="text-xs uppercase tracking-wider" style={{ color: c.textMuted }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="text-center py-6 border-t" style={{ borderColor: c.cardBorder }}>
          <p className="text-xs mb-2" style={{ color: `${c.textMuted}60`, fontFamily: currentTheme.font }}>
            KNULLVOID © {new Date().getFullYear()} — Built for gamers, by gamers
          </p>
          <p className="text-[10px]" style={{ color: `${c.textMuted}40` }}>
            Press <kbd className="px-1 py-0.5 rounded border text-[10px]" style={{ borderColor: c.cardBorder }}>?</kbd> for keyboard shortcuts
          </p>
        </div>
      </div>

      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div className="fixed inset-0 z-[200] flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowShortcuts(false)} />
            <motion.div
              className="relative rounded-2xl border p-6 w-full max-w-md mx-4"
              style={{ background: c.bg, borderColor: c.cardBorder, fontFamily: currentTheme.font }}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <button onClick={() => setShowShortcuts(false)} className="absolute top-4 right-4 opacity-60 hover:opacity-100 transition-opacity" style={{ color: c.textMuted }}>
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: c.text }}>
                <Keyboard className="w-5 h-5" style={{ color: c.primary }} /> Keyboard Shortcuts
              </h2>
              <div className="space-y-3">
                {[
                  { key: "/", desc: "Focus search" },
                  { key: "R", desc: "Random game" },
                  { key: "F", desc: "Toggle favorites filter" },
                  { key: "?", desc: "Show this dialog" },
                  { key: "Esc", desc: "Close dialog / clear search" },
                ].map(({ key, desc }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: c.textMuted }}>{desc}</span>
                    <kbd className="px-2 py-1 rounded border text-xs font-mono font-bold" style={{ borderColor: c.cardBorder, color: c.primary, background: `${c.primary}10` }}>
                      {key}
                    </kbd>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll-to-top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-20 right-4 z-50 w-10 h-10 rounded-full border flex items-center justify-center backdrop-blur-md transition-colors scroll-top-btn"
            style={{ background: `${c.primary}25`, borderColor: `${c.primary}60`, color: c.primary }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Lightning effect overlay (decorative) */}
      <LightningCanvas targetId="main" theme={themeName} />
      
      {/* Stardust particle trail effect */}
      <StardustTrail targetId="main" enabled={canvasEffectsEnabled} />
      
      {/* Click ripple water effect */}
      <RippleEffect targetId="main" enabled={canvasEffectsEnabled} />
    </div>
  );
};

export default NeonGameInterface;
