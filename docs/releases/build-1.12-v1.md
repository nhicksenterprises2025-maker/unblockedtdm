# UnblockedTDM Build 1.12 — Version 1

## Health / Damage / Death / Respawn

Build 1.12 Version 1 adds the complete reusable player survivability layer and connects it to the dash system, spawn framework, visual feedback, and future combat hooks.

### Added
- 150 maximum HP with no armor layer.
- Central DamageSystem with attacker/source metadata, friendly-fire rejection, self-damage hooks, dash-invulnerability checks, and spawn-protection checks.
- 7-second no-damage regeneration delay.
- Regeneration only when below 75 HP, stopping at the 75 HP cap.
- Initial regeneration tuning at 15 HP per second.
- Thin damage-only health bar above the character that fades after combat.
- Character hit flash.
- Directional attacker indicator.
- Subtle recent-hit and low-health red edge vignette.
- Damage history tracking for future kill, assist, and suicide-credit systems.
- Team-colored particle death burst with no corpse left behind.
- 3-second death/respawn cycle.
- Respawn restores 150 HP and 100 stamina while preserving remaining dash charges.
- 1-second spawn protection, already connected to the common invulnerability path.
- Firing hook that will cancel spawn protection once weapons arrive.
- Round reset path that separately restores dash charges, health, stamina, and position.
- Dynamic SpawnSystem that scores enemy distance, enemy line-of-sight, teammate proximity, and recent-combat danger.
- Safe spawn rotation while the single-player development runtime has no enemies yet.
- Respawn camera snap to prevent a cross-map camera glide after death.

### Development verification controls
- F2: apply 25 enemy damage.
- F3: apply 75 enemy damage.
- F4: apply lethal enemy damage.
- G: attempt 50 same-team damage and verify friendly fire is rejected.
- R: run a round reset and verify all round-scoped resources restore.

Damage tests originate from the current mouse position, so the directional damage indicator can be verified from any angle.

### Preserved
- Naturalized segmented character and animation blending from Build 1.11 v1.
- 5 tiles/second movement.
- Shift sprint at +35%.
- 100 stamina, 5-second sprint duration, 2.8-second delay, and 3.2-second refill.
- Four 3-tile dash charges, 15 stamina cost, 0.3-second cooldown, and 0.5-second dash invulnerability.
- Swept dash collision, camera lead, map collision, cover fading, Training Complex, F1 debug, F11 fullscreen, and ESC pause.
- Existing launcher, installer, update, rollback, repair, and immutable Version Archive infrastructure.
