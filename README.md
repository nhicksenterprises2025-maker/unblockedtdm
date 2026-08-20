# UnblockedTDM

UnblockedTDM is a 2D top-down 3v3 team deathmatch game delivered as one continuously updated Windows application.

## Current development build

**Build 1.13 — Version 1**  
Phase: **Weapon Framework / Assault Rifle**

Build 1.13 adds the permanent weapon architecture and the first complete firearm. The Assault Rifle is now rendered in the player's hands and can fire real hitscan rounds through the existing health/damage system, with ammo, preserved-ammo reloads, ADS, spread, range falloff, critical hits, hitmarkers, damage numbers and combat effects.

### Current playable systems
- 32×22 Training Complex on the 64px tile system.
- Naturalized player locomotion, mouse aim, sprint/stamina and four-charge dash.
- 150 HP, regeneration cap, death, respawn and spawn protection.
- Full Assault Rifle implementation: 20 damage, 2% crit, 32 crit damage, 0.30s fire interval, 32+96 ammo, 2.5s reload, 13.5t full range, 13 falloff, 4° base spread and 0.4s ADS.
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
