# Diablotest - Diablo 2-style ARPG

## Project
- Single-file HTML5 Canvas game: `diablo_game.html`
- Repository: https://github.com/sei0422/Diablotest.git

## Workflow Rules
- After implementing features or fixing bugs, always commit and push to GitHub
- Commit messages should summarize the "why" concisely
- Always validate JS syntax before committing: `node -e "new Function(script)"`

## Architecture
- All code in one HTML file (~10,000 lines)
- Game state in global `G` object (~L1685)
- Dungeon class (~L2411), TownMap class (~L6320)
- Monster class with MONSTER_DEFS (~L5213)
- Player class with skill system
- ACT_DEFS (5 ACTs), BOSS_DEFS (5 bosses), QUEST_DEFS (10 quests)
- Save/Load system (v4) with backward compatibility
- Canvas rendering with drawLighting(), drawHUD() in game loop

## Key Patterns
- `const` variables must be at proper scope (function-level if used outside if/else blocks)
- drawHUD() is called after drawLighting() - any crash in drawLighting prevents HUD rendering
- Town mode (`G.inTown`) disables combat, enables NPC interaction
- All town UI panels use window-exposed functions for onclick handlers

## Claude Code settings

This repo does not include project-specific helper scripts for Claude Code settings/profile switching.
