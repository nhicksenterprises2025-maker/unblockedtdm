# UnblockedTDM

UnblockedTDM is a 2D top-down 3v3 team deathmatch game being built as one continuously updated Windows application.

The game name and technical versioning are **UnblockedTDM**. "Beta" describes the current development phase only and is not part of the executable name or technical version string.

## Current development build

**Build 1.1 — Version 1**  
Phase: **Character / Movement**

Build 1.1 Version 1 replaces the World Explorer probe with the first real player body and completes the base locomotion layer: independent mouse aiming, 5 tiles/second movement, sprint/stamina, locomotion animation states, team readability, aim-direction camera lead, and player-aware tall-cover fading.

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

## Build 1.1 Version 1 features

- Full stylized player body with visible head, torso, arms, legs, shadow, and blue-team floor ring.
- Hybrid top-down rendering designed to keep the character readable.
- Independent mouse aim for the upper body while movement remains WASD-driven.
- 5 tiles/second base movement.
- Sprint on Shift at +35% speed.
- 100 sprint stamina: 5 seconds continuous use, 2.8-second regen delay, 3.2-second full refill.
- Idle, walk, and sprint locomotion animation states.
- Sprint body lean, faster leg animation, and faint speed trail.
- Smooth camera lead toward aim direction.
- Existing collision/map rules applied to the actual player body.
- Tall structures render above the player and fade when they overlap the local character.
- Live stamina, speed, movement-state, position, and camera diagnostics.
- Escape pause, F11 fullscreen, and F1 collision visualization.

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
