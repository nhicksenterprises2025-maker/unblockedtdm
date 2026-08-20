# Build 1.3 v1 Test Plan

## Directional dash
- Hold W then dash: movement is upward regardless of aim.
- Hold A then dash: movement is left regardless of aim.
- Hold S then dash: movement is downward regardless of aim.
- Hold D then dash: movement is right regardless of aim.
- Hold two movement keys: dash follows the normalized diagonal.
- Hold no movement key: dash follows aim direction.
- Verify dash keeps 3-tile distance, 15 stamina cost, 0.3s cooldown, 0.5s invulnerability and four charges per round.

## Round state machine
- Pre-round countdown begins at 5 seconds and freezes local combat movement.
- Live round begins at GO and starts a 1:30 timer.
- Reaching 12 kills ends the round immediately.
- Unequal score at 0:00 awards the leading team the round.
- Tied score at 0:00 enters Sudden Death with no timer; next kill wins.
- Round break lasts 10 seconds.
- Next round increments the round number, clears kill score, restores round resources and swaps starting sides.
- First team to five round wins ends the match.
- Round nine cannot advance to a tenth round.

## Roster / respawn
- Exactly three Blue and three Red actors exist.
- Local player is Blue slot 1.
- Death uses the existing 3-second respawn and spawn protection.
- Death does not refill dash charges.
- New round resets dash charges to four.
- Passive participants persist as roster entities for Build 1.4 AI activation.
