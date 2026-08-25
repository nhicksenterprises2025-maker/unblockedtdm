# Skirmish Arena

Skirmish Arena is a fast 2D top-down 3v3 arena shooter for Windows built around movement, aim, loadouts, round control and repeatable short-form matches.

The game is currently in its final pre-release stage. **Version 1.99.3 is the last release candidate before the official 2.0 launch.**

## Current public build

**Skirmish Arena 1.99.3 — Build 1**  
Phase: **Final Release Candidate**

1.99.3 is the final stability and performance pass before 2.0. The current build contains the complete playable match loop, fullscreen game UI, launcher/update flow, tactical HUD, finished weapon roster, postgame flow, audio/VFX pass and the latest Training Complex presentation.

## Current playable systems

- Fullscreen Main Menu with **Play, Loadouts, Weapon Info, Settings and Quit**.
- Full 3v3 matches with one local player, two Blue teammates and three Red opponents.
- Training Complex arena with a larger-than-screen battlefield, structured lanes, cover, spawn areas and tactical landmarks.
- Sprint and stamina movement system.
- Four-charge directional dash system.
- Independent mouse aiming with adjustable sensitivity.
- Persistent rebindable controls for movement, sprint, dash, reload, weapon slots, fire and ADS.
- **25 persistent saved loadout slots** with custom names and Primary / Secondary weapon selection.
- Eight playable weapons: **Assault Rifle, SMG, Sniper Rifle, Shotgun, LMG, Pistol, Launcher and Melee**.
- Weapon-specific handling, reload behavior, movement penalties, swap speeds, projectile behavior and accuracy characteristics.
- Full match structure with a pre-round countdown, 1:30 rounds, first to 12 kills, Sudden Death, side swapping and first to 5 round wins.
- Between-round loadout switching during the round break.
- Tactical match HUD with round score, kill count, timer, health, stamina, dash charges and ammo information.
- Circular minimap and full tactical map.
- Live kill feed with dedicated critical-kill presentation.
- Full scoreboard with kills, deaths, assists, K/D and damage.
- Top-performer and MVP presentation.
- Pause menu with Match and Settings views.
- Settings for sensitivity, minimap orientation, screen shake, damage vignette, Auto Sprint, audio, master volume, fullscreen and keybinds.
- 150 HP combat loop with regeneration, elimination, respawning and spawn protection.
- Weapon audio, reload audio, footsteps and combat feedback.
- Muzzle flashes, impact effects, critical-hit feedback, explosions, debris, tracers, hitmarkers, damage numbers and screen shake.
- Visible elimination remnants instead of players instantly disappearing.
- Refined Training Complex materials, lighting, structure accents and visual readability.
- Full postgame screen with K/D/A, damage, K/D ratio, critical hits, best streak, match duration and round history.
- Functional **REMATCH** and **MAIN MENU** postgame flow.
- Last completed match result shown on the Main Menu.
- Automatic pause protection when the game window loses focus.
- Fullscreen-responsive UI designed for 1080p and smaller 16:9 displays.
- Dedicated Skirmish Arena launcher for installing, updating, repairing and launching the game.
- Build archive support for previous published versions.

## Road to 2.0

- **1.4** — Aim / Match AI / Spawn foundation ✅
- **1.41** — Match HUD + Circular Minimap + Navigation improvements ✅
- **1.5** — Persistent Loadouts + Between-Round Changes + Pause Settings ✅
- **1.6** — Main Menu + Settings + Keybinds + Weapon Info ✅
- **1.7** — Postgame Stats + Winner / Rematch Flow + Launcher Redesign ✅
- **1.8** — Full Game-Flow Integration + Unified Game UI ✅
- **1.9 / 1.9.2** — Release-candidate HUD + Loadout expansion / hotfixes ✅
- **1.9.3** — Skirmish Arena rebrand foundation ✅
- **1.94.1** — Fullscreen menu hierarchy + front-end restructuring ✅
- **1.95** — Tactical HUD + Scoreboard + Kill Feed + Full Tactical Map ✅
- **1.96.1** — Audio + Auto Sprint + Fullscreen interaction pass ✅
- **1.97.1** — Fullscreen HUD correction + Combat VFX pass ✅
- **1.98.1** — Main Menu rebuild + front-end polish ✅
- **1.99.1** — Training Complex visual overhaul ✅
- **1.99.2** — Professional match UI + Final Launcher pass ✅
- **1.99.3** — Final Release Candidate + performance / stability hardening ✅
- **2.0** — **Official Release** — final scope being prepared

## Distribution

The **Skirmish Arena Launcher** is the main way to install and run the game. Published Windows builds are packaged through GitHub Actions and distributed through the live launcher manifest.

The launcher can:

- Install the current game build.
- Detect and install newer game versions.
- Verify installed game files.
- Repair an incorrect or outdated installation.
- Launch the game directly.
- View and install archived builds.

Some installer and executable filenames still use the project's original `UnblockedTDM` package name while the public game branding is **Skirmish Arena**.

When a release includes changes to the launcher application itself, install that release's launcher setup package to receive the newest launcher UI and launcher code.

## Development

**AI Developer: Sol**

I handle the engineering side of Skirmish Arena: gameplay implementation, UI systems, build tooling, regression testing, release automation and technical iteration. Development is driven by hands-on playtesting, direct feedback and continuous version-by-version refinement.

The goal is not to hide that AI is part of the development process. Skirmish Arena is being built as a real playable game with persistent systems, release infrastructure, testing and an actively evolving design rather than as a one-off generated demo.

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
