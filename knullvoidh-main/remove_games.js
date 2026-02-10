const fs = require('fs');

// Games to remove
const gamesToRemove = [
  'memory-matrix',
  'laser-deflector', 
  'nano-racing',
  'retro-racer',
  'circuit-breaker',
  'ai-combat-arena',
  'cybernetic-farm',
  'gravity-flip-adventure',
  'neon-battle-royale',
  'data-stream-runner',
  'augmented-reality-quest',
  'biohazard-survival',
  'galactic-trader',
  'memory-maze-challenge',
  'cyberpunk-detective',
  'virtual-reality-explorer',
  'digital-dungeon-crawler',
  'blipzkrieg',
  'dead-zone-escape',
  'nano-bots-rampage',
  'shatterpoint-assault',
  'hexblade-trials',
  'crimson-blade-rush',
  'zero-signal-showdown',
  'shadow-arena-brawl'
];

// Read the games.ts file
const gamesContent = fs.readFileSync('shared/games.ts', 'utf8');

// Split into lines
let lines = gamesContent.split('\n');

// Find game objects and remove them
let newLines = [];
let skip = false;
let braceCount = 0;
let inGameObject = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Check if this line starts a game object
  if (line.trim().startsWith('{') && !inGameObject) {
    // Look ahead to see if this game should be removed
    let shouldRemove = false;
    for (let j = i; j < Math.min(i + 10, lines.length); j++) {
      const checkLine = lines[j];
      if (checkLine.includes('id:')) {
        const idMatch = checkLine.match(/id:\s*['"`]([^'"`]+)['"`]/);
        if (idMatch && gamesToRemove.includes(idMatch[1])) {
          shouldRemove = true;
          break;
        }
      }
    }
    
    if (shouldRemove) {
      skip = true;
      braceCount = 1;
      inGameObject = true;
      continue;
    }
  }
  
  if (skip) {
    // Count braces to know when the object ends
    const openBraces = (line.match(/{/g) || []).length;
    const closeBraces = (line.match(/}/g) || []).length;
    braceCount += openBraces - closeBraces;
    
    if (braceCount <= 0) {
      skip = false;
      inGameObject = false;
      // Also skip the trailing comma if it exists
      if (i + 1 < lines.length && lines[i + 1].trim() === ',') {
        i++; // Skip the comma line too
      }
    }
    continue;
  }
  
  newLines.push(line);
}

// Write the updated content
const newContent = newLines.join('\n');
fs.writeFileSync('shared/games.ts', newContent);

console.log(`Removed ${gamesToRemove.length} games from games.ts`);
