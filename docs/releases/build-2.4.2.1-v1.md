# Skirmish Arena 2.4.2.1 — Build 1

## Adaptive HUD Occlusion + Kill Feed Readability

A small HUD hotfix before the 2.5 map update.

### Minimap occlusion
- The local player's real screen-space position is compared against the minimap's live DOM bounds.
- When the player moves beneath/behind the minimap, the minimap smoothly fades to 40% opacity and brightens so the character remains visible.
- A small padded overlap zone starts the fade before the character becomes fully hidden.
- The minimap automatically returns to normal opacity/contrast as soon as the player clears that area.
- Normal minimap tactical data, teammate/enemy reveal rules and circular presentation remain unchanged.

### Kill feed
- Kill-feed width is increased.
- Player names are larger.
- Weapon labels are larger.
- Row height and spacing are increased for faster readability.
- Team-color identity, critical-kill treatment and the transparent/no-box presentation remain intact.

### Compatibility
- No weapon-balance changes.
- No movement, AI, damage, Career, loadout, map or match-rule changes.
- 2.4.1.2 split-team scoreboard remains intact.
- Dash remains independent from stamina.
- 2.4.1 low-ammo warning, pump shotgun and custom bot gamertags remain intact.
- Deterministic startup and packaged Windows EXE smoke tests remain release-blocking requirements.
