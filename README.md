# UnblockedTDM

UnblockedTDM is a 2D top-down 3v3 team deathmatch game being built as one continuously updated Windows application.

The game name and technical versioning are **UnblockedTDM**. "Beta" describes the current development phase only and is not part of the executable name or technical version string.

## Current development build

**Build 1.11 — Version 1**  
Phase: **Dash / Movement Polish**

Build 1.11 Version 1 completes the core player movement kit with the 4-charge dash system and replaces the first-pass player body/locomotion with a more natural segmented character, smoother upper/lower-body rotation, believable gait timing, foot placement, body lean, and animation blending.

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

## Build 1.11 Version 1 features

- Naturalized segmented player body: torso, neck, head, thighs, knees, lower legs, feet, upper arms, elbows, forearms, and hands.
- Smooth independent mouse aim for the upper body and movement-facing lower body.
- Visual turn smoothing without adding gameplay input latency.
- Re-timed walk/sprint gait, stride, knee bend, foot placement, breathing, body bob, shoulder motion, and movement lean.
- 5 tiles/second base movement and Shift sprint at +35% speed.
- 100 sprint stamina: 5 seconds continuous use, 2.8-second regen delay, 3.2-second full refill.
- Space dash with 4 charges.
- 3-tile dash distance in current aim direction.
- 15 stamina cost per dash.
- 0.3-second dash cooldown and 0.5-second invulnerability window.
- Swept dash collision prevents tunneling through walls and shortens dashes when blocked.
- Dash afterimages, ground streak, ring feedback, invulnerability indicator, and four-pip HUD.
- Combat-ready dash state hooks for later firing, switching, damage, and round systems.
- Training Complex, 64px tile system, camera lead, cover fading, F1 debug, F11 fullscreen, and ESC pause preserved.

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
