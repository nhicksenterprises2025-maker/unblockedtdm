# Skirmish Arena 1.99.3 — Phase 9

Phase 9 is the final release-candidate hardening pass before 2.0.

## Performance / Runtime
- Minimap rendering is capped at 30 Hz instead of redrawing at full monitor refresh rate.
- Hidden-window game-loop work is suppressed and the frame clock resets cleanly when visibility changes.
- Removed live HUD backdrop-filter blur cost while preserving the Phase 8 professional layout.
- Debug chrome stays fully suppressed outside Debug Mode.

## Focus / Session Stability
- Active matches automatically pause when the game window loses focus or becomes hidden.
- Existing input blur clearing remains intact so held movement/fire states cannot stick after alt-tab or focus loss.

## Pre-2.0 Persistence Safeguards
- Added a one-time pre-2.0 backup snapshot for current loadouts, active loadout, created slot count, keybinds and gameplay settings.
- Added a current migration snapshot that refreshes when settings change and when the game closes.
- Added a migration schema marker for the 2.0 upgrade path.
- Existing localStorage keys remain unchanged for backward compatibility.

## Release Candidate Safety
- Added Phase 9 regression coverage for persistence, focus behavior, minimap throttling, launcher update integrity and map-text cleanup.
- Preserved Phase 8 launcher hash verification and stale-manifest recovery behavior.
- Preserved the professional Phase 8 HUD and no-label Training Complex presentation.

## Gameplay Contract
- No weapon damage, critical chance, fire rate, magazine, reload, range or spread changes.
- No movement, sprint, dash or stamina balance changes.
- No AI difficulty or behavior changes.
- No Training Complex geometry, collision, spawn or lane changes.
- No round length, kill target or match-win rule changes.
