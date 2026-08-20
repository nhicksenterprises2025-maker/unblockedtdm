# UnblockedTDM Build 1.3 — Version 1

## 3v3 Match System / Directional Dash

Build 1.3 Version 1 converts the previous combat sandbox into the first complete local 3v3 round-based Team Deathmatch loop. It also changes dash direction so held movement input takes priority over aim direction.

### Full 3v3 match loop
- Blue Team and Red Team now field three players each.
- The local player is joined by two Blue AI teammates against three Red AI opponents.
- All six actors use the existing Player, HealthState, WeaponManager, DamageSystem and respawn systems.
- AI players aim, move, strafe, sprint, ADS, fire, reload, use weapon-specific ranges and can dash under pressure.
- AI loadouts use the canonical eight-weapon roster rather than placeholder weapons.

### Round rules
- Each round lasts 1 minute 30 seconds.
- First team to 12 credited kills wins the round immediately.
- If time expires, the team with more kills wins.
- A tied timer enters Sudden Death and the next credited kill wins the round.
- The first team to 5 round wins takes the match, with a maximum of 9 rounds.
- Every round starts with a 5-second frozen countdown and GO presentation.
- Round breaks last 10 seconds.
- Teams swap physical starting sides every round.
- Match-over presentation shows the winner; Enter restarts the match with the current local loadout for testing.

### Respawn and scoring integration
- Existing 3-second respawns and 1-second spawn protection now operate across all six players.
- Dynamic spawn scoring is used during live rounds.
- Dash charges do not reset on death.
- All four dash charges reset at the beginning of every new round.
- Projectile state is cleared between rounds.
- Suicide kills do not automatically award a team point.
- If a player self-eliminates after enemy damage within the existing 5-second suicide-credit window, the recent enemy attacker receives kill credit.
- Assist accounting is initialized at the previously defined 45-damage threshold for later postgame/stat screens.

### Directional dash
- If W/A/S/D or an arrow direction is held when Space is pressed, dash follows that movement vector.
- Strafing right + dash now dashes directly right even if the crosshair is aiming elsewhere.
- Diagonal movement input produces a normalized diagonal dash.
- If no movement direction is held, Space continues to dash toward the current aim direction.
- Enemy players now act as movement blockers while teammates remain pass-through, including during swept dash movement.

### Match HUD
- Added top-center round HUD with Blue/Red round wins, current round kills, round number and timer.
- Added countdown, GO, Sudden Death, round-win and match-win overlays.
- Sudden Death replaces the normal timer label.
- Development target controls from earlier builds are removed from the primary match loop.

### Validation before publish
- Match-state simulation passed countdown, 12-kill round victory, 10-second round transition, alternating starting sides, timer-tie Sudden Death and Sudden Death resolution.
- Directional-dash simulation verified held movement overrides aim and no-movement dash still follows aim.
- New BotController and MatchManager modules pass Node syntax validation.
- Existing weapon, movement, health, projectile, loadout and launcher systems remain in the release validation chain.

### Road to 2.0
- 1.4: spawn and team-AI upgrade.
- 1.5: full minimap and match-HUD pass.
- 1.6: 25 persistent loadouts and between-round loadout changes.
- 1.7: full main menu and settings/control rebinding.
- 1.8: postgame stats, winner flow and rematch.
- 1.9: feature-complete release candidate and stability/balance pass.
- 2.0: major visual, animation, VFX, audio, camera, UI and presentation polish update.
