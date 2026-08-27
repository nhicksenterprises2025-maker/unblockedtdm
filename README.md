# Skirmish Arena

Skirmish Arena is a fast 2D top-down 3v3 arena shooter for Windows built around independent aim, directional movement, dash mobility, distinct weapon handling, tactical information and short first-to-five round matches.

## Current public build

**Skirmish Arena 2.21.1 — Build 3**  
Phase: **Production Packaging Hardening**  
Release sequence: **43**

The live 2.21.1 line includes the complete competitive match loop, the 1–1000 Career system, dedicated full-screen Weapon Info catalog, real gameplay weapon models in UI, tactical scoreboard/map controls, modern packaged UI bootstrap, metallic Skirmish Arena branding and hardened Windows packaging.

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
- Physical Sniper and Launcher projectiles; hitscan for the conventional firearms.
- Shotgun full damage through 2.0 tiles, falloff through 2.5 tiles and no damage beyond 2.5 tiles.
- Combat VFX, hitmarkers, damage numbers, tracers, critical feedback, explosions, debris, screen shake and short-lived elimination remnants.
- Procedural weapon, reload, footstep, explosion and UI audio with master-volume control.

## AI and Training Complex

- Four AI difficulty modes: **Beginner 0.80×, Average 1.00×, Sweat 1.35× and Pro 1.75×**.
- Bots evaluate target priority, engagement range, health, ammunition, weapon choice, retreat opportunities, team spacing and launcher safety.
- A* navigation grid derived from the same Training Complex collision geometry used by players.
- Dynamic spawn scoring based on enemy distance, visibility, teammate proximity and recent danger.
- Training Complex preserves its established competitive geometry while using the later Skirmish Arena material, lighting and readability passes.

## Player-facing systems

- Fullscreen Main Menu with **Play, Loadouts, Weapon Info, Settings and Quit**.
- Three created loadout slots on a fresh profile, expandable to the existing **25-slot maximum**.
- Persistent loadout names, Primary/Secondary choices, settings and keybinds.
- Rebindable movement, sprint, dash, reload, weapon slots, Fire, ADS, Tactical Map and Scoreboard controls.
- Tactical HUD with score, timer, health, stamina, dash, weapons and ammunition.
- Circular minimap plus full tactical map.
- Live kill feed with dedicated critical-elimination treatment.
- Full scoreboard with Kills, Deaths, Assists, K/D and Damage.
- Top-three performer presentation with #1 identified as MVP.
- Full postgame results, round history, Rematch and Main Menu flow.
- Focus-loss auto-pause and hidden-window runtime protection.

## Career progression

Skirmish Arena uses a persistent account Career that does **not** increase weapon damage, health, movement or other competitive values.

- **1,000 Career levels**.
- **26 permanent ranks**, ending at **Omnipotent**.
- 4,137,375 total Career XP to Level 1000.
- Match XP from kills, assists, round results and match victories.
- Five permanent milestone tracks: Kills, Assists, Round Wins, Match Wins and Matches Completed.
- Lifetime wins/losses, K/D/A, damage, critical hits, best streak, play time and recent match history.
- Dedicated Career Overview, Ranks and Milestones screens plus Rank Promotion presentation.

## Weapon Info and UI consistency

2.21.1 uses one dedicated full-screen all-weapons reference catalog. Every weapon card uses the same gameplay `WeaponRenderer` model pipeline as the live match and includes gameplay crosshair-spread previews plus exact canonical numerical data.

The modern packaged game boots through the deterministic `ui-boot.js` module entrypoint, preventing a production package from falling back to the legacy Build 1.6 front-end shell.

## Distribution

The **Skirmish Arena Launcher** is the main install/update path.

Current launcher line: **1.0.3**.

The launcher can install the bundled current game, check the live release channel, automatically install newer builds, verify SHA-256 hashes, repair the managed game installation, launch the game and download/play archived versions.

Fresh Launcher 1.0.3 installations bootstrap directly from **Skirmish Arena 2.21.1 Build 3**. Launcher publishing is isolated from the game release channel, so a launcher release cannot rewrite `distribution/latest.json` or roll the live game back to an older build.

Some internal executable and managed-install paths retain the original `UnblockedTDM` filename for compatibility. Public product branding is **Skirmish Arena**.

## Release validation

`npm run check` runs the current source validation plus the historical regression chain covering the established 1.x gameplay foundation, Skirmish Arena rebrand phases, Career progression, 2.2.1 UI/control/Shotgun contracts and the complete 2.21.1 Weapon Info/packaged-UI/Windows-packaging contract.

Build 3 additionally requires game and launcher Windows icons to contain a 256×256 frame before packaging can proceed.

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

Skirmish Arena is developed through iterative implementation, hands-on playtesting, regression testing and versioned releases. The repository keeps the historical release chain because newer systems are expected to preserve the established competitive contracts unless a release explicitly documents a balance change.
