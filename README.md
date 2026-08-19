# UnblockedTDM

UnblockedTDM is a 2D top-down 3v3 team deathmatch game currently in pre-development infrastructure work.

The game name and technical versioning are **UnblockedTDM**. "Beta" describes the current development phase only and is not part of the game executable name or technical version string.

## Current release

**Build 1.00 — Version 1**  
Phase: **Pre-Development**

This build establishes the permanent Windows distribution architecture before gameplay builds begin.

## Architecture

UnblockedTDM is distributed as two Windows applications:

- **UnblockedTDM Launcher** — installs/updates/repairs the current game build and manages the Version Archive.
- **UnblockedTDM.exe** — the independently launchable game runtime. Future gameplay builds replace this runtime in place.

The NSIS installer is configured as a per-user installation. Player/launcher data lives under Electron's user-data directory and is not removed by normal game updates. The uninstaller keeps user data by default.

## Launcher features in Build 1.00 Version 1

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

## Release system

`release-plan.json` defines the next immutable published build. A change to that file on `main` triggers the Windows release workflow.

The workflow:

1. Synchronizes build metadata into both applications.
2. Validates JavaScript syntax.
3. Builds the portable `UnblockedTDM.exe` game runtime.
4. Embeds that runtime into the UnblockedTDM Launcher installer.
5. Builds the NSIS Windows installer/uninstaller.
6. Computes SHA-256 hashes.
7. Creates an immutable GitHub Release for the build.
8. Updates `distribution/latest.json` and `distribution/versions.json`.
9. Publishes CI copies of the Windows artifacts.

The launcher reads the live distribution manifests directly from this public repository.

## Repository layout

```text
unblockedtdm/
├── launcher/                 # Electron launcher application
│   └── src/
├── game/                     # Separate Electron game executable
│   └── src/
├── distribution/
│   ├── latest.json           # Latest build used by update checks
│   └── versions.json         # Immutable Version Archive index
├── docs/releases/            # Release notes for each published build
├── scripts/
│   ├── sync-build-info.mjs
│   └── finalize-release.mjs
├── .github/workflows/
│   └── publish-windows.yml
└── release-plan.json
```

## Local validation

```bash
npm install
npm run check
```

Windows packaging:

```bash
npm run build:windows
```

The Windows packaging step requires a Windows environment; GitHub Actions provides the canonical build environment.

## Windows signing

Builds are currently unsigned. The installer and executable are functional, but Windows SmartScreen may show an unknown-publisher warning until a code-signing certificate is configured.
