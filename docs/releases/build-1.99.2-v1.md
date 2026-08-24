# Skirmish Arena 1.99.2 — Phase 8

Phase 8 is the professional presentation and final launcher pass. This release packages the UI and launcher work that previously existed on main but was not included in the live 1.99.1 Phase 7 build.

## In-Game UI / HUD
- Removed prototype-style Training Complex world text, including TC // MID, NORTH // TRAINING, SA // TRAINING, large structure branding, and spawn/warehouse text labels.
- Preserved the Phase 7 material and lighting improvements while replacing literal world text with restrained geometric markings.
- Reduced the minimap footprint and cleaned its presentation.
- Reworked the top match HUD into a flatter, smaller competitive layout.
- Tightened the health and stamina stack and removed unnecessary technical microcopy.
- Reduced the weapon HUD footprint and removed redundant instruction text.
- Reduced Dash to a compact availability strip.
- Slimmed the kill feed and reduced heavy borders/shadows.
- Reduced the respawn overlay footprint and visual obstruction.
- Reduced opaque black-box UI coverage throughout the match HUD.

## Final Launcher Pass
- Added a cleaner Phase 8 launcher presentation with less developer-dashboard styling.
- Simplified launcher wording and build/update presentation.
- Refined archive, settings, diagnostics, and Play-page hierarchy.
- Added resilient update detection that does not rely on sequence alone.
- When metadata claims the game is current, the launcher can verify the actual installed executable SHA-256 against the live release to recover from stale or corrupted installed-state metadata.
- Updated the launcher title and user-facing branding to Skirmish Arena.

## Compatibility / Scope
- Weapon values are unchanged.
- Movement, sprint, dash, AI, collision, spawn coordinates, map geometry, combat behavior, and match rules are unchanged.
- Phase 3 tactical systems, Phase 4 audio/Auto Sprint, Phase 5 VFX, Phase 6 main-menu rebuild, and Phase 7 map material improvements remain intact.
