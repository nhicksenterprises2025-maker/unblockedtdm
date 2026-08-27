# Skirmish Arena 2.3.1 — Build 2

## Deterministic Boot Integrity Hard Patch

Build 2 fixes the recurring post-update failure where the packaged game could expose the old Build 1.6 front-end shell with non-working controls instead of the modern Skirmish Arena client.

### Root cause

- The packaged HTML still contains the historical Build 1.6 shell as the base document.
- Modern Skirmish Arena presentation and systems were being layered on afterward by many independent fire-and-forget dynamic imports.
- Those phase imports had no enforced startup order, no single ownership boundary and no final ready-state verification.
- If the renderer or any required runtime failed or raced during packaged startup, the old shell remained visible even though the installed EXE itself was the newest release.
- Previous CI validated source syntax, regression assertions and packaging, but did not launch the newly packaged EXE and prove that the modern client actually reached a usable ready state.

### Hard patch

- `debug-tuning.js` is now the deterministic boot orchestrator instead of a parallel runtime dispatcher.
- The legacy shell is hidden behind a dedicated Skirmish Arena boot-integrity screen immediately when the bootstrap script is parsed, before the renderer module can expose the historical UI.
- Core `renderer.js` is awaited and must complete its packaged build-info handshake.
- Every required runtime is loaded in explicit historical order rather than concurrently.
- The Phase 10 Career compatibility entrypoint no longer fire-and-forgets Career initialization; the boot orchestrator explicitly awaits the Career bridge.
- Modern startup is not considered successful until Skirmish Arena branding, Career presentation, the 2.3.1 home logo and the all-eight Weapon Info catalog are present.
- If a required startup component fails, the game now fails closed to a clear `CLIENT START BLOCKED` diagnostic with Retry and Quit controls. The dead Build 1.6 shell is never exposed as a usable client.

### Packaged EXE smoke gate

- Adds a hidden `--smoke-test` mode to the packaged game.
- Windows release builds now launch the newly created `dist-game/UnblockedTDM.exe` before launcher packaging or release publication.
- The smoke test requires the actual packaged executable to reach `skirmishBoot=ready` and verifies:
  - release version matches packaged metadata
  - visible brand ownership is `SKIRMISH ARENA`
  - Career UI exists
  - Weapon Info all-weapons catalog exists
  - 2.3.1 production home logo exists
- If the packaged client cannot boot successfully within the timeout, the release build fails and cannot publish.

### Existing 2.3.1 feature set preserved

- Metallic Skirmish Arena home logo.
- Silver Play treatment.
- Real WeaponRenderer art throughout supported UI.
- Dedicated all-eight Weapon Info catalog.
- Rebindable Tactical Map and Scoreboard controls.
- Three fresh loadouts expandable to 25.
- Scoreboard Kills, Deaths, Assists, K/D and Damage presentation.
- Shotgun full damage through 2.0 tiles, falloff through 2.5 tiles and zero damage beyond 2.5 tiles.
- Full Level 1–1000 Career system.

### Gameplay contract

No weapon balance, movement, AI, map geometry, spawn logic, match-rule or Career-economy changes.
