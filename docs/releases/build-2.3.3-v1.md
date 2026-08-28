# Skirmish Arena 2.3.3 — Build 1

## Loadouts Focus + Weapon Scale

2.3.3 keeps the stable 2.3.2 Home/Career/boot foundation and narrows the Loadouts screen back to its actual job: choosing, saving and managing primary + secondary weapon combinations.

### Loadouts presentation

- Enlarges the real in-game weapon renders in every primary and secondary selection card.
- Enlarges the selected-weapon render so it uses the available preview area instead of appearing undersized.
- Keeps the one-page Loadouts layout and existing save/equip interactions.
- Keeps three fresh loadout slots with manual expansion up to 25.

### Reference clutter removed from Loadouts

- Removes exact stat tables from the Loadouts screen.
- Removes Power / Rate / Range / Control stat bars from Loadouts.
- Removes Base / Moving / ADS spread visualization from Loadouts.
- Removes weapon-description reference paragraphs from Loadouts.
- Removes fire-mode and swap-tier labels from selection cards.
- Keeps only the information needed to identify, equip and save the weapon.

The dedicated Weapon Info page remains the full canonical weapon reference with all eight weapons, actual gameplay models, exact stats, stat bars, handling data and live spread visualization.

### Safety / compatibility

- Does not replace the Main Menu controller.
- Does not change deterministic boot integrity.
- Does not modify Career or progression data.
- Does not modify Tactical Map, scoreboard or controls.
- Does not modify `game/src/data/weapons.js` or any weapon-balance values.

### Gameplay contract

No weapon balance, movement, AI, map, spawn, match-rule, dash, stamina or Career-economy changes in this release.
