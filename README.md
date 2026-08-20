# UnblockedTDM

UnblockedTDM is a 2D top-down 3v3 team deathmatch game delivered as one continuously updated Windows application.

## Current development build

**Build 1.41 — Version 1**  
Phase: **Minimap / HUD / Pathfinding / Aim Accuracy**

Build 1.41 focuses on control fidelity and match readability: a circular tactical minimap, cleaner normal HUD, obstacle-aware A* bot pathfinding, live path debug visualization and a more accurate no-assist mouse-aim pipeline.

### Current playable systems
- 32×22 Training Complex on the 64px tile system.
- Six live players: local Blue player, two Blue AI teammates and three Red AI opponents.
- Sprint/stamina, four-charge directional dash and independent mouse aim.
- Smoothed mouse aim with sensitivity from 0.35x to 2.50x, frame-locked crosshair/shot alignment and no aim assist.
- AI modes: Beginner 0.80x, Average 1.00x, Sweat 1.35x and Pro 1.75x.
- A* navigation grid with obstacle-aware routing, route smoothing, wall avoidance and forced repathing when bots become stuck.
- AI target selection, weapon-range behavior, low-health retreating, reload/swap decisions, teammate spacing, strafing and dash decisions.
- Circular minimap built from real map geometry; teammates are always visible and firing enemies reveal for 1.5 seconds.
- F1 debug tuning for live AI difficulty, sensitivity, minimap mode, collision visualization and bot navigation paths.
- Dynamic spawn scoring for enemy LOS, multiple watchers, close enemies, teammate proximity, recent combat and repeat-spawn avoidance.
- 150 HP, regeneration cap, death, 3-second respawn and 1-second spawn protection.
- Eight complete weapons: Assault Rifle, SMG, Sniper Rifle, Shotgun, LMG, Pistol, Launcher and Melee.
- Full 3v3 match structure: 5-second countdown, first to 12 kills, 1:30 timer, Sudden Death, 10-second round breaks, side swapping and first to 5 rounds.
- Cleaner normal match HUD with debug/development information hidden until F1.
- Weapon-specific tracers, impacts, projectile trails, launcher explosions, damage numbers, crit feedback and elimination/streak presentation.

## Road to 2.0
- **1.4** — AI / Spawn / Aim Physics ✅
- **1.41** — Match HUD + Circular Minimap + Pathfinding / Aim Accuracy ✅
- **1.6** — 25 Persistent Loadouts + Between-Round Changes
- **1.7** — Main Menu + Settings + Keybinds
- **1.8** — Postgame Stats + Rematch Flow
- **1.9** — Feature-Complete Release Candidate / Balance / Stability
- **2.0** — Major Polish Update: animation, character/map art, weapon feel, VFX, audio, camera, UI and final presentation

## Distribution
The UnblockedTDM Launcher installs, updates, repairs and archives game builds. Releases are packaged by GitHub Actions and published through the launcher manifest with SHA-256 verification and rollback support.

## Local development
```bash
npm install
npm run launcher
```
Run the game directly with `npm run game`, validate with `npm run check`, or create Windows packages with `npm run build:windows`.
