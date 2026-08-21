# Skirmish Arena 2.0.0 — Version 1

Skirmish Arena 2.0.0 is the first release under the Skirmish Arena identity and combines the first four modernization phases into one update.

## Phase 1 — Rebrand Foundation

- Renamed the visible product from UnblockedTDM to **Skirmish Arena**.
- Added the forged-metal Skirmish Arena wordmark and compact **SA** mark.
- Rebranded game window, launcher UI, Windows product names, executable names, installer name, shortcuts, and release assets.
- Preserved existing 1.9.2 game and launcher data locations so loadouts, settings, and archived builds survive the rename.
- Kept legacy 1.x archived executables launchable from the updated launcher.

## Phase 2 — Core UI Redesign

- Removed the Home navigation button.
- Rebuilt the main hierarchy around **PLAY**, then **LOADOUTS / WEAPON INFO**, then **SETTINGS / QUIT**.
- Increased button size and tightened the fullscreen desktop layout.
- Added authored SVG navigation symbols instead of emoji iconography.
- Expanded loadout presentation with weapon profile/model previews while preserving the existing 3-default / expand-to-25 loadout system.
- Upgraded Weapon Info with exact canonical statistics, relative visual bars, and an exact spread-cone readout.
- Grouped settings presentation into Gameplay, Controls, Display, and Audio sections.

## Phase 3 — Tactical HUD

- Added a new tactical match HUD for health, stamina, dash charges, ammo, weapon state, round timer, kills, and round wins.
- Added a hold-**TAB** scoreboard with K / D / A / K-D / damage for all players.
- Added top-three performer presentation with the current #1 player marked as MVP.
- Added a kill feed with weapon information and gold critical-kill treatment.
- Added a full tactical map overlay on **M**.
- Preserved the existing tactical minimap reveal rule: enemies appear temporarily after firing rather than remaining permanently visible.

## Phase 4 — Audio + Fullscreen

- Skirmish Arena now launches fullscreen-first while retaining the existing fullscreen toggle.
- Added **Auto Sprint**, enabled by default. Manual sprint remains available when Auto Sprint is disabled.
- Auto Sprint uses the existing sprint speed, stamina drain, regeneration, ADS restrictions, and combat rules without rebalance.
- Added a procedural Web Audio framework with distinct profiles for AR, SMG, Sniper, Shotgun, LMG, Pistol, Launcher, and Melee.
- Added explosion, reload, shell, weapon-swap, dry-fire, walking, sprinting, and interface audio layers.
- Added stereo/distance attenuation for combat audio.
- Added Game Audio on/off and Master Volume controls, defaulting to 75%.

## Gameplay Balance

2.0.0 does **not** rebalance weapon damage, fire rates, ranges, movement constants, sprint stamina rules, dash rules, AI difficulty multipliers, Training Complex geometry, spawn logic, or match win conditions.
