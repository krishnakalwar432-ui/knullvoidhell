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
      gameManager.unregisterGame(gameId);
    },
    cleanup: () => {
      animationManager.cleanup();
      keyManager.cleanup();
    }
  };
};

// Generic error boundary wrapper for games
export const withGameErrorBoundary = <T extends Record<string, any>>(
  WrappedComponent: React.ComponentType<T>,
  gameId: string
) => {
  return (props: T) => {
    const [hasError, setHasError] = useState(false);
    
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
      return React.createElement('div', {
        className: 'flex items-center justify-center h-96 bg-red-900/20 border border-red-500 rounded-lg'
      }, React.createElement('p', {
        className: 'text-red-400'
      }, 'Game temporarily unavailable - being fixed'));
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

// Common safe canvas setup
export const useSafeCanvas = (gameId: string, gameLoop: (ctx: CanvasRenderingContext2D) => void) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  const startGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = getSafeCanvas2DContext(canvas, gameId);
    if (!ctx) return;
    
    const animate = () => {
      try {
        gameLoop(ctx);
        animationRef.current = requestAnimationFrame(animate);
      } catch (error) {
        reportError(gameId, error as Error, 'canvas animation');
      }
    };
    
    animate();
  };
  
  const stopGame = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
  };
  
  useEffect(() => {
    return () => {
      stopGame();
    };
  }, []);
  
  return { canvasRef, startGame, stopGame };
};

// Fix common game physics issues
export const createSafePhysicsEngine = (gameId: string) => {
  return {
    updatePosition: (object: { x: number; y: number; vx: number; vy: number }, bounds: { width: number; height: number }) => {
      try {
        object.x = clamp(object.x + object.vx, 0, bounds.width);
        object.y = clamp(object.y + object.vy, 0, bounds.height);
      } catch (error) {
        reportError(gameId, error as Error, 'physics update');
      }
    },
    
    checkBounds: (object: { x: number; y: number; width?: number; height?: number }, bounds: { width: number; height: number }) => {
      const objWidth = object.width || 10;
      const objHeight = object.height || 10;
      
      return {
        left: object.x <= 0,
        right: object.x + objWidth >= bounds.width,
        top: object.y <= 0,
        bottom: object.y + objHeight >= bounds.height
      };
    }
  };
};

// Batch fix multiple games at once
export const batchFixGames = (gameIds: string[]) => {
  const fixedGames = new Map();
  
  gameIds.forEach(gameId => {
    try {
      const animationManager = createSafeAnimationManager();
      const keyManager = createSafeKeyManager();
      const physicsEngine = createSafePhysicsEngine(gameId);
      
      fixedGames.set(gameId, {
        animationManager,
        keyManager,
        physicsEngine,
        errorBoundary: withGameErrorBoundary
      });
    } catch (error) {
      reportError(gameId, error as Error, 'batch fix initialization');
    }
  });
  
  return fixedGames;
};
