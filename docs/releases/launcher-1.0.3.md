# Skirmish Arena Launcher 1.0.3

## 2.21.1 Bootstrap + Release-Channel Safety

Launcher 1.0.3 brings fresh installations onto the current Skirmish Arena 2.21.1 production line and removes obsolete release automation that could restore the live game channel to the old 2.0 baseline during a launcher publish.

### Bootstrap
- Fresh launcher packages bundle Skirmish Arena 2.21.1 Build 3 as the immutable bootstrap game.
- Existing installations continue to use the live `distribution/latest.json` channel and SHA-256 verification for game updates.
- Compatibility executable naming remains `UnblockedTDM.exe` internally so existing managed installs and archive paths continue to work.

### Release Safety
- Launcher publishing now updates only the launcher manifest.
- Removed the historical Launcher 1.0.2 canonical-2.0 restoration step.
- Removed the historical path that could rewrite `distribution/latest.json` and `distribution/versions.json` back to Skirmish Arena 2.0.
- Game release metadata remains owned exclusively by the game release pipeline.

### Packaging
- Uses the branded Skirmish Arena Windows icon and launcher metadata.
- Preserves install, update, repair, archive, launch, minimize-on-play and close-after-play behavior.
