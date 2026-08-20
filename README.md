# UnblockedTDM

UnblockedTDM is a 2D top-down 3v3 team deathmatch game delivered as one continuously updated Windows application.

## Current development build

**Build 1.7 — Version 1**  
Phase: **Postgame / Launcher / Controls**

Build 1.7 completes the first real match-results flow, fixes rebound keyboard controls after menu transitions, makes bot aim less laser-like while preserving the four difficulty multipliers, and replaces the launcher dashboard look with a flatter UnblockedTDM-specific desktop client.

### Current playable systems
- Functional Main Menu: Play, Loadouts, Settings, Weapon Info, Home and Quit.
- 32×22 Training Complex on the 64px tile system.
- Six live players: local Blue player, two Blue AI teammates and three Red AI opponents.
- Sprint/stamina, four-charge directional dash and independent mouse aim.
- Smoothed mouse aim with sensitivity from 0.35x to 2.50x, frame-locked crosshair/shot alignment and no aim assist.
- Persistent rebindable controls for movement, sprint, dash, reload, weapon slots, fire and ADS; Build 1.7 fixes rebound keyboard input after menu focus.
- AI modes remain Beginner 0.80x, Average 1.00x, Sweat 1.35x and Pro 1.75x, with a less laser-accurate AI-only aim model.
- A* navigation grid with obstacle-aware routing, route smoothing, wall avoidance and forced repathing when bots become stuck.
- AI target selection, weapon-range behavior, low-health retreating, reload/swap decisions, teammate spacing, strafing and dash decisions.
- Circular minimap built from real map geometry; teammates are always visible and firing enemies reveal for 1.5 seconds.
- 25 persistent saved loadout slots with names, Primary/Secondary validation and active-slot persistence.
- Pre-match and management loadout flows with safe Main Menu return.
- Quick loadout switching during the 10-second round break only; no mid-round or death-screen loadout changes.
- ESC pause hub with functional Match and Settings tabs.
- Settings for sensitivity, AI difficulty, minimap orientation, screen shake, damage vignette, fullscreen and keybind resets.
- F1 debug tuning remains available during live matches and synchronizes with the same saved settings.
- Dynamic spawn scoring for enemy LOS, multiple watchers, close enemies, teammate proximity, recent combat and repeat-spawn avoidance.
- 150 HP, regeneration cap, death, 3-second respawn and 1-second spawn protection.
- Eight complete weapons: Assault Rifle, SMG, Sniper Rifle, Shotgun, LMG, Pistol, Launcher and Melee.
- Exact player-facing Weapon Info for all eight canonical weapon stat blocks.
- Full 3v3 match structure: 5-second countdown, first to 12 kills, 1:30 timer, Sudden Death, 10-second round breaks, side swapping and first to 5 rounds.
- Full postgame results: winner, six-player K/D/A, enemy damage, K/D, critical hits, best streak, match duration, round history, Rematch and Main Menu.
- Weapon-specific tracers, impacts, projectile trails, launcher explosions, damage numbers, crit feedback and elimination/streak presentation.
- Authored launcher visual system with custom UT mark, subtle Training Complex art, narrow rail navigation, compact status strip and dominant Launch Game CTA.

## Road to 2.0
- **1.4** — AI / Spawn / Aim Physics ✅
- **1.41** — Match HUD + Circular Minimap + Pathfinding / Aim Accuracy ✅
- **1.5** — Persistent Loadouts + Between-Round Changes + Pause Settings ✅
- **1.6** — Main Menu + Settings Completion + Keybinds + Weapon Info ✅
- **1.7** — Postgame Stats + Winner / Rematch Flow + Launcher / Control Corrections ✅
- **1.8** — Full Game-Flow Integration + Persistence / UX Hardening
- **1.9** — Feature-Complete Release Candidate / Balance / Stability
- **2.0** — Major Polish Update: animation, character/map art, weapon feel, VFX, audio, camera, UI and final presentation

## Distribution
The UnblockedTDM Launcher installs, updates, repairs and archives game builds. Releases are packaged by GitHub Actions and published through the launcher manifest with SHA-256 verification and rollback support.

The launcher currently updates the game executable but does not self-update its own installed UI. When a release contains launcher UI changes, run that release's `UnblockedTDM-Setup-<version>-v<build>.exe` once to receive the new launcher itself.

## Local development
```bash
npm install
npm run launcher
```
Run the game directly with `npm run game`, validate with `npm run check`, or create Windows packages with `npm run build:windows`.
