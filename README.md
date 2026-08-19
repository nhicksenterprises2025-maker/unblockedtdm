# UnblockedTDM

UnblockedTDM is a 2D top-down 3v3 team deathmatch game being built as one continuously updated Windows application.

The game name and technical versioning are **UnblockedTDM**. "Beta" describes the current development phase only and is not part of the executable name or technical version string.

## Current development build

**Build 1.00 — Version 2**  
Phase: **World / Engine**

Version 2 replaces the pre-development runtime verification screen with the first real game-world implementation: a 64px tile engine, the 32×22 Training Complex map, world collision, smooth camera following, cover rendering, pause/fullscreen support, and engine diagnostics.

The Version 2 World Explorer probe is a deliberate collision/camera diagnostic control. The final hybrid-view player character begins in the following character build.

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

## Version 2 engine features

- Canvas 2D production game loop with delta-time movement.
- 64×64 tile world measurement.
- 32×22 symmetrical Training Complex map.
- Concrete, asphalt, grass, spawn pads, walls, low cover, crates, barriers, and tall structures.
- Collision against all blocking geometry.
- Smooth camera follow with map-boundary clamping.
- Tall-cover transparency when it obstructs the controlled world probe.
- Escape pause, F11 fullscreen, and F1 collision visualization.
- FPS/tile/camera build diagnostics.

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
