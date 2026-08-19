# UnblockedTDM Build 1.11 — Version 1

## Dash / Movement Polish

This build finishes the core player movement kit and replaces the first-pass character motion with a more natural, readable body and locomotion system.

### Added — Dash
- Space activates dash.
- 4 dash charges are tracked by the player and exposed to the HUD.
- Dash travels 3 tiles in the current aim direction.
- Dash costs 15 stamina.
- 0.3-second minimum cooldown after each dash.
- 0.5 seconds of invulnerability begins at dash activation.
- Dash uses swept/sub-stepped collision so high-speed movement cannot tunnel through walls.
- Hitting blocking geometry shortens the dash instead of clipping through it.
- Dash state exposes future combat hooks for firing lockout, weapon-switch lockout, round reset, and invulnerability checks.
- Dash afterimages, ground streak, team-ring response, and invulnerability ring.
- Four-pip dash HUD with spent-charge and denied-dash feedback.
- F1 debug view shows intended 3-tile dash direction/end point.

### Improved — Character and locomotion
- Reworked the player from simple ellipse/line motion into a segmented stylized body.
- Separate thighs, knees, lower legs, feet, upper arms, elbows, forearms, hands, torso, neck, head, hair, and facial direction cues.
- Lower body turns smoothly toward actual movement direction instead of snapping.
- Upper body smoothly follows mouse aim independently.
- When stationary, the lower body gradually settles toward aim direction.
- Walking and sprint gait cycles slowed and re-timed to look less mechanical.
- Natural stride amplitude, foot placement, knee bend, body bob, shoulder movement, breathing, and movement lean.
- Sprint and dash blend in/out rather than instantly changing the rendered pose.
- Gameplay movement remains responsive; the smoothing is visual and does not add input latency.

### Preserved
- 5 tiles/second base movement.
- Sprint at +35% speed.
- 100 stamina, 5-second full sprint, 2.8-second regen delay, 3.2-second full refill.
- Mouse aim and independent lower-body movement.
- Training Complex map, 64px tile system, collision, camera lead, cover fading, pause, fullscreen, and diagnostics.
- Existing launcher, updater, rollback, repair, and immutable Version Archive.

Health, damage, death, respawn, weapons, enemies, and match scoring remain assigned to later complete builds.
