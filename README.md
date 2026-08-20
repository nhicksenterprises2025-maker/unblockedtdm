# UnblockedTDM

UnblockedTDM is a 2D top-down 3v3 team deathmatch game delivered as one continuously updated Windows application.

## Current development build

**Build 1.2 — Version 1**  
Phase: **Complete Weapon Roster / Loadout Select**

Build 1.2 completes the first eight-weapon roster, adds the mandatory pre-match Primary/Secondary selection screen with exact weapon stats, implements projectile sniper and launcher combat, shotgun pellets and shell reload, semi-auto pistol behavior, melee combat, and another player/weapon animation polish pass.

### Current playable systems
- 32×22 Training Complex on the 64px tile system with the polished environment pass.
- Refined humanoid player presentation, mouse aim, sprint/stamina and four-charge dash.
- 150 HP, regeneration cap, death, respawn and spawn protection.
- Eight complete weapons: Assault Rifle, SMG, Sniper Rifle, Shotgun, LMG, Pistol, Launcher and Melee.
- Primary/Secondary switching with canonical swap tiers and weapon movement penalties.
- Hitscan, physical projectiles, explosive self-damage, zero friendly fire, critical hits, falloff, dynamic spread, ammo and reload behavior.
- Pre-match loadout selection with exact numerical stats and SELECT buttons.
- Red-side live development target using the same Player and HealthState systems.

## Distribution
The UnblockedTDM Launcher installs, updates, repairs and archives game builds. Releases are packaged by GitHub Actions and published through the launcher manifest with SHA-256 verification and rollback support.

## Local development
```bash
npm install
npm run launcher
```
Run the game directly with `npm run game`, validate with `npm run check`, or create Windows packages with `npm run build:windows`.
