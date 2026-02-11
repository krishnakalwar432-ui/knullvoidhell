import "./global.css";
import { useState } from "react";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider } from "@/context/AuthContext";
import { LeaderboardProvider } from "@/context/LeaderboardContext";
import { ThemeProvider } from "@/themes/ThemeProvider";
import LoadingScreen from "@/components/LoadingScreen";
import CursorTrail from "@/components/enhancements/CursorTrail";
import ScreenOverlay from "@/components/enhancements/ScreenOverlay";

// Core pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ComingSoon from "./pages/ComingSoon";

// Keep some working games that weren't in the removal list
import SpaceInvaders from "./pages/games/SpaceInvaders";
import NeonPong from "./pages/games/NeonPong";
import InfiniteRunner from "./pages/games/InfiniteRunner";
import BlackHolePuzzle from "./pages/games/BlackHolePuzzle";
import CyberSlash from "./pages/games/CyberSlash";
import GravityDodge from "./pages/games/GravityDodge";
import CryptoMiner from "./pages/games/CryptoMiner";
import AIDungeon from "./pages/games/AIDungeon";
import QuantumTetris from "./pages/games/QuantumTetris";
import PlasmaSnake from "./pages/games/PlasmaSnake";
import SingularityClicker from "./pages/games/SingularityClicker";
import GlitchPainter from "./pages/games/GlitchPainter";
import PixelZombies from "./pages/games/PixelZombies";
import BeatSyncRhythm from "./pages/games/BeatSyncRhythm";

// New games
import Run3WebGL from "./pages/games/Run3WebGL";
import Slope from "./pages/games/Slope";
import GSwitch3 from "./pages/games/GSwitch3";
import Ovo from "./pages/games/Ovo";
import TombRunner from "./pages/games/TombRunner";
import GalagaSpecialEdition from "./pages/games/GalagaSpecialEdition";
import NovaDefender from "./pages/games/NovaDefender";
import SpaceBlaze2 from "./pages/games/SpaceBlaze2";
import GalaxyWarriors from "./pages/games/GalaxyWarriors";
import AlienSkyInvasion from "./pages/games/AlienSkyInvasion";
import Snake3310 from "./pages/games/Snake3310";
import BounceClassicHTML5 from "./pages/games/BounceClassicHTML5";
import SpaceImpactReborn from "./pages/games/SpaceImpactReborn";
import RapidRoll from "./pages/games/RapidRoll";
// removed CarRacing2DRetro
import KingdomRush from "./pages/games/KingdomRush";
import BloonsTD5 from "./pages/games/BloonsTD5";
import CursedTreasure from "./pages/games/CursedTreasure";
import ZombieDefenseHTML5 from "./pages/games/ZombieDefenseHTML5";
import EmpireDefenderTD from "./pages/games/EmpireDefenderTD";
import PlantsVsGoblins from "./pages/games/PlantsVsGoblins";
import DefendTheCastle from "./pages/games/DefendTheCastle";
import ProtectTheGarden from "./pages/games/ProtectTheGarden";
import SwampAttackWeb from "./pages/games/SwampAttackWeb";
import TinyDefense2 from "./pages/games/TinyDefense2";
import SniperClash3D from "./pages/games/SniperClash3D";
import MiniRoyale2 from "./pages/games/MiniRoyale2";
import CombatReloaded from "./pages/games/CombatReloaded";

// Additional 57 games for 100 total
// removed NeonRacer3D
import NeonParkour from "./pages/games/NeonParkour";
// removed SpaceRally
import CyberQuest from "./pages/games/CyberQuest";
import NeonBlocks from "./pages/games/NeonBlocks";
import QuantumLeap from "./pages/games/QuantumLeap";
import QuantumMaze from "./pages/games/QuantumMaze";
import AsteroidBlaster from "./pages/games/AsteroidBlaster";
import PlasmaPong from "./pages/games/PlasmaPong";
import NeonFrogger from "./pages/games/NeonFrogger";
import QuantumCentipede from "./pages/games/QuantumCentipede";
import CyberBrawler from "./pages/games/CyberBrawler";
import ShadowNinja from "./pages/games/ShadowNinja";
import PlasmaWarrior from "./pages/games/PlasmaWarrior";
import LaserCommando from "./pages/games/LaserCommando";
import MechAssault from "./pages/games/MechAssault";
import CircuitSolver from "./pages/games/CircuitSolver";
import CrystalCascade from "./pages/games/CrystalCascade";
import GravityShift from "./pages/games/GravityShift";
// removed TurboDrift
import CyberJumper from "./pages/games/CyberJumper";
import NeonPacman from "./pages/games/NeonPacman";
import NeonClicker from "./pages/games/NeonClicker";
// removed QuantumKart
// removed CyberMotocross

// 3D Landing page
import Interactive3DLanding from "./pages/Interactive3DLanding";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Leaderboards from "./pages/Leaderboards";
import News from "./pages/News";

// New replacements
import NeonDriftOverdrive from "./pages/games/NeonDriftOverdrive";
import ShadowBotProtocol from "./pages/games/ShadowBotProtocol";
import CyberStrikeArena from "./pages/games/CyberStrikeArena";
import PixelForgeTycoon from "./pages/games/PixelForgeTycoon";
import AstralLeap from "./pages/games/AstralLeap";
import FirewallRunner from "./pages/games/FirewallRunner";

const queryClient = new QueryClient();

const App = () => {
  const [showLoading, setShowLoading] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ThemeProvider>
          {showLoading && <LoadingScreen onComplete={() => setShowLoading(false)} />}
          <CursorTrail />
          <ScreenOverlay />
          <AuthProvider>
            <LeaderboardProvider>
              <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-black text-white px-3 py-2 rounded">Skip to content</a>
              <BrowserRouter>
                <ErrorBoundary>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/3d" element={<Interactive3DLanding />} />
                    <Route path="/coming-soon" element={<ComingSoon />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/leaderboards" element={<Leaderboards />} />
                    <Route path="/news" element={<News />} />

                    {/* Keep existing working games */}
                    <Route path="/game/space-invaders" element={<SpaceInvaders />} />
                    <Route path="/game/neon-pong" element={<NeonPong />} />
                    <Route path="/game/infinite-runner" element={<InfiniteRunner />} />
                    <Route path="/game/black-hole-puzzle" element={<BlackHolePuzzle />} />
                    <Route path="/game/cyber-slash" element={<CyberSlash />} />
                    <Route path="/game/gravity-dodge" element={<GravityDodge />} />
                    <Route path="/game/crypto-miner" element={<CryptoMiner />} />
                    <Route path="/game/ai-dungeon" element={<AIDungeon />} />
                    <Route path="/game/quantum-tetris" element={<QuantumTetris />} />
                    <Route path="/game/plasma-snake" element={<PlasmaSnake />} />
                    <Route path="/game/singularity-clicker" element={<SingularityClicker />} />
                    <Route path="/game/glitch-painter" element={<GlitchPainter />} />
                    <Route path="/game/pixel-zombies" element={<PixelZombies />} />
                    <Route path="/game/beat-sync-rhythm" element={<BeatSyncRhythm />} />

                    {/* New games - Runners */}
                    <Route path="/game/run3-webgl" element={<Run3WebGL />} />
                    <Route path="/game/slope" element={<Slope />} />
                    <Route path="/game/g-switch-3" element={<GSwitch3 />} />
                    <Route path="/game/ovo" element={<Ovo />} />
                    <Route path="/game/tomb-runner" element={<TombRunner />} />

                    {/* New games - Shooters */}
                    <Route path="/game/galaga-special-edition" element={<GalagaSpecialEdition />} />
                    <Route path="/game/nova-defender" element={<NovaDefender />} />
                    <Route path="/game/space-blaze-2" element={<SpaceBlaze2 />} />
                    <Route path="/game/galaxy-warriors" element={<GalaxyWarriors />} />
                    <Route path="/game/alien-sky-invasion" element={<AlienSkyInvasion />} />
                    <Route path="/game/sniper-clash-3d" element={<SniperClash3D />} />
                    <Route path="/game/mini-royale-2" element={<MiniRoyale2 />} />
                    <Route path="/game/combat-reloaded" element={<CombatReloaded />} />

                    {/* New games - Classic */}
                    <Route path="/game/snake-3310" element={<Snake3310 />} />
                    <Route path="/game/bounce-classic-html5" element={<BounceClassicHTML5 />} />
                    <Route path="/game/space-impact-reborn" element={<SpaceImpactReborn />} />
                    <Route path="/game/rapid-roll" element={<RapidRoll />} />

                    {/* New games - Tower Defense */}
                    <Route path="/game/kingdom-rush" element={<KingdomRush />} />
                    <Route path="/game/bloons-td5" element={<BloonsTD5 />} />
                    <Route path="/game/cursed-treasure" element={<CursedTreasure />} />
                    <Route path="/game/zombie-defense-html5" element={<ZombieDefenseHTML5 />} />
                    <Route path="/game/empire-defender-td" element={<EmpireDefenderTD />} />
                    <Route path="/game/plants-vs-goblins" element={<PlantsVsGoblins />} />
                    <Route path="/game/defend-the-castle" element={<DefendTheCastle />} />
                    <Route path="/game/protect-the-garden" element={<ProtectTheGarden />} />
                    <Route path="/game/swamp-attack-web" element={<SwampAttackWeb />} />
                    <Route path="/game/tiny-defense-2" element={<TinyDefense2 />} />

                    {/* New replacements */}
                    <Route path="/game/neon-drift-overdrive" element={<NeonDriftOverdrive />} />
                    <Route path="/game/shadow-bot-protocol" element={<ShadowBotProtocol />} />
                    <Route path="/game/cyber-strike-arena" element={<CyberStrikeArena />} />
                    <Route path="/game/pixel-forge-tycoon" element={<PixelForgeTycoon />} />
                    <Route path="/game/astral-leap" element={<AstralLeap />} />
                    <Route path="/game/firewall-runner" element={<FirewallRunner />} />

                    {/* Additional 57 Games - Starting with Racing */}
                    <Route path="/game/neon-parkour" element={<NeonParkour />} />
                    <Route path="/game/cyber-quest" element={<CyberQuest />} />
                    <Route path="/game/neon-blocks" element={<NeonBlocks />} />
                    <Route path="/game/quantum-leap" element={<QuantumLeap />} />
                    <Route path="/game/quantum-maze" element={<QuantumMaze />} />
                    <Route path="/game/asteroid-blaster" element={<AsteroidBlaster />} />
                    <Route path="/game/plasma-pong" element={<PlasmaPong />} />
                    <Route path="/game/neon-frogger" element={<NeonFrogger />} />
                    <Route path="/game/quantum-centipede" element={<QuantumCentipede />} />
                    <Route path="/game/cyber-brawler" element={<CyberBrawler />} />
                    <Route path="/game/shadow-ninja" element={<ShadowNinja />} />
                    <Route path="/game/plasma-warrior" element={<PlasmaWarrior />} />
                    <Route path="/game/laser-commando" element={<LaserCommando />} />
                    <Route path="/game/mech-assault" element={<MechAssault />} />
                    <Route path="/game/circuit-solver" element={<CircuitSolver />} />
                    <Route path="/game/crystal-cascade" element={<CrystalCascade />} />
                    <Route path="/game/gravity-shift" element={<GravityShift />} />
                    <Route path="/game/cyber-jumper" element={<CyberJumper />} />
                    <Route path="/game/neon-pacman" element={<NeonPacman />} />
                    <Route path="/game/neon-clicker" element={<NeonClicker />} />

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </ErrorBoundary>
              </BrowserRouter>
            </LeaderboardProvider>
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
