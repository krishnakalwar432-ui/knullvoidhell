/**
 * Batch fix utilities for multiple problematic games
 */

import React, { useRef, useState, useEffect } from 'react';
import { 
  getSafeCanvas2DContext, 
  createSafeAnimationManager, 
  createSafeKeyManager,
  checkCollision,
  clamp,
  gameManager,
  reportError
} from '@/utils/universalGameFix';

// Template for fixing games with setInterval issues
export const fixSetIntervalGame = (gameId: string, originalGameLoop: Function) => {
  const animationManager = createSafeAnimationManager();
  const keyManager = createSafeKeyManager();
  
  return {
    start: () => {
      gameManager.registerGame(gameId);
      animationManager.start(() => {
        try {
          originalGameLoop(keyManager);
        } catch (error) {
          reportError(gameId, error as Error);
        }
      });
    },
    stop: () => {
      animationManager.stop();
      keyManager.cleanup();
      gameManager.unregisterGame(gameId);
    },
    keyManager
  };
};

// Utility to safely wrap problematic games
export const createSafeGameWrapper = (gameId: string) => {
  return function SafeGameWrapper(WrappedComponent: React.ComponentType<any>) {
    return function SafeWrappedGame(props: any) {
      const [hasError, setHasError] = useState(false);
      
      useEffect(() => {
        gameManager.registerGame(gameId);
        return () => gameManager.unregisterGame(gameId);
      }, []);
      
      useEffect(() => {
        const handleError = (error: ErrorEvent) => {
          if (error.filename?.includes(gameId)) {
            reportError(gameId, new Error(error.message), 'runtime error');
            setHasError(true);
          }
        };
        
        window.addEventListener('error', handleError);
        return () => window.removeEventListener('error', handleError);
      }, []);
      
      if (hasError) {
        return (
          <div className="flex items-center justify-center h-96 bg-red-900/20 border border-red-500 rounded-lg">
            <p className="text-red-400">Game temporarily unavailable - being fixed</p>
          </div>
        );
      }
      
      try {
        return React.createElement(WrappedComponent, props);
      } catch (error) {
        reportError(gameId, error as Error, 'component render');
        setHasError(true);
        return null;
      }
    };
  };
};

// Common safe canvas setup hook
export const useSafeCanvas = (gameId: string, gameLoop: (ctx: CanvasRenderingContext2D) => void) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationManagerRef = useRef(createSafeAnimationManager());
  
  useEffect(() => {
    gameManager.registerGame(gameId);
    
    const safeGameLoop = () => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = getSafeCanvas2DContext(canvas);
        if (!ctx) return;
        
        gameLoop(ctx);
      } catch (error) {
        reportError(gameId, error as Error, 'canvas loop');
      }
    };
    
    animationManagerRef.current.start(safeGameLoop);
    
    return () => {
      animationManagerRef.current.stop();
      gameManager.unregisterGame(gameId);
    };
  }, [gameId, gameLoop]);
  
  return canvasRef;
};

// Safe key input hook
export const useSafeKeys = () => {
  const keyManagerRef = useRef(createSafeKeyManager());
  
  useEffect(() => {
    return () => {
      keyManagerRef.current.cleanup();
    };
  }, []);
  
  return keyManagerRef.current;
};
