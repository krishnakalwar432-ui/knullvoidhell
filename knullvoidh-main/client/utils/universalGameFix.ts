/**
 * Universal game fix utility to address all common runtime errors
 */

export interface GameState {
  isInitialized: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  lastUpdate: number;
}

export class UniversalGameFix {
  private static instance: UniversalGameFix;
  private activeGames = new Set<string>();
  private gameStates = new Map<string, GameState>();

  static getInstance(): UniversalGameFix {
    if (!UniversalGameFix.instance) {
      UniversalGameFix.instance = new UniversalGameFix();
    }
    return UniversalGameFix.instance;
  }

  // Safe canvas context getter with fallback
  static getSafeCanvas2DContext(canvas: HTMLCanvasElement | null): CanvasRenderingContext2D | null {
    if (!canvas) {
      console.warn('Canvas element is null');
      return null;
    }

    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Failed to get 2D rendering context');
        return null;
      }
      
      // Verify context is functional
      ctx.save();
      ctx.restore();
      return ctx;
    } catch (error) {
      console.error('Error getting canvas context:', error);
      return null;
    }
  }

  // Safe event listener manager
  static createSafeEventManager() {
    const listeners: Array<{ element: EventTarget; type: string; handler: EventListener }> = [];

    return {
      add: (element: EventTarget, type: string, handler: EventListener) => {
        try {
          element.addEventListener(type, handler);
          listeners.push({ element, type, handler });
        } catch (error) {
          console.error('Error adding event listener:', error);
        }
      },
      cleanup: () => {
        listeners.forEach(({ element, type, handler }) => {
          try {
            element.removeEventListener(type, handler);
          } catch (error) {
            console.error('Error removing event listener:', error);
          }
        });
        listeners.length = 0;
      }
    };
  }

  // Safe animation frame manager
  static createSafeAnimationManager() {
    let animationId: number | null = null;
    let isRunning = false;

    return {
      start: (callback: () => void) => {
        if (isRunning) return;
        
        isRunning = true;
        const animate = () => {
          if (!isRunning) return;
          
          try {
            callback();
          } catch (error) {
            console.error('Animation callback error:', error);
          }
          
          animationId = requestAnimationFrame(animate);
        };
        
        animationId = requestAnimationFrame(animate);
      },
      stop: () => {
        isRunning = false;
        if (animationId !== null) {
          cancelAnimationFrame(animationId);
          animationId = null;
        }
      },
      isRunning: () => isRunning
    };
  }

  // Safe key input manager
  static createSafeKeyManager() {
    const keys = new Set<string>();
    const eventManager = UniversalGameFix.createSafeEventManager();

    const handleKeyDown = (e: KeyboardEvent) => {
      keys.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.delete(e.key.toLowerCase());
    };

    const handleBlur = () => {
      keys.clear();
    };

    eventManager.add(window, 'keydown', handleKeyDown);
    eventManager.add(window, 'keyup', handleKeyUp);
    eventManager.add(window, 'blur', handleBlur);

    return {
      isPressed: (key: string) => keys.has(key.toLowerCase()),
      cleanup: () => {
        keys.clear();
        eventManager.cleanup();
      }
    };
  }

  // Safe collision detection
  static checkCollision(
    obj1: { x: number; y: number; width?: number; height?: number; size?: number },
    obj2: { x: number; y: number; width?: number; height?: number; size?: number }
  ): boolean {
    try {
      if (!obj1 || !obj2 || 
          typeof obj1.x !== 'number' || typeof obj1.y !== 'number' ||
          typeof obj2.x !== 'number' || typeof obj2.y !== 'number') {
        return false;
      }

      const w1 = obj1.width ?? obj1.size ?? 10;
      const h1 = obj1.height ?? obj1.size ?? 10;
      const w2 = obj2.width ?? obj2.size ?? 10;
      const h2 = obj2.height ?? obj2.size ?? 10;

      return obj1.x < obj2.x + w2 &&
             obj1.x + w1 > obj2.x &&
             obj1.y < obj2.y + h2 &&
             obj1.y + h1 > obj2.y;
    } catch (error) {
      console.error('Collision detection error:', error);
      return false;
    }
  }

  // Safe array operations
  static safeFilter<T>(array: T[], predicate: (item: T) => boolean): T[] {
    try {
      if (!Array.isArray(array)) return [];
      return array.filter(predicate);
    } catch (error) {
      console.error('Safe filter error:', error);
      return [];
    }
  }

  static safeMap<T, U>(array: T[], mapper: (item: T, index: number) => U): U[] {
    try {
      if (!Array.isArray(array)) return [];
      return array.map(mapper);
    } catch (error) {
      console.error('Safe map error:', error);
      return [];
    }
  }

  // Safe math operations
  static clamp(value: number, min: number, max: number): number {
    if (typeof value !== 'number' || isNaN(value)) return min;
    return Math.max(min, Math.min(max, value));
  }

  static distance(x1: number, y1: number, x2: number, y2: number): number {
    try {
      const dx = x2 - x1;
      const dy = y2 - y1;
      return Math.sqrt(dx * dx + dy * dy);
    } catch (error) {
      console.error('Distance calculation error:', error);
      return 0;
    }
  }

  // Game lifecycle management
  registerGame(gameId: string): void {
    this.activeGames.add(gameId);
    this.gameStates.set(gameId, {
      isInitialized: false,
      isPaused: false,
      isGameOver: false,
      lastUpdate: Date.now()
    });
  }

  unregisterGame(gameId: string): void {
    this.activeGames.delete(gameId);
    this.gameStates.delete(gameId);
  }

  updateGameState(gameId: string, state: Partial<GameState>): void {
    const currentState = this.gameStates.get(gameId);
    if (currentState) {
      this.gameStates.set(gameId, { ...currentState, ...state, lastUpdate: Date.now() });
    }
  }

  getGameState(gameId: string): GameState | null {
    return this.gameStates.get(gameId) || null;
  }

  // Error reporting
  static reportError(gameId: string, error: Error, context?: string): void {
    console.error(`Game Error [${gameId}]${context ? ` in ${context}` : ''}:`, error);
    
    // In production, you might want to send this to an error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: ErrorTrackingService.report(gameId, error, context);
    }
  }

  // Performance monitoring
  static createPerformanceMonitor(gameId: string) {
    let lastFrameTime = performance.now();
    let frameCount = 0;
    let fpsArray: number[] = [];

    return {
      startFrame: () => {
        const now = performance.now();
        const deltaTime = now - lastFrameTime;
        lastFrameTime = now;
        
        if (deltaTime > 0) {
          const fps = 1000 / deltaTime;
          fpsArray.push(fps);
          frameCount++;
          
          // Keep only last 60 frames for average
          if (fpsArray.length > 60) {
            fpsArray.shift();
          }
          
          // Log performance issues
          if (fps < 30 && frameCount % 60 === 0) {
            console.warn(`Performance warning [${gameId}]: FPS dropped to ${fps.toFixed(1)}`);
          }
        }
      },
      getAverageFPS: () => {
        if (fpsArray.length === 0) return 0;
        return fpsArray.reduce((sum, fps) => sum + fps, 0) / fpsArray.length;
      }
    };
  }
}

// Export singleton instance
export const gameManager = UniversalGameFix.getInstance();

// Export commonly used static methods for convenience
export const {
  getSafeCanvas2DContext,
  createSafeEventManager,
  createSafeAnimationManager, 
  createSafeKeyManager,
  checkCollision,
  safeFilter,
  safeMap,
  clamp,
  distance,
  reportError,
  createPerformanceMonitor
} = UniversalGameFix;
