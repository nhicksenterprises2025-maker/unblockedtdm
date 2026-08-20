# UnblockedTDM Build 1.41 — Version 1

## Minimap / HUD / Pathfinding / Aim Accuracy

Build 1.41 Version 1 is a focused gameplay-readability and control-quality update. It keeps the Build 1.4 3v3 rules and AI difficulty system while improving bot navigation, aim fidelity, the normal match HUD, and tactical information.

### Circular minimap
- Adds a permanent circular minimap in the top-left during matches.
- The minimap is drawn from the real Training Complex blocker geometry rather than a decorative image.
- The local player is shown with a directional arrow.
- Living teammates are always shown.
- Dead teammates disappear until they respawn.
- Enemies remain hidden unless they fire a weapon.
- Firing reveals an enemy on the minimap for 1.5 seconds.
- North Up is the default mode.
- Rotate With Aim is available in the F1 debug tuning panel as groundwork for the later settings menu.

### Match HUD cleanup
- Development diagnostics, build metadata, engine data and dev hints are now hidden during normal gameplay.
- F1 exposes those diagnostics when they are needed.
- The existing top-center round score/timer remains the primary match scoreboard.
- Health, stamina, dash charges and weapon/ammo remain in the normal play HUD.
- The weapon HUD now shows both selected loadout slots and clearly marks the currently active slot.
- Respawn, elimination, streak and Sudden Death presentation remain intact.

### Bot pathfinding upgrade
- Adds a real 32×22 navigation grid derived from the same map collision geometry used by players.
- Adds A* path search with cardinal and diagonal movement.
- Diagonal corner cutting through blocked tiles is rejected.
- Route smoothing removes unnecessary grid-node zig-zagging after a path is found.
- Bots use obstacle-aware paths when line of sight is blocked or when a stuck condition is detected.
- Local wall probes steer strafing/retreat movement away from nearby collision before a bot repeatedly drives into the same wall.
- Stuck detection now forces a route recalculation instead of only flipping a strafe direction.
- Existing weapon-specific preferred ranges, low-health retreating, teammate spacing, weapon switching and AI difficulty behavior are preserved.
- F1 draws active bot navigation routes and reports how many bots currently have paths.

### Aim accuracy pass — no aim assist
- There is still no aim assist, target magnetism, enemy tracking, slowdown, or target-aware correction for the local player.
- The Build 1.4 smoothed cursor is retained but tuned for substantially faster settling and less lag.
- Small hand corrections now enter a high-precision settling zone so the aim cursor reaches the raw mouse location quickly.
- Large turns retain a short acceleration curve but use higher response and speed limits.
- Aim overshoot is clamped.
- The smoothed aim cursor now advances exactly once per game frame.
- Player aim, shot direction and rendered crosshair all read that same frame-locked cursor position, removing a timing mismatch that could make shots appear slightly off.
- Existing canonical weapon spread values remain unchanged.

### AI difficulty preserved
- Beginner — 0.80x
- Average — 1.00x
- Sweat — 1.35x
- Pro — 1.75x
- F1 can still change difficulty and sensitivity live.

### Validation gate
The Windows release workflow runs the full JavaScript syntax validation chain before packaging and now also runs `scripts/test-build-1.41.mjs`. The test verifies collision-safe A* routes between every Blue and Red spawn combination on Training Complex.
