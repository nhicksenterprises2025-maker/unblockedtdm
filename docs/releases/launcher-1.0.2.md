# Skirmish Arena Launcher 1.0.2

Launcher reliability update for the existing Skirmish Arena launcher.

## Changes
- Automatically checks and installs the newest live Skirmish Arena build on startup when Auto Check is enabled.
- PLAY verifies the live release first and installs a newer build before launching.
- Keeps the same launcher identity, data directory, installed-game state and archive storage.
- Launcher-only releases no longer change the public game update channel or remove game builds from the archive.
- Bundles Skirmish Arena 2.0 only as a bootstrap fallback; the live update manifest remains authoritative.
