# UnblockedTDM Build 1.1 — Version 1

## Character / Movement

This build replaces the World Explorer collision probe with the first real UnblockedTDM player character and completes the base locomotion layer.

### Added
- Full visible stylized player body with head, torso, arms, legs, shadow, and blue-team floor ring.
- Hybrid top-down character rendering for readability.
- Independent mouse aiming: upper body faces the cursor while movement remains independent.
- 5 tiles/second base movement.
- Sprint on Shift at +35% movement speed.
- 100-point sprint stamina pool with 5 seconds of continuous sprint.
- 2.8-second regeneration delay and 3.2-second full stamina refill.
- Sprint body lean, faster leg cycle, and faint speed trail.
- Idle, walk, and sprint locomotion animation states.
- Smooth aim-direction camera lead.
- Player collision against all existing map blockers and world bounds.
- Tall structures now render in the foreground and fade when they overlap the local player.
- Live movement, speed, position, camera, and stamina diagnostics.

### Preserved
- Training Complex 32×22 map.
- 64px tile system.
- Canvas 2D engine loop.
- Existing world collision and camera bounds.
- F1 collision visualization.
- F11 fullscreen.
- ESC pause.
- Same launcher, installer, update, rollback, repair, and Version Archive infrastructure.

No dash, health, weapons, combat, or match scoring are introduced in this build; those remain assigned to their later complete systems.
