import re

# Read the current games.ts
with open('shared/games.ts', 'r') as f:
    content = f.read()

# Games to remove
games_to_remove = [
    'laser-deflector', 'nano-racing', 'retro-racer', 'circuit-breaker',
    'ai-combat-arena', 'cybernetic-farm', 'gravity-flip-adventure',
    'neon-battle-royale', 'data-stream-runner', 'augmented-reality-quest',
    'biohazard-survival', 'galactic-trader', 'memory-maze-challenge',
    'cyberpunk-detective', 'virtual-reality-explorer', 'digital-dungeon-crawler',
    'blipzkrieg', 'dead-zone-escape', 'nano-bots-rampage', 'shatterpoint-assault',
    'hexblade-trials', 'crimson-blade-rush', 'zero-signal-showdown', 'shadow-arena-brawl'
]

# Remove each game by finding its block
for game_id in games_to_remove:
    # Find the game block start
    start_pattern = f"\\s*{{\\s*id:\\s*['\"`]{game_id}['\"`],"
    start_match = re.search(start_pattern, content)
    if start_match:
        start_pos = start_match.start()
        # Find the closing brace and comma
        brace_count = 0
        pos = start_match.end()
        while pos < len(content):
            if content[pos] == '{':
                brace_count += 1
            elif content[pos] == '}':
                if brace_count == 0:
                    # Found the end of this game object
                    end_pos = pos + 1
                    # Include trailing comma if present
                    if pos + 1 < len(content) and content[pos + 1] == ',':
                        end_pos = pos + 2
                    # Include trailing whitespace/newlines
                    while end_pos < len(content) and content[end_pos] in ' \t\n':
                        end_pos += 1
                    # Remove the game block
                    content = content[:start_pos] + content[end_pos:]
                    break
                else:
                    brace_count -= 1
            pos += 1

# New games to add
new_games = [
    # Runner Games
    {
        'id': 'run3-webgl',
        'title': 'Run 3 (WebGL)',
        'description': 'Space tunnel runner with wall-jumping mechanics',
        'category': 'Runner',
        'difficulty': 'Medium',
        'color': '#7000ff'
    },
    {
        'id': 'slope',
        'title': 'Slope',
        'description': 'Fast reflex downhill runner with increasing difficulty',
        'category': 'Runner', 
        'difficulty': 'Hard',
        'color': '#ff0099'
    },
    {
        'id': 'g-switch-3',
        'title': 'G-Switch 3',
        'description': 'Gravity-flip running game with tight controls',
        'category': 'Runner',
        'difficulty': 'Medium',
        'color': '#0aff9d'
    },
    {
        'id': 'ovo',
        'title': 'OvO',
        'description': 'Precision platformer with wall jumps and parkour',
        'category': 'Platform',
        'difficulty': 'Hard',
        'color': '#ffff00'
    },
    {
        'id': 'tomb-runner',
        'title': 'Tomb Runner',
        'description': 'Temple Run-style infinite runner',
        'category': 'Runner',
        'difficulty': 'Medium',
        'color': '#ff8000'
    },
    # Shooter Games
    {
        'id': 'galaga-special-edition',
        'title': 'Galaga Special Edition',
        'description': 'Retro-style alien shooter with modern features',
        'category': 'Shooter',
        'difficulty': 'Medium',
        'color': '#7000ff'
    },
    {
        'id': 'nova-defender',
        'title': 'Nova Defender',
        'description': 'Fixed-position defense shooter with upgrade options',
        'category': 'Shooter',
        'difficulty': 'Medium',
        'color': '#ff0099'
    },
    {
        'id': 'space-blaze-2',
        'title': 'Space Blaze 2',
        'description': 'Classic horizontal side-scrolling shoot em up',
        'category': 'Shooter',
        'difficulty': 'Medium',
        'color': '#0aff9d'
    },
    {
        'id': 'galaxy-warriors',
        'title': 'Galaxy Warriors',
        'description': 'Bullet-hell inspired vertical shooter',
        'category': 'Shooter',
        'difficulty': 'Hard',
        'color': '#00ffff'
    },
    {
        'id': 'alien-sky-invasion',
        'title': 'Alien Sky Invasion',
        'description': 'Space Invaders meets bullet chaos',
        'category': 'Shooter',
        'difficulty': 'Medium',
        'color': '#ff6600'
    },
    # Classic Mobile Games
    {
        'id': 'snake-3310',
        'title': 'Snake 3310',
        'description': 'True Nokia Snake clone in browser',
        'category': 'Classic',
        'difficulty': 'Easy',
        'color': '#00ff00'
    },
    {
        'id': 'bounce-classic-html5',
        'title': 'Bounce Classic HTML5',
        'description': 'Remake of the red ball bounce game',
        'category': 'Classic',
        'difficulty': 'Medium',
        'color': '#ff4444'
    },
    {
        'id': 'space-impact-reborn',
        'title': 'Space Impact Reborn',
        'description': 'Recreated as a side-scrolling space shooter',
        'category': 'Classic',
        'difficulty': 'Medium',
        'color': '#7000ff'
    },
    {
        'id': 'rapid-roll',
        'title': 'Rapid Roll',
        'description': 'Falling-ball style survival game from Nokia phones',
        'category': 'Classic',
        'difficulty': 'Medium',
        'color': '#ffff00'
    },
    {
        'id': 'car-racing-2d-retro',
        'title': 'Car Racing 2D Retro',
        'description': 'Top-down pixel racing game',
        'category': 'Racing',
        'difficulty': 'Medium',
        'color': '#ff8000'
    },
    # Tower Defense Games
    {
        'id': 'kingdom-rush',
        'title': 'Kingdom Rush',
        'description': 'One of the best HTML5 tower defense games ever made',
        'category': 'Strategy',
        'difficulty': 'Medium',
        'color': '#0066cc'
    },
    {
        'id': 'bloons-td5',
        'title': 'Bloons Tower Defense 5',
        'description': 'Pop waves of enemies with upgradable monkey towers',
        'category': 'Strategy',
        'difficulty': 'Medium',
        'color': '#ff0099'
    },
    {
        'id': 'cursed-treasure',
        'title': 'Cursed Treasure',
        'description': 'Defend gems from waves of heroes in a dark fantasy world',
        'category': 'Strategy',
        'difficulty': 'Medium',
        'color': '#6600cc'
    },
    {
        'id': 'zombie-defense-html5',
        'title': 'Zombie Defense HTML5',
        'description': 'Lane-based zombie defense like PvZ with weapons',
        'category': 'Strategy',
        'difficulty': 'Medium',
        'color': '#00aa00'
    },
    {
        'id': 'empire-defender-td',
        'title': 'Empire Defender TD',
        'description': 'Classic map-based tower defense with hero upgrades',
        'category': 'Strategy',
        'difficulty': 'Hard',
        'color': '#cc6600'
    },
    {
        'id': 'plants-vs-goblins',
        'title': 'Plants vs Goblins',
        'description': 'A direct PvZ-style clone with goblin enemies',
        'category': 'Strategy',
        'difficulty': 'Medium',
        'color': '#009900'
    },
    {
        'id': 'defend-the-castle',
        'title': 'Defend the Castle',
        'description': 'Side-view defense with archers and catapults',
        'category': 'Strategy',
        'difficulty': 'Medium',
        'color': '#996633'
    },
    {
        'id': 'protect-the-garden',
        'title': 'Protect the Garden',
        'description': 'A minimalist version of PvZ with bug-like enemies',
        'category': 'Strategy',
        'difficulty': 'Easy',
        'color': '#66cc66'
    },
    {
        'id': 'swamp-attack-web',
        'title': 'Swamp Attack Web',
        'description': 'Defend your shack from waves of weird swamp creatures',
        'category': 'Strategy',
        'difficulty': 'Medium',
        'color': '#669966'
    },
    {
        'id': 'tiny-defense-2',
        'title': 'Tiny Defense 2',
        'description': 'Cartoony, grid-based defense with cute units',
        'category': 'Strategy',
        'difficulty': 'Easy',
        'color': '#ff99cc'
    },
    # Additional Shooting Games
    {
        'id': 'sniper-clash-3d',
        'title': 'Sniper Clash 3D',
        'description': 'Quick deathmatch game with sniper rifles and 3D maps',
        'category': 'Shooter',
        'difficulty': 'Hard',
        'color': '#cc0000'
    },
    {
        'id': 'mini-royale-2',
        'title': 'Mini Royale 2',
        'description': 'Battle Royale/FPS in the browser with multiplayer',
        'category': 'Shooter',
        'difficulty': 'Hard',
        'color': '#0066ff'
    },
    {
        'id': 'combat-reloaded',
        'title': 'Combat Reloaded',
        'description': 'Classic browser FPS with multiple arenas and weapons',
        'category': 'Shooter',
        'difficulty': 'Hard',
        'color': '#ff3300'
    }
]

# Add the new games before the closing array bracket
games_end_pattern = r'(\s*]);\s*$'
games_end_match = re.search(games_end_pattern, content)

if games_end_match:
    insert_pos = games_end_match.start()
    
    # Build the new games string
    new_games_str = ""
    for game in new_games:
        new_games_str += f"""  {{
    id: '{game['id']}',
    title: '{game['title']}',
    description: '{game['description']}',
    category: '{game['category']}',
    difficulty: '{game['difficulty']}',
    isImplemented: true,
    mobileOptimized: true,
    color: '{game['color']}'
  }},
"""
    
    # Insert the new games
    content = content[:insert_pos] + new_games_str + content[insert_pos:]

# Write the updated content
with open('shared/games.ts', 'w') as f:
    f.write(content)

print("Updated games.ts - removed old games and added new ones")
