/**
 * Comprehensive script to fix common game runtime issues
 */

import fs from 'fs';
import path from 'path';

const GAMES_DIR = path.join(__dirname, '../pages/games');

// Patterns to fix
const fixes = [
  // Fix 1: Add proper canvas context null checks
  {
    pattern: /const ctx = canvas\.getContext\('2d'\);(?!\s*if\s*\(!ctx\)\s*return;)/g,
    replacement: "const ctx = canvas.getContext('2d');\n    if (!ctx) return;"
  },
  
  // Fix 2: Fix non-null assertion operators
  {
    pattern: /gameLoopRef\.current!/g,
    replacement: "gameLoopRef.current"
  },
  
  // Fix 3: Add proper interval cleanup
  {
    pattern: /return \(\) => clearInterval\(gameLoopRef\.current\);/g,
    replacement: "return () => {\n      if (gameLoopRef.current) {\n        clearInterval(gameLoopRef.current);\n        gameLoopRef.current = undefined;\n      }\n    };"
  },
  
  // Fix 4: Add proper RAF cleanup
  {
    pattern: /return \(\) => cancelAnimationFrame\(gameLoopRef\.current\);/g,
    replacement: "return () => {\n      if (gameLoopRef.current) {\n        cancelAnimationFrame(gameLoopRef.current);\n        gameLoopRef.current = undefined;\n      }\n    };"
  },
  
  // Fix 5: Fix event listener cleanup
  {
    pattern: /window\.addEventListener\('keydown', handleKeyDown\);\s*window\.addEventListener\('keyup', handleKeyUp\);/g,
    replacement: `window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };`
  },
  
  // Fix 6: Standardize key handling
  {
    pattern: /e\.key(?!\.toLowerCase\(\))/g,
    replacement: "e.key.toLowerCase()"
  },
  
  // Fix 7: Fix missing canvas null checks
  {
    pattern: /const canvas = canvasRef\.current;(?!\s*if\s*\(!canvas\)\s*return;)/g,
    replacement: "const canvas = canvasRef.current;\n    if (!canvas) return;"
  }
];

// Additional imports to add
const SAFE_IMPORTS = `import { getSafeCanvasContext, SafeGameLoop, SafeKeyHandler, isInBounds, checkCollision } from '@/utils/gameUtils';`;

async function fixGameFile(filePath: string): Promise<void> {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Apply fixes
    fixes.forEach(fix => {
      const newContent = content.replace(fix.pattern, fix.replacement);
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
      }
    });
    
    // Add safe imports if needed
    if (content.includes('getContext') && !content.includes('getSafeCanvasContext')) {
      const importIndex = content.indexOf("import GameLayout from '@/components/GameLayout';");
      if (importIndex !== -1) {
        content = content.slice(0, importIndex) + 
                 SAFE_IMPORTS + '\n' + 
                 content.slice(importIndex);
        hasChanges = true;
      }
    }
    
    // Write back if changes were made
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed: ${path.basename(filePath)}`);
    }
    
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error);
  }
}

async function fixAllGames(): Promise<void> {
  try {
    const files = fs.readdirSync(GAMES_DIR);
    const gameFiles = files.filter(file => file.endsWith('.tsx'));
    
    console.log(`Found ${gameFiles.length} game files to fix...`);
    
    for (const file of gameFiles) {
      const filePath = path.join(GAMES_DIR, file);
      await fixGameFile(filePath);
    }
    
    console.log('All games fixed!');
  } catch (error) {
    console.error('Error fixing games:', error);
  }
}

// Export for use
export { fixAllGames, fixGameFile };

// Run if called directly
if (require.main === module) {
  fixAllGames();
}
