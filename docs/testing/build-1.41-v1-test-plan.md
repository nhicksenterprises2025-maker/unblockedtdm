# Build 1.41 v1 Runtime Test Plan

## Aim fidelity
1. Set sensitivity to 1.00x in F1.
2. Make slow micro-adjustments around the player and confirm the crosshair settles quickly without visible float.
3. Make fast 90–180 degree turns and confirm the cursor remains smooth but catches the raw mouse position faster than Build 1.4.
4. Fire during slow and fast aim changes and confirm the shot direction matches the visible crosshair for that frame.
5. Repeat at 0.35x, 1.00x and 2.50x.
6. Confirm there is no target magnetism, slowdown, snapping or enemy-aware correction.

## Bot navigation
1. Run several full rounds on each AI difficulty.
2. Watch bots approach all three lanes and verify they route around walls/cover rather than continuously pressing into collision.
3. Press F1 and inspect active route lines/waypoints.
4. Confirm a bot that becomes movement-blocked recalculates its route instead of remaining stuck indefinitely.
5. Confirm bots can still strafe, retreat, switch weapons, reload, sprint and dash while navigation is active.
6. Confirm teammates remain pass-through and enemies remain physical blockers.

## Minimap
1. Confirm the circular minimap appears top-left only as normal match HUD, not as a full debug overlay.
2. Confirm local player direction updates correctly.
3. Confirm living teammates are always visible and disappear while dead.
4. Confirm enemies are hidden while not firing.
5. Fire each enemy weapon class and verify the enemy becomes visible for approximately 1.5 seconds.
6. Toggle North Up / Rotate With Aim from F1 and verify both transformations remain aligned with map geometry.

## HUD
1. Confirm normal gameplay no longer shows the diagnostics/build/dev panels.
2. Confirm F1 reveals diagnostics, tuning controls, collision debug and bot paths.
3. Confirm health, stamina, dash, weapon/ammo, round wins, kills, round number and timer remain visible in normal play.
4. Switch between Primary and Secondary and confirm the active loadout indicator changes correctly.
5. Verify respawn, Sudden Death, round-win and match-win overlays still function.

## Automated gate
`npm run check` must pass, including `scripts/test-build-1.41.mjs`, before the Windows package is considered release-ready.
