# Skirmish Arena 2.3.4 — Build 1

## Transparent Combat HUD + Dash Independence

2.3.4 finishes the current 2.3.x visual-cleanup cycle by removing persistent boxed HUD panels from live gameplay, separating overlapping combat information, fixing the duplicate Weapon Info navigation control, and making dash mobility independent from sprint stamina.

### In-match HUD

- Removes panel backgrounds, borders, blur cards and boxed-dashboard treatment from persistent live combat HUD elements.
- Health is now a compact static text/value + thin health line at the bottom-left.
- Stamina is now a compact static text/value + thin stamina line beneath Health.
- Dash count and charge pips receive their own independent bottom-left anchor instead of overlapping the weapon panel.
- Weapon name, state, ammo and weapon-slot information remain at the bottom-right as transparent typography.
- Active weapon slot is indicated with restrained cyan text/underline instead of a filled box.
- Match score remains top-center without a container panel.
- Kill-feed rows render as transparent text instead of stacked boxes.
- Tactical Map / Scoreboard shortcut copy is reduced to a plain text hint.
- The circular minimap remains available but loses its surrounding panel treatment.
- Intentionally opened full-screen interfaces such as Scoreboard, Tactical Map and Pause remain proper panels for readability.

### HUD overlap repair

- Health, Stamina, Dash and Weapon HUD elements now have explicit independent anchors.
- Dash no longer sits above or inside the weapon/ammo presentation.
- Responsive rules preserve separation on narrower and shorter displays.

### Dash gameplay change

- Dash stamina cost is now `0`.
- Dashing is allowed even when sprint stamina is empty.
- Dashing does not reduce the stamina meter.
- Dash still uses the existing four-charge system, dash cooldown, distance and invulnerability rules.
- Sprint remains the only movement mechanic that drains the stamina resource.

### Weapon Info repair

- Fixes the duplicate `BACK TO MAIN MENU` controls visible in 2.3.3.
- 2.3.4 removes stale 2.2.1 Back controls whenever the modern Weapon Info header is configured.
- A CSS fail-safe makes the historical 2.2.1 Back control non-renderable under the 2.3.4 UI layer.
- The Weapon Info header now explicitly groups its eyebrow, title and description on the left with exactly one Back control on the right.
- The all-eight-weapon catalog and exact canonical weapon reference data remain unchanged.

### Compatibility / isolation

- Keeps the 2.3.3 Loadouts-focused layout and enlarged real weapon renders.
- Keeps the 2.3.2 Home cleanup and simplified Weapon Info command icon.
- Keeps the 1–1000 Career system unchanged.
- Keeps Tactical Map and Scoreboard controls/rebinding unchanged.
- Does not modify `game/src/data/weapons.js`.
- Does not include the pending 2.4 weapon-balance changes.

## Release contract

2.3.4 is the final UI/mobility cleanup before the planned 2.4 weapon-balance update. Weapon balance remains isolated so the next release can be reviewed and tested independently.
