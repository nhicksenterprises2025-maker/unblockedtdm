# Skirmish Arena 1.98.1 — Phase 6

Phase 6 rebuilds and polishes the fullscreen front end while preserving the established gameplay, tactical HUD, audio, Auto Sprint, and combat VFX systems.

## Main Menu Rebuild
- Rebalanced the fullscreen command menu so the left navigation has enough authored width for every label.
- Preserved the exact hierarchy: PLAY on top, LOADOUTS / WEAPON INFO in the middle, SETTINGS / QUIT on the bottom.
- Prevented LOADOUTS, SETTINGS, QUIT and PLAY labels from clipping in fullscreen layouts.
- Added controlled wrapping for WEAPON INFO instead of overflow.
- Repositioned and resized menu icons so they no longer compete with labels.
- Added subtle 01–05 command indexing and improved hover / active feedback.

## Home Screen Polish
- Reduced excessive empty space on the right side of the fullscreen menu.
- Rebalanced the SKIRMISH ARENA hero, client-status rail, and match / loadout / AI information cards.
- Repositioned and toned down background arena art.
- Added responsive behavior for large fullscreen displays, 1280-class displays, and shorter-height screens.

## Compatibility / Scope
- Existing menu DOM and click controller remain canonical and unchanged.
- Phase 3 tactical HUD remains intact.
- Phase 4 audio, Auto Sprint, and fullscreen foundation remain intact.
- Phase 5 combat VFX and fullscreen HUD safe zones remain intact.
- No weapon stats, movement values, AI, map geometry, spawning, collision, combat logic, or match rules changed.
