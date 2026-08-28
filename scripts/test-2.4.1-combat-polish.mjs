import fs from 'node:fs';
import assert from 'node:assert/strict';
import { WEAPON_LIST } from '../game/src/data/weapons.js';
import { GAMERTAG_VARIANT_COUNT } from '../game/src/data/Gamertags.js';
import { lowAmmoState, lowAmmoThresholdRounds } from '../game/src/combat/AmmoState.js';
import { DASH_STAMINA_COST } from '../game/src/engine/constants.js';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const phase3 = read('game/src/phase3-runtime.js');
const tactical = read('game/src/ui/TacticalHUD.js');
const playerRenderer = read('game/src/render/PlayerRenderer.js');
const phase241 = read('game/src/phase241-runtime.js');
const phase231 = read('game/src/phase231-runtime.js');
const css = read('game/src/ui-2.4.1.css');
const postgame = read('game/src/ui/PostgameScreen.js');

assert.ok(GAMERTAG_VARIANT_COUNT > 1000, '2.4.1 must provide more than 1,000 possible bot gamertags.');
assert.ok(phase3.includes('assignBotGamertags(match.players)'), 'Gamertags must be assigned before Tactical HUD initialization.');
assert.ok(tactical.includes('row.displayName'), 'Tactical HUD must prefer custom gamertags over bot IDs.');
assert.ok(tactical.includes('team-blue') && tactical.includes('team-red'), 'Kill feed/scoreboard player names must carry team color classes.');
assert.ok(postgame.includes('row.displayName'), 'Postgame must retain the same custom gamertags.');

assert.equal(lowAmmoThresholdRounds({ magazineSize: 40 }), 4);
assert.equal(lowAmmoThresholdRounds({ magazineSize: 10 }), 1);
assert.equal(lowAmmoThresholdRounds({ magazineSize: 1 }), 0);
assert.equal(lowAmmoState({ magazineSize: 40 }, { magazine: 4 }).active, true);
assert.equal(lowAmmoState({ magazineSize: 40 }, { magazine: 5 }).active, false);
assert.equal(lowAmmoState({ magazineSize: 40 }, { magazine: 2 }).progress, 0.5);
assert.ok(playerRenderer.includes('drawLowAmmoIndicator'), 'Local player renderer must draw the under-body low-ammo bar.');
assert.ok(playerRenderer.includes("fillStyle='#ff4658'"), 'Under-body low-ammo indicator must use the red warning treatment.');
assert.ok(phase241.includes("root.classList.toggle('low-ammo'"), 'Bottom-right ammo HUD must share the same low-ammo state.');
assert.ok(css.includes('#weaponRoot.low-ammo #ammoMagazine'), 'Magazine count must turn red during low ammo.');

assert.ok(phase241.includes('WeaponRenderer.prototype.drawShotgun'), '2.4.1 must replace the shotgun presentation through the shared gameplay renderer.');
for (const token of [
  "ctx.moveTo(-22,-6)",
  'const pumpX = 27 - pumpSlide',
  "ctx.roundRect(pumpX,-6.2,20,12.4,3)",
  "ctx.fillRect(44,-3.4,25,3.4)",
  "ctx.fillRect(44,1.1,21,3.1)"
]) assert.ok(phase241.includes(token), `Pump shotgun renderer missing structural token ${token}.`);
assert.ok(phase241.includes('hydrateWeaponModelCanvases(document)'), 'UI weapon canvases must rehydrate from the same pump shotgun renderer.');

assert.ok(css.includes('.match-hud .blue:first-child span'), 'BLUE ROUNDS label must receive blue team color.');
assert.ok(css.includes('.match-hud .red:last-child span'), 'RED ROUNDS label must receive red team color.');
assert.ok(css.includes('.phase3-feed-row .team-blue') && css.includes('.phase3-feed-row .team-red'), 'Kill feed must color-code both teams.');

assert.ok(phase231.includes("import './phase241-runtime.js'"), '2.4.1 must remain inside the deterministic boot chain.');
assert.equal(DASH_STAMINA_COST, 0, 'Dash must remain independent from stamina after 2.3.4.');

assert.equal(WEAPON_LIST.length, 8, 'Balance changes must preserve the eight-weapon roster.');
for (const weapon of WEAPON_LIST) {
  assert.ok(weapon.id && weapon.name && weapon.slot && weapon.kind, `Weapon schema incomplete for ${weapon?.id || 'unknown'}.`);
  assert.ok(Number.isFinite(weapon.damage) && weapon.damage >= 0, `${weapon.id} damage must remain a valid non-negative number.`);
  assert.ok(Number.isFinite(weapon.fireInterval) && weapon.fireInterval >= 0, `${weapon.id} fire interval must remain valid.`);
  assert.ok(Number.isFinite(weapon.magazineSize) && weapon.magazineSize >= 0, `${weapon.id} magazine size must remain valid.`);
  assert.ok(Number.isFinite(weapon.movementMultiplier) && weapon.movementMultiplier > 0, `${weapon.id} movement multiplier must remain valid.`);
}

console.log('Skirmish Arena 2.4.1 checks passed: team identity, 1,000+ gamertags, shared low-ammo warning, pump shotgun renderer, deterministic boot, and balance-ready weapon schema.');
