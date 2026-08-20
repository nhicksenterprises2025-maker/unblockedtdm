# UnblockedTDM

UnblockedTDM is a 2D top-down 3v3 team deathmatch game delivered as one continuously updated Windows application.

## Current development build

**Build 1.3 — Version 1**  
Phase: **3v3 Match System / Directional Dash**

Build 1.3 replaces the one-target combat sandbox with the first complete local 3v3 match loop: two AI teammates, three AI enemies, 1:30 rounds, first to 12 kills, Sudden Death, first to 5 round wins, side swaps, live respawns and a real match HUD. Dash now follows held movement direction and falls back to aim direction only when no movement input is held.

### Current playable systems
- 32×22 Training Complex on the 64px tile system with the polished environment pass.
- Six live players: local Blue player, two Blue AI teammates and three Red AI opponents.
- Refined player presentation, independent mouse aim, sprint/stamina and four-charge directional dash.
- 150 HP, regeneration cap, death, 3-second respawn and 1-second spawn protection.
- Eight complete weapons: Assault Rifle, SMG, Sniper Rifle, Shotgun, LMG, Pistol, Launcher and Melee.
- Primary/Secondary switching with canonical swap tiers and weapon movement penalties.
- Hitscan, physical projectiles, explosive self-damage, zero friendly fire, critical hits, falloff, dynamic spread, ammo and reload behavior.
- Pre-match loadout selection with exact numerical stats.
- Full local match structure: 5-second countdown, first to 12 kills, 1:30 timer, Sudden Death, 10-second round breaks, side swapping and first to 5 rounds.
- Top-center match HUD for round wins, current kills, round number and timer.
- Basic combat AI uses the same movement, health, weapon, projectile and respawn systems as the local player.
- Directional dash: held movement input determines dash direction; no movement input uses aim direction.
- Enhanced combat feedback with weapon-specific tracers, impacts, projectile trails, launcher explosions, damage numbers, crit feedback and elimination/streak presentation.

## Road to 2.0
- **1.4** — Spawn + Team AI Upgrade
- **1.5** — Match HUD + Circular Minimap
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
