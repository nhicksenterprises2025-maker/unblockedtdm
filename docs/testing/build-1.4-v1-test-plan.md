# Build 1.4 v1 Test Plan

## Aim physics
1. At 1.00x sensitivity, sweep the mouse across the player and confirm the weapon direction accelerates into the turn instead of snapping instantly.
2. Set sensitivity to 0.35x and confirm turn response is visibly slower.
3. Set sensitivity to 2.50x and confirm turn response is visibly faster without changing weapon spread or damage.
4. Restart the game and confirm the last sensitivity value persists.

## AI difficulty
Run the same opening engagement on each setting:
- Beginner 0.80x
- Average 1.00x
- Sweat 1.35x
- Pro 1.75x

Confirm higher settings reduce reaction/aim-settle time and improve decision cadence without changing weapon damage, magazine size, health or canonical movement speeds.

## Debug panel
1. Press F1 and confirm the tuning panel and collision debug become visible.
2. Change AI difficulty during a live round and confirm bots immediately use the new mode without restarting.
3. Move the sensitivity slider during a live round and confirm the diagnostics value changes and aim response changes.
4. Press F1 again and confirm the tuning panel closes.

## AI behavior
- Confirm bots do not repeatedly fire launchers at unsafe point-blank range.
- Confirm low-health bots attempt to disengage/reposition.
- Confirm bots reload during safer windows rather than always reloading in active LOS.
- Confirm bots can switch Primary/Secondary based on engagement range/ammo state.
- Confirm teammates spread rather than occupying the same movement line.
- Confirm stuck bots change route/strafe direction.

## Spawn safety
- Verify a spawn with direct enemy LOS loses to a covered alternative when available.
- Verify a spawn watched by multiple enemies is heavily penalized.
- Verify recent combat and very close enemies push respawns to safer candidates.
- Verify teammates can still bias a safe spawn without overriding enemy safety.

## Regression
- Directional dash still follows held W/A/S/D or arrow vector and falls back to aim direction with no movement input.
- 3v3 scoring, 12-kill round wins, 1:30 timer, Sudden Death, 10-second round break and first-to-5 match victory remain intact.
- All eight weapon stat blocks remain unchanged.
