# Build 1.00 Version 1 — Development Launch Fix

This patch keeps Build 1.00 Version 1 as the same build while fixing local development startup.

## Fixed

- Running the launcher from source no longer requires a prebuilt `dist-game/UnblockedTDM.exe`.
- In development mode, the launcher starts the game directly through the installed Electron runtime.
- Packaged/installed launcher builds continue to launch the compiled `UnblockedTDM.exe`.
- Added root commands `npm run launcher` and `npm run game` for direct local startup.

## Why

The initial launcher bootstrap correctly expected the bundled executable in packaged builds, but used that same requirement when the launcher itself was run directly from source. This caused `Bundled game executable was not found` before the Windows packaging step had produced `dist-game/UnblockedTDM.exe`.
