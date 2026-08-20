# UnblockedTDM

UnblockedTDM is a 2D top-down 3v3 team deathmatch game delivered as one continuously updated Windows application.

## Current development build

**Build 1.13 — Version 2**  
Phase: **Weapon Framework / Input & Visual Polish**

Build 1.13 Version 2 corrects the first weapon build without changing the Assault Rifle's canonical balance. RMB ADS and LMB fire now work simultaneously, the rifle is properly shoulder-mounted with aligned hands/muzzle feedback, and Training Complex has received a substantial environment-rendering pass while preserving the same gameplay geometry and 64px tile system.

### Current playable systems
- 32×22 Training Complex on the 64px tile system, now with upgraded ground, structure, lane and spawn-zone rendering.
- Naturalized player locomotion, mouse aim, sprint/stamina and four-charge dash.
- 150 HP, regeneration cap, death, respawn and spawn protection.
- Full Assault Rifle implementation: 20 damage, 2% crit, 32 crit damage, 0.30s fire interval, 32+96 ammo, 2.5s reload, 13.5t full range, 13 falloff, 4° base spread and 0.4s ADS.
- Simultaneous RMB ADS + LMB automatic fire.
- Shoulder-mounted Assault Rifle with visible grip hands and muzzle/tracer origin aligned to the rendered barrel.
- Hitscan blocked by map geometry, dynamic crosshair, hitmarkers, tracers, muzzle flash and damage numbers.
- Red-side live development target using the same Player and HealthState systems.

## Distribution
The UnblockedTDM Launcher installs, updates, repairs and archives game builds. Releases are packaged by GitHub Actions and published through the launcher manifest with SHA-256 verification and rollback support.

## Local development
```bash
npm install
npm run launcher
```
Run the game directly with `npm run game`, validate with `npm run check`, or create Windows packages with `npm run build:windows`.
