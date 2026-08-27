# Skirmish Arena

Skirmish Arena is a fast 2D top-down 3v3 arena shooter for Windows built around independent aim, directional movement, dash mobility, distinct weapon handling, tactical information and short first-to-five round matches.

## Current public build

**Skirmish Arena 2.2.1 — Build 2**  
Phase: **Known-Good Rollback + Weapon Info Hotfix**  
Release sequence: **45**

This release deliberately restores the complete game runtime from the confirmed working `build-2.2.1-v1` line. The later 2.21.1 home/logo/startup changes were removed after they caused broken menu interaction, missing Career presentation and visual regressions. Build 2 changes only the Weapon Info navigation tile/entry behavior on top of that known-good game runtime.

## Core match

- Local **3v3 Blue vs Red Team Deathmatch**.
- One local player, two Blue AI teammates and three Red AI opponents.
- **1:30 rounds**.
- First team to **12 kills** wins the round.
- A tied timer enters **Sudden Death**; the next credited kill wins.
- First team to **5 round wins** takes the match, with a maximum of nine rounds.
- Teams swap physical starting sides each round.
- Three-second respawns and one-second spawn protection.
- Between-round loadout switching during the existing round break.

## Movement and combat

- Independent mouse aiming with adjustable sensitivity and no player aim assist.
- Sprint/stamina system plus **Auto Sprint**, enabled by default.
- Four-charge directional dash with collision protection and dash invulnerability.
- 150 HP combat loop with regeneration, elimination and respawn systems.
- Eight live weapons: **Assault Rifle, SMG, Sniper Rifle, Shotgun, LMG, Pistol, Launcher and Melee**.
- Weapon-specific damage, critical behavior, cadence, magazines, reloads, ADS, spread, movement penalties, swap speeds and range behavior.
- Physical Sniper and Launcher projectiles; hitscan for conventional firearms.
- Shotgun full damage through 2.0 tiles, falloff through 2.5 tiles and no damage beyond 2.5 tiles.
- Combat VFX, hitmarkers, damage numbers, tracers, critical feedback, explosions, debris, screen shake and elimination remnants.

## AI and Training Complex

- Four AI difficulty modes: **Beginner 0.80×, Average 1.00×, Sweat 1.35× and Pro 1.75×**.
- Bots evaluate target priority, engagement range, health, ammunition, weapon choice, retreat opportunities, team spacing and launcher safety.
- A* navigation grid derived from the same Training Complex collision geometry used by players.
- Dynamic spawn scoring based on enemy distance, visibility, teammate proximity and recent danger.

## Player-facing systems

- Fullscreen Main Menu with **Play, Loadouts, Weapon Info, Settings and Quit**.
- Silver Play treatment and live in-game weapon models on the Loadouts tile.
- Three created loadout slots on a fresh profile, expandable to the existing **25-slot maximum**.
- Persistent loadout names, Primary/Secondary choices, settings and keybinds.
- Rebindable movement, sprint, dash, reload, weapon slots, Fire, ADS, Tactical Map and Scoreboard controls.
- Tactical HUD with score, timer, health, stamina, dash, weapons and ammunition.
- Circular minimap plus full tactical map.
- Live kill feed, scoreboard, Top 3/MVP presentation and full postgame flow.

## Career progression

Skirmish Arena uses a persistent account Career that does **not** increase weapon damage, health, movement or other competitive values.

- **1,000 Career levels**.
- **26 permanent ranks**, ending at **Omnipotent**.
- 4,137,375 total Career XP to Level 1000.
- Match XP from kills, assists, round results and match victories.
- Five permanent milestone tracks: Kills, Assists, Round Wins, Match Wins and Matches Completed.
- Lifetime wins/losses, K/D/A, damage, critical hits, best streak, play time and recent match history.
- Dedicated Career Overview, Ranks and Milestones screens plus Rank Promotion presentation.

## Weapon Info

Build 2 preserves the working 2.2.1 Weapon Info system and applies one isolated navigation hotfix. The Weapon Info tile uses a blue blueprint-style gun/manual sketch and explicitly opens the dedicated Weapon Info page. Existing 2.2.1 weapon models, exact canonical stats, spread/handling information and scrolling behavior remain intact.

## Distribution

The **Skirmish Arena Launcher** is the main install/update path.

Current launcher line: **1.0.4**.

The launcher installs the bundled game, checks the live release channel, verifies SHA-256 hashes, repairs the managed installation, launches the game and supports archived versions.

Fresh Launcher 1.0.4 installations bootstrap directly from **Skirmish Arena 2.2.1 Build 2**. Existing installations use the live sequence-based update channel; sequence 45 ensures the rollback is offered even to installations that previously received the broken sequence-44 release.

Some internal executable and managed-install paths retain the original `UnblockedTDM` filename for compatibility. Public product branding is **Skirmish Arena**.

## Release validation

`npm run check` validates the restored 2.2.1 source and the historical regression chain covering the established gameplay foundation, Skirmish Arena rebrand phases, Career progression, UI/control contracts, Weapon Info behavior and the 2.2.1 Shotgun range contract.

## Local development

```bash
npm install
npm run launcher
```

Run the game directly:

```bash
npm run game
```

Validate the current build:

```bash
npm run check
```

Create Windows packages:

```bash
npm run build:windows
```

## Development

Skirmish Arena is developed through iterative implementation, hands-on playtesting, regression testing and versioned releases. Known-good releases are preserved so regressions can be rolled back without rebuilding stable systems from scratch.
