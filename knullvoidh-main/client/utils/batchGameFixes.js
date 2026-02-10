const fs = require('fs');
const path = require('path');

const GAMES_DIR = path.join(__dirname, '../pages/games');

// Common problematic patterns and their fixes
const FIXES = [
  {
    name: 'Add safe canvas imports',
    pattern: /^import.*from '@\/components\/GameLayout';$/m,
    replacement: (match) => 
      match + '\nimport { getSafeCanvasContext, SafeGameLoop, SafeKeyHandler } from \'@/utils/gameUtils\';'
  },
  
  {
    name: 'Fix canvas context calls',
    pattern: /const ctx = canvas\.getContext\('2d'\);(?!\s*if\s*\(!ctx\)\s*return;)/g,
    replacement: "const ctx = getSafeCanvasContext(canvas);\n    if (!ctx) return;"
  },
  
  {
    name: 'Fix gameLoopRef typing',
    pattern: /const gameLoopRef = useRef<(NodeJS\.Timeout|number)\(\)?\>\(\);?/g,
    replacement: "const gameLoopRef = useRef<SafeGameLoop | null>(null);"
  },
  
  {
    name: 'Fix timer cleanup',
    pattern: /return \(\) => \{\s*if \(gameLoopRef\.current\) \{\s*(clearInterval|cancelAnimationFrame)\(gameLoopRef\.current\);\s*\}\s*\};/g,
    replacement: `return () => {
      if (gameLoopRef.current) {
        gameLoopRef.current.stop();
        gameLoopRef.current = null;
      }
    };`
  },
  
  {
    name: 'Fix interval/RAF setup',
    pattern: /gameLoopRef\.current = (setInterval\(gameLoop, 1000 \/ 60\)|requestAnimationFrame\(gameLoop\));/g,
    replacement: `const safeLoop = new SafeGameLoop(gameLoop, { useRequestAnimationFrame: true });
    gameLoopRef.current = safeLoop;
    safeLoop.start();`
  },
  
  {
    name: 'Fix event listener cleanup',
    pattern: /window\.addEventListener\('keydown', handleKeyDown\);\s*window\.addEventListener\('keyup', handleKeyUp\);\s*return \(\) => \{\s*window\.removeEventListener\('keydown', handleKeyDown\);\s*window\.removeEventListener\('keyup', handleKeyUp\);\s*\};/g,
    replacement: `const keyHandler = new SafeKeyHandler();
    keyHandlerRef.current = keyHandler;
    
    return () => {
      if (keyHandlerRef.current) {
        keyHandlerRef.current.cleanup();
        keyHandlerRef.current = null;
      }
    };`
  },
  
  {
    name: 'Add key handler ref',
    pattern: /const gameLoopRef = useRef<SafeGameLoop \| null>\(null\);/g,
    replacement: `const gameLoopRef = useRef<SafeGameLoop | null>(null);
  const keyHandlerRef = useRef<SafeKeyHandler | null>(null);`
  },
  
  {
    name: 'Fix key checking patterns',
    pattern: /(keys\.has|keysRef\.current\.has)\('([^']+)'\)/g,
    replacement: (match, prefix, key) => 
      `keyHandlerRef.current?.isPressed('${key.toLowerCase()}')`
  },
  
  {
    name: 'Remove manual key management',
    pattern: /keysRef\.current\.(add|delete)\([^)]+\);/g,
    replacement: "// Key management handled by SafeKeyHandler"
  }
];

async function fixGameFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Skip if already has safe imports
    if (content.includes('getSafeCanvasContext')) {
      console.log(`Skipping ${path.basename(filePath)} - already fixed`);
      return;
    }
    
    // Apply fixes in order
    FIXES.forEach(fix => {
      const newContent = content.replace(fix.pattern, fix.replacement);
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
        console.log(`Applied "${fix.name}" to ${path.basename(filePath)}`);
      }
    });
    
    // Additional manual fixes for common issues
    if (content.includes('gameLoop') && !content.includes('SafeGameLoop')) {
      // Fix missing dependencies in useEffect
      content = content.replace(
        /useEffect\(\(\) => \{\s*gameLoopRef\.current = setInterval\(gameLoop, 1000 \/ 60\);[\s\S]*?\}, \[gameLoop\]\);/g,
        `useEffect(() => {
    const safeLoop = new SafeGameLoop(gameLoop, { useRequestAnimationFrame: true });
    gameLoopRef.current = safeLoop;
    safeLoop.start();
    
    return () => {
      if (gameLoopRef.current) {
        gameLoopRef.current.stop();
        gameLoopRef.current = null;
      }
    };
  }, [gameLoop]);`
      );
      hasChanges = true;
    }
    
    // Write back if changes were made
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${path.basename(filePath)}`);
    } else {
      console.log(`⚪ No changes needed: ${path.basename(filePath)}`);
    }
    
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

async function fixAllGames() {
  try {
    const files = fs.readdirSync(GAMES_DIR);
    const gameFiles = files.filter(file => file.endsWith('.tsx'));
    
    console.log(`🔧 Found ${gameFiles.length} game files to fix...`);
    
    let fixedCount = 0;
    for (const file of gameFiles) {
      const filePath = path.join(GAMES_DIR, file);
      await fixGameFile(filePath);
      fixedCount++;
      
      // Progress indicator
      if (fixedCount % 10 === 0) {
        console.log(`📊 Progress: ${fixedCount}/${gameFiles.length} files processed`);
      }
    }
    
    console.log(`🎉 Completed fixing ${fixedCount} game files!`);
  } catch (error) {
    console.error('❌ Error fixing games:', error);
  }
}

// Run if called directly
if (require.main === module) {
  fixAllGames();
}

module.exports = { fixAllGames, fixGameFile };
