# UnblockedTDM

UnblockedTDM is a 2D top-down 3v3 team deathmatch game delivered as one continuously updated Windows application.

## Current development build

**Build 1.21 — Version 1**  
Phase: **Combat Presentation / Input Fixes**

Build 1.21 fixes pre-match weapon selection and in-match Primary/Secondary switching, then upgrades the combat presentation layer with weapon-specific tracers, stronger impacts, projectile trails, launcher smoke/explosions, damage-number animation, critical-hit feedback, melee swing effects, camera shake and elimination/multi-kill/streak presentation.

### Current playable systems
- 32×22 Training Complex on the 64px tile system with the polished environment pass.
- Refined humanoid player presentation, mouse aim, sprint/stamina and four-charge dash.
- 150 HP, regeneration cap, death, respawn and spawn protection.
- Eight complete weapons: Assault Rifle, SMG, Sniper Rifle, Shotgun, LMG, Pistol, Launcher and Melee.
- Primary/Secondary switching with canonical swap tiers and weapon movement penalties.
- Primary selection via 1/Numpad 1/mouse-wheel up and Secondary via 2/Numpad 2/mouse-wheel down.
- Hitscan, physical projectiles, explosive self-damage, zero friendly fire, critical hits, falloff, dynamic spread, ammo and reload behavior.
- Pre-match loadout selection with exact numerical stats; clicking a weapon card now equips it directly and the detail SELECT button remains available.
- Enhanced combat feedback: differentiated tracers, impacts, sparks, sniper trail, launcher smoke/explosion, melee arcs, damage-number pop, stronger crit hitmarkers and world camera shake.
- Elimination confirmation plus Quad Kill-and-up and 10-kill-streak presentation framework.
- Red-side live development target using the same Player and HealthState systems.

## Distribution
The UnblockedTDM Launcher installs, updates, repairs and archives game builds. Releases are packaged by GitHub Actions and published through the launcher manifest with SHA-256 verification and rollback support.

## Local development
```bash
npm install
npm run launcher
```
Run the game directly with `npm run game`, validate with `npm run check`, or create Windows packages with `npm run build:windows`.
