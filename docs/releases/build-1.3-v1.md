# UnblockedTDM Build 1.3 — Version 1

## 3v3 Match Core / Directional Dash

Build 1.3 Version 1 turns the combat sandbox into the first real match structure and establishes the six-player team roster used by the upcoming AI build.

### Match structure
- Blue Team and Red Team now each contain three persistent Player actors.
- Every match is first to 5 round wins, with a maximum of 9 rounds.
- Each round lasts 1 minute 30 seconds.
- First team to 12 kills wins the round immediately.
- If time expires with unequal scores, the higher-scoring team wins the round.
- If time expires tied, the round enters Sudden Death and the next kill wins.
- Every round begins with a 5-second frozen countdown.
- Round breaks last 10 seconds.
- Teams swap physical starting sides every round while retaining Blue/Red team identity.
- New rounds restore health, stamina, ammunition and all four dash charges.
- Normal deaths still do not restore dash charges.
- Existing 3-second respawns and 1-second spawn protection remain active during live rounds.
- Match HUD now shows round number, round wins, team kill score and round timer.
- Round-win, Sudden Death and match-win overlays are integrated into the live arena.

### Six-player roster
- The match now instantiates three Blue and three Red Player entities using the same Player, HealthState and weapon presentation systems.
- The local player is Blue slot 1.
- The other five actors are persistent match participants and valid enemy targets.
- Build 1.4 activates full AI movement, aiming, shooting and team behavior for those five actors; Build 1.3 intentionally owns match structure rather than shipping partial bot logic.

### Directional dash update
- Dash now prioritizes the movement keys currently being held.
- W, A, S and D dash in their corresponding world directions regardless of aim direction.
- Diagonal movement inputs produce diagonal dashes.
- Strafing right while aiming elsewhere now dashes right.
- When no movement input is held, dash falls back to the current aim direction.
- Existing 3-tile distance, 15 stamina cost, 4-charge round pool, 0.3s cooldown and 0.5s invulnerability remain unchanged.

### Preserved
- Complete eight-weapon roster and loadout selection.
- Weapon switching through 1/2, numpad and mouse wheel.
- Physical sniper and launcher projectiles.
- Shotgun pellet and shell-reload behavior.
- Health, regeneration, death, respawn and spawn protection.
- Combat presentation, damage numbers, hitmarkers, explosions and kill-feedback framework.
