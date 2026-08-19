# UnblockedTDM Build 1.00 — Version 2

## World / Engine

Version 2 replaces the pre-development runtime screen with the first real UnblockedTDM game world.

### Added
- Production Canvas 2D game loop with delta-time updates and frame-delta clamping.
- 64×64 pixel tile measurement system.
- 32×22 tile Training Complex map (2048×1408 world space).
- Symmetrical three-route competitive layout with blue/red spawn zones.
- Distinct concrete, asphalt, grass, spawn concrete, walls, low cover, crates, barriers, and tall structures.
- World collision against walls, low cover, and tall structures.
- Smooth camera follow and map-boundary clamping.
- Tall-structure transparency when the controlled collision probe would be visually obstructed.
- Resolution-aware Canvas rendering and high-DPI support.
- Pause system on Escape.
- F11 fullscreen toggle.
- F1 collision visualization.
- Build diagnostics for FPS, tile coordinates, camera coordinates, renderer, and map dimensions.

### Build-purpose control
Version 2 includes a dedicated World Explorer collision probe controlled with WASD/arrow keys. It is an engine diagnostic for validating map collision and camera behavior; it is not the final player character. The final hybrid-view player body begins in the next character build.
