# UnblockedTDM

UnblockedTDM is a 2D top-down 3v3 team deathmatch game being built as one continuously updated Windows application.

The game name and technical versioning are **UnblockedTDM**. "Beta" describes the current development phase only and is not part of the executable name or technical version string.

## Current development build

**Build 1.12 — Version 1**  
Phase: **Health / Damage / Respawn**

Build 1.12 Version 1 adds the complete health, damage, death, respawn, spawn-protection, damage-feedback, and dynamic-spawn foundation while preserving the naturalized movement and dash systems from 1.11 v1.

## Architecture

UnblockedTDM is distributed as two Windows applications:

- **UnblockedTDM Launcher** — installs/updates/repairs the current game build and manages the Version Archive.
- **UnblockedTDM.exe** — the independently launchable game runtime. Gameplay builds replace this runtime in place.

The NSIS installer is configured as a per-user installation. Player/launcher data lives under Electron's user-data directory and is not removed by normal game updates. The uninstaller keeps user data by default.

## Launcher features

- GitHub-backed update checks.
- Staged downloads before replacement.
- SHA-256 verification for release game binaries.
- Automatic backup before applying an update.
- Rollback to the previous working executable if replacement fails.
- Repair Game verification/re-download flow.
- Version Archive that downloads older builds into independent folders.
- Old builds can be launched without downgrading the current installation.
- Persistent launcher settings.
- Open Game Folder diagnostics action.
- Separate current, staging, backup, and archive storage areas.

## Build 1.12 Version 1 features

- 150 maximum HP and no armor.
- Common damage-processing layer with friendly-fire, self-damage, dash-invulnerability, and spawn-protection rules.
- 7-second regeneration delay; health regenerates only below 75 HP and stops at 75.
- Damage-only overhead health bar, hit flash, directional damage indicator, and red edge vignette.
- Damage history foundation for later kills/assists/suicide credit.
- Team-colored particle death burst and no corpse.
- 3-second respawn.
- Respawn restores HP and stamina but does not restore dash charges.
- 1-second spawn protection.
- Dynamic spawn scoring foundation using enemy LOS/distance, teammate proximity, and recent combat.
- Development damage controls: F2 -25, F3 -75, F4 lethal, G friendly-fire test, R round reset.
- Natural segmented character, independent aim, sprint, dash, swept collision, camera lead, cover fading, and Training Complex preserved.

## Release system

`release-plan.json` defines the next immutable published build. A change to that file on `main` triggers the Windows release workflow.

The workflow synchronizes build metadata, validates JavaScript, builds `UnblockedTDM.exe`, embeds it in the launcher installer, computes SHA-256 hashes, publishes an immutable GitHub Release, updates the live distribution manifests, and uploads CI copies of the Windows artifacts.

## Local development

```bash
npm install
npm run launcher
```

Run the game directly:

```bash
npm run game
```

Validate source:

```bash
npm run check
```

Build Windows executable + installer:

```bash
npm run build:windows
```

## Windows signing

Builds are currently unsigned. The installer and executable are functional, but Windows SmartScreen may show an unknown-publisher warning until a code-signing certificate is configured.
