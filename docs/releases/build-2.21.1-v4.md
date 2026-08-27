# Skirmish Arena 2.21.1 — Build 4

## Packaged Modern UI Startup Hotfix

Build 4 fixes a packaged Electron startup failure that could leave the literal legacy Build 1.6 front-end shell visible even though the installed executable and release metadata were current 2.21.1.

### Root Cause
- The packaged game opened `index.html` through Electron `loadFile()`, producing a `file://` renderer origin.
- The current Skirmish Arena front end is an ES-module graph (`ui-boot.js` plus the modern phase runtimes).
- When that module graph did not successfully take over in the packaged renderer, the static fallback markup in `index.html` remained visible. That fallback markup still contained the original Build 1.6 UnblockedTDM shell.
- Previous validation confirmed the module files existed but did not validate the packaged renderer origin or require Electron to wait for a successful modern-UI boot.

### Startup Fix
- Added a privileged standard `skirmish://` application protocol in the Electron main process.
- Packaged assets are now served through `skirmish://app/index.html` instead of `file://` / `loadFile()`.
- The protocol is registered as standard, secure, Fetch-capable and CORS-enabled so the ES-module graph has a real application origin.
- `contextIsolation` remains enabled and `nodeIntegration` remains disabled.

### No-Legacy-Fallback Guard
- The packaged game window now starts hidden.
- `ui-boot.js` sends an explicit `game:ui-ready` signal only after every modern UI phase module has evaluated.
- Electron shows the window only after that modern UI-ready signal arrives.
- If the modern UI does not finish booting, the game now displays an explicit Skirmish Arena startup diagnostic instead of exposing the obsolete Build 1.6 shell.

### Regression Coverage
- Validation requires the privileged `skirmish` protocol registration and handler.
- Validation requires `skirmish://app/index.html` startup and forbids `window.loadFile()` for the packaged game.
- Validation requires hidden-until-ready window behavior, preload UI-ready IPC and the renderer completion signal.
- Validation requires an explicit startup-failure diagnostic path.
- Existing all-weapons Weapon Info, supplied logo, 256×256 Windows icon and package-branding checks remain mandatory.

### Gameplay
- No weapon values changed.
- No shotgun range or falloff values changed.
- No movement, sprint, dash, health, AI, map, spawn or match-rule changes.
- Career progression, XP, lifetime statistics and loadouts are unchanged.
