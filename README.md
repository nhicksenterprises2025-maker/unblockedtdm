# Skirmish Arena

Skirmish Arena is a fast 2D top-down 3v3 arena shooter for Windows built around independent aim, directional movement, dash mobility, distinct weapon handling, tactical information and short first-to-five round matches.

## Current public build

**Skirmish Arena 2.3.1 — Build 1**  
Phase: **UI Identity + Arsenal Reference**  
Release sequence: **46**

2.3.1 builds directly on the confirmed working 2.2.1 runtime. It keeps the stable Main Menu controller, Level 1–1000 Career system, persistence and competitive gameplay intact while improving the home identity, command artwork, UI readability, Tactical Map/Scoreboard presentation and rebuilding Weapon Info as a complete all-eight-weapon reference page.

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
- Supplied metallic Skirmish Arena production logo in the home hero.
- Lighter silver/gray Play command treatment with silver Play icon.
- Loadouts command artwork uses actual posed in-game WeaponRenderer models.
- Weapon Info command uses a blue blueprint/manual gun sketch.
- Settings keeps the silver gear treatment; Quit remains unchanged.
- Three created loadout slots on a fresh profile, expandable to the existing **25-slot maximum**.
- Persistent loadout names, Primary/Secondary choices, settings and keybinds.
- Rebindable movement, sprint, dash, reload, weapon slots, Fire, ADS, Tactical Map and Scoreboard controls.
- Tactical HUD with score, timer, health, stamina, dash, weapons and ammunition.
- Circular minimap plus full tactical map.
- Live kill feed and a scoreboard with **Kills, Deaths, Assists, K/D and Damage**.
- Top-three performer presentation with #1 identified as MVP.
- Full postgame results, round history, Rematch and Main Menu flow.

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

2.3.1 replaces the old selector/detail Weapon Info layout with one dedicated full-screen arsenal reference page. All eight live weapons appear in one continuous vertically scrollable catalog.

Every weapon card includes:
- the actual in-game WeaponRenderer model;
- exact canonical numerical combat values;
- readable stat bars;
- weapon role and handling context;
- Base, Moving and ADS spread previews rendered through the same gameplay crosshair system used in matches.

The Weapon Info page is hard-isolated from Home, Career and Settings so its content cannot leak beneath other menu views.

## Distribution

The **Skirmish Arena Launcher** is the main install/update path.

Current launcher line: **1.0.4**.

The launcher installs the bundled game, checks the live release channel, verifies SHA-256 hashes, repairs the managed installation, launches the game and supports archived versions. Existing installations use the sequence-based update channel, so sequence 46 is offered after the stable 2.2.1 sequence-45 rollback.

Some internal executable and managed-install paths retain the original `UnblockedTDM` filename for compatibility. Public product branding is **Skirmish Arena**.

## Release validation

`npm run check` validates the established gameplay foundation, Skirmish Arena UI phases, Career progression, 2.2.1 control/Shotgun contracts and the 2.3.1 hero-logo/all-eight-weapon-reference contract.

The 2.3.1 regression gate also confirms the working Career runtime remains present, Tactical Map and Scoreboard remain rebindable, fresh profiles remain 3 loadouts expandable to 25, scoreboard columns remain K/D/A/K-D/Damage, real gameplay weapon models and crosshair previews are used, and the approved Shotgun range contract is unchanged.

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

Skirmish Arena is developed through iterative implementation, hands-on playtesting, regression testing and versioned releases. Known-good releases are preserved so presentation updates can be layered onto stable gameplay without rebuilding working systems from scratch.
