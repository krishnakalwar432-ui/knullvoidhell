/**
 * Safe game development utilities to prevent common runtime errors
 */

export interface GameCleanup {
  (): void;
}

export interface SafeGameLoopOptions {
  fps?: number;
  useRequestAnimationFrame?: boolean;
}

/**
 * Safe canvas context getter with null check
 */
export const getSafeCanvasContext = (canvas: HTMLCanvasElement | null): CanvasRenderingContext2D | null => {
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.warn('Failed to get 2D rendering context');
    return null;
  }
  return ctx;
};

/**
 * Safe game loop manager with proper cleanup
 */
export class SafeGameLoop {
  private gameLoopId: number | NodeJS.Timeout | null = null;
  private isRunning = false;
  private useRAF: boolean;

  constructor(private gameFunction: () => void, options: SafeGameLoopOptions = {}) {
    this.useRAF = options.useRequestAnimationFrame ?? true;
  }

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    if (this.useRAF) {
      const loop = () => {
        if (!this.isRunning) return;
        this.gameFunction();
        this.gameLoopId = requestAnimationFrame(loop);
      };
      this.gameLoopId = requestAnimationFrame(loop);
    } else {
      this.gameLoopId = setInterval(this.gameFunction, 1000 / 60);
    }
  }

  stop(): void {
    this.isRunning = false;
    
    if (this.gameLoopId !== null) {
      if (this.useRAF) {
        cancelAnimationFrame(this.gameLoopId as number);
      } else {
        clearInterval(this.gameLoopId as NodeJS.Timeout);
      }
      this.gameLoopId = null;
    }
  }

  isActive(): boolean {
    return this.isRunning;
  }
}

/**
 * Safe key handler manager with automatic cleanup
 */
export class SafeKeyHandler {
  private keys = new Set<string>();
  private listeners: Array<{ element: EventTarget; type: string; handler: EventListener }> = [];

  constructor() {
    this.addKeyListeners();
  }

  private addKeyListeners(): void {
    const handleKeyDown = (e: KeyboardEvent) => {
      this.keys.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      this.keys.delete(e.key.toLowerCase());
    };

    const handleBlur = () => {
      this.keys.clear();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    this.listeners.push(
      { element: window, type: 'keydown', handler: handleKeyDown },
      { element: window, type: 'keyup', handler: handleKeyUp },
      { element: window, type: 'blur', handler: handleBlur }
    );
  }

  isPressed(key: string): boolean {
    return this.keys.has(key.toLowerCase());
  }

  cleanup(): void {
    this.listeners.forEach(({ element, type, handler }) => {
      element.removeEventListener(type, handler);
    });
    this.listeners = [];
    this.keys.clear();
  }
}

/**
 * Safe bounds checking for canvas rendering
 */
export const isInBounds = (x: number, y: number, width: number, height: number, canvasWidth: number, canvasHeight: number): boolean => {
  return x + width >= 0 && x <= canvasWidth && y + height >= 0 && y <= canvasHeight;
};

/**
 * Safe object validation
 */
export const isValidGameObject = (obj: any): boolean => {
  return obj && typeof obj === 'object' && typeof obj.x === 'number' && typeof obj.y === 'number';
};

/**
 * Safe collision detection
 */
export const checkCollision = (
  obj1: { x: number; y: number; width?: number; height?: number; size?: number },
  obj2: { x: number; y: number; width?: number; height?: number; size?: number }
): boolean => {
  if (!isValidGameObject(obj1) || !isValidGameObject(obj2)) return false;

  const w1 = obj1.width ?? obj1.size ?? 10;
  const h1 = obj1.height ?? obj1.size ?? 10;
  const w2 = obj2.width ?? obj2.size ?? 10;
  const h2 = obj2.height ?? obj2.size ?? 10;

  return (
    obj1.x < obj2.x + w2 &&
    obj1.x + w1 > obj2.x &&
    obj1.y < obj2.y + h2 &&
    obj1.y + h1 > obj2.y
  );
};

/**
 * Safe array operations
 */
export const safeArrayFilter = <T>(array: T[], predicate: (item: T) => boolean): T[] => {
  if (!Array.isArray(array)) return [];
  return array.filter(predicate);
};

export const safeArrayMap = <T, U>(array: T[], mapper: (item: T) => U): U[] => {
  if (!Array.isArray(array)) return [];
  return array.map(mapper);
};

/**
 * Hook for safe game development
 */
export const useGameCleanup = (): GameCleanup[] => {
  const cleanupFunctions: GameCleanup[] = [];

  const addCleanup = (cleanup: GameCleanup): void => {
    cleanupFunctions.push(cleanup);
  };

  const executeCleanup = (): void => {
    cleanupFunctions.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.warn('Error during cleanup:', error);
      }
    });
    cleanupFunctions.length = 0;
  };

  return [addCleanup, executeCleanup];
};
