import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, RotateCcw, Pause, Play, Smartphone, Gamepad2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import OceanBackground from './OceanBackground';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLeaderboard } from '@/context/LeaderboardContext';

interface GameLayoutProps {
  gameTitle: string;
  gameCategory: string;
  score?: number;
  isPlaying?: boolean;
  onPause?: () => void;
  onReset?: () => void;
  children: React.ReactNode;
  showMobileControls?: boolean;
  onMobileControlPress?: (control: string) => void;
}

const GameLayout: React.FC<GameLayoutProps> = ({
  gameTitle,
  gameCategory,
  score,
  isPlaying = false,
  onPause,
  onReset,
  children,
  showMobileControls = false,
  onMobileControlPress
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const location = useLocation();
  const { user, updateProfile } = useAuth();
  const { submitScore } = useLeaderboard();
  const lastScoreRef = useRef<number>(0);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
      setIsFullscreen(true);
    }
  };

  useEffect(() => {
    if (typeof score === 'number' && score > (lastScoreRef.current || 0) && user) {
      const path = location.pathname;
      const gid = path.startsWith('/game/') ? path.split('/game/')[1] : gameTitle.toLowerCase().replace(/\s+/g,'-');
      submitScore(user, gid, score);
      lastScoreRef.current = score;
      updateProfile({ stats: { [gid]: { highScore: score, plays: ((user.stats[gid]?.plays)||0)+1, lastPlayed: Date.now() } } as any });
    }
  }, [score, user, location.pathname, gameTitle, submitScore, updateProfile]);

  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const MobileControls = () => (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
      <div className="bg-black/80 backdrop-blur-md rounded-2xl p-4 border border-gray-700">
        <div className="grid grid-cols-3 gap-4">
          {/* Left side - Directional pad */}
          <div className="relative">
            <div className="grid grid-cols-3 grid-rows-3 gap-1 w-24 h-24 mx-auto">
              <div></div>
              <Button
                variant="ghost"
                size="sm"
                className="bg-gray-800/50 border border-gray-600 h-6"
                onTouchStart={() => onMobileControlPress?.('up')}
                onTouchEnd={() => onMobileControlPress?.('up-release')}
              >
                ↑
              </Button>
              <div></div>
              
              <Button
                variant="ghost"
                size="sm"
                className="bg-gray-800/50 border border-gray-600 w-6"
                onTouchStart={() => onMobileControlPress?.('left')}
                onTouchEnd={() => onMobileControlPress?.('left-release')}
              >
                ←
              </Button>
              <div className="bg-gray-700/30 rounded border border-gray-600"></div>
              <Button
                variant="ghost"
                size="sm"
                className="bg-gray-800/50 border border-gray-600 w-6"
                onTouchStart={() => onMobileControlPress?.('right')}
                onTouchEnd={() => onMobileControlPress?.('right-release')}
              >
                →
              </Button>
              
              <div></div>
              <Button
                variant="ghost"
                size="sm"
                className="bg-gray-800/50 border border-gray-600 h-6"
                onTouchStart={() => onMobileControlPress?.('down')}
                onTouchEnd={() => onMobileControlPress?.('down-release')}
              >
                ↓
              </Button>
              <div></div>
            </div>
          </div>

          {/* Center - Game controls */}
          <div className="flex flex-col gap-2 items-center">
            {onPause && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPause}
                className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 w-12 h-12"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={isFullscreen ? exitFullscreen : enterFullscreen}
              className="bg-gray-800/50 border border-gray-600 w-12 h-12"
            >
              <Smartphone className="w-4 h-4" />
            </Button>
          </div>

          {/* Right side - Action buttons */}
          <div className="flex flex-col gap-2 items-center">
            <Button
              variant="ghost"
              size="sm"
              className="bg-red-800/50 border border-red-600 rounded-full w-12 h-12"
              onTouchStart={() => onMobileControlPress?.('action-a')}
              onTouchEnd={() => onMobileControlPress?.('action-a-release')}
            >
              A
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="bg-blue-800/50 border border-blue-600 rounded-full w-12 h-12"
              onTouchStart={() => onMobileControlPress?.('action-b')}
              onTouchEnd={() => onMobileControlPress?.('action-b-release')}
            >
              B
            </Button>
          </div>
        </div>
        
        {/* Bottom row - Special actions */}
        <div className="flex justify-center gap-4 mt-3 pt-3 border-t border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            className="bg-gray-800/50 border border-gray-600 px-4"
            onTouchStart={() => onMobileControlPress?.('space')}
            onTouchEnd={() => onMobileControlPress?.('space-release')}
          >
            SPACE
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="bg-gray-800/50 border border-gray-600 px-4"
            onTouchStart={() => onMobileControlPress?.('enter')}
            onTouchEnd={() => onMobileControlPress?.('enter-release')}
          >
            ENTER
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative">
      {/* Ocean themed background */}
      <OceanBackground
        intensity="medium"
        theme="ocean"
        className="opacity-40"
      />
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-teal-900/10 to-cyan-900/20 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,150,255,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,100,150,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(0,200,200,0.1),transparent_50%)]"></div>
      </div>
      
      {/* Game Header - Mobile Optimized */}
      <header className="bg-black/90 backdrop-blur-md border-b border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 md:px-4 py-2 md:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
              <Link to="/">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-2 md:px-3">
                  <ArrowLeft className="w-4 h-4 md:mr-1" />
                  <span className="hidden md:inline">Back</span>
                </Button>
              </Link>
              
              <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                <h1 className="text-sm md:text-lg font-bold text-white truncate">{gameTitle}</h1>
                <Badge variant="secondary" className="text-xs bg-purple-900/50 text-purple-300 hidden sm:inline">
                  {gameCategory}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3">
              {score !== undefined && (
                <div className="text-xs md:text-sm">
                  <span className="text-gray-400 hidden md:inline">Score: </span>
                  <span className="font-bold text-green-400">{score.toLocaleString()}</span>
                </div>
              )}
              
              <div className="flex gap-1 md:gap-2">
                {isMobile && showMobileControls && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 p-2"
                  >
                    <Gamepad2 className="w-4 h-4" />
                  </Button>
                )}

                {onPause && !isMobile && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={onPause}
                    className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 p-2 md:px-3"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                )}
                
                {onReset && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={onReset}
                    className="border-green-500/50 text-green-400 hover:bg-green-500/10 p-2 md:px-3"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                )}
                
                <Link to="/">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-gray-600 hover:border-gray-400 p-2 md:px-3"
                  >
                    <Home className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Game Content - Mobile Optimized */}
      <main className={`relative ${isMobile ? 'pb-32' : ''}`}>
        <div className="max-w-full overflow-x-auto">
          {children}
        </div>
      </main>

      {/* Mobile Controls */}
      {isMobile && showMobileControls && <MobileControls />}

      {/* Mobile Game Instructions */}
      {isMobile && (
        <div className="fixed top-16 left-2 right-2 z-40 md:hidden">
          <div className="bg-black/80 backdrop-blur-md rounded-lg p-3 border border-gray-700/50">
            <p className="text-xs text-gray-300 text-center">
              Use the on-screen controls below or touch gestures to play
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameLayout;
