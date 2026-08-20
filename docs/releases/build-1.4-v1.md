# UnblockedTDM Build 1.4 — Version 1

## AI / Spawn / Aim Physics

Build 1.4 Version 1 upgrades the local 3v3 match introduced in 1.3. The focus is smarter bots, safer dynamic spawning, less robotic aim response, and live tuning controls for AI difficulty and player sensitivity.

### AI difficulty modes
The four canonical debug difficulty modes are:
- Beginner — 0.80x
- Average — 1.00x
- Sweat — 1.35x
- Pro — 1.75x

The multiplier changes AI decision/reaction speed, target commitment, aim error, aiming response, semi-auto cadence requests, dash decision frequency and tactical update frequency. It does not alter canonical weapon damage, health, ammo, player movement speeds or weapon fire-rate limits.

### AI behavior upgrade
- Bots now score targets instead of blindly selecting the nearest living enemy.
- Lower-health targets are more attractive while team-spacing logic reduces bot stacking.
- Bots maintain weapon-specific preferred engagement distances.
- Bots can switch between their Primary and Secondary when the alternate weapon better fits the current range or the current weapon is exhausted.
- Launcher users avoid firing inside the unsafe close splash envelope.
- Low-health bots retreat/reposition to create regeneration opportunities.
- Reload decisions account for line of sight, ammo percentage and engagement distance.
- Route selection now rotates between lanes and contains stuck detection/re-route behavior.
- Strafing, sprinting and dash decisions scale with AI difficulty.
- Aim uses reaction delay, aim settling and difficulty-scaled error rather than instant perfect target locking.

### Aim physics and sensitivity
- Local aim no longer snaps the firing angle directly to the mouse target.
- Aim now has angular velocity, acceleration, damping and a maximum turn rate.
- Sensitivity directly scales aim response and maximum turn speed.
- Default sensitivity is 1.00x.
- Debug sensitivity range is 0.35x through 2.50x in 0.05 increments.
- Sensitivity is persisted locally between game launches.

### Debug tuning panel
Press F1 to open the Build 1.4 tuning panel while also enabling the existing collision/debug view.
- AI difficulty can be changed live during a match.
- All five bots read the selected mode immediately; no restart is required.
- Aim sensitivity can be changed live and is saved locally.
- Diagnostics display the current AI mode/multiplier and sensitivity value.

### Spawn-system upgrade
- Enemy line of sight is penalized more aggressively.
- Spawns visible to multiple enemies receive an additional safety penalty.
- Very close enemies strongly suppress a candidate spawn.
- Safe distance, teammate proximity, recent combat and repeated-spawn avoidance all contribute to scoring.
- Previous 3-second respawn and 1-second spawn-protection rules remain unchanged.

### Preserved
- 3v3 Blue vs Red match structure.
- 1:30 rounds, first to 12 kills, Sudden Death on timer ties.
- First to 5 round wins, maximum 9 rounds.
- Directional movement-key dash with aim-direction fallback when no movement key is held.
- All eight canonical weapon stat blocks.
- Zero friendly fire.
- Existing launcher/update/version archive infrastructure.

### Validation gate
The release workflow runs the full JavaScript syntax validation chain before Windows packaging, now including `debug-tuning.js`, the upgraded BotController, Input, Player aim physics and SpawnSystem.
