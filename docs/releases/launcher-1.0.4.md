# Skirmish Arena Launcher 1.0.4

## 2.2.1 Rollback Baseline

Launcher 1.0.4 makes the confirmed working Skirmish Arena 2.2.1 Build 2 rollback the bundled game for new installations.

### Bootstrap
- Fresh launcher installs bundle Skirmish Arena 2.2.1 Build 2, sequence 45.
- The bundled game is the known-good 2.2.1 runtime with the isolated Weapon Info tab hotfix.
- Fresh installs no longer bootstrap into the broken 2.21.1 home/logo runtime before checking for updates.

### Existing installations
- Existing launchers continue to read `distribution/latest.json` and use sequence-based update detection.
- Sequence 45 ensures installations on the broken 2.21.1 Build 4 / sequence 44 are offered the rollback as an update.
- SHA-256 verification, repair, archive, launch, minimize-on-play and close-after-play behavior remain unchanged.

### Release safety
- Launcher publishing remains isolated from the live game channel.
- The launcher cannot rewrite the active game release back to an older manifest.
- Compatibility executable naming remains `UnblockedTDM.exe` internally for managed-install continuity.
