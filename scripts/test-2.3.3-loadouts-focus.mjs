import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const loadout = read('game/src/ui/LoadoutScreen.js');
const css = read('game/src/ui-2.3.3.css');
const runtime = read('game/src/phase231-runtime.js');
const store = read('game/src/data/LoadoutStore.js');
const weapons = read('game/src/data/weapons.js');

assert.ok(loadout.includes("import { PRIMARY_WEAPONS, SECONDARY_WEAPONS }"), 'Loadouts should import only the weapon pools it needs.');
assert.equal(loadout.includes('formatWeaponStats'), false, 'Exact stat formatting belongs in Weapon Info, not Loadouts.');
assert.equal(loadout.includes('statBarsHtml'), false, 'Stat bars must be removed from Loadouts.');
assert.equal(loadout.includes('spreadVisualHtml'), false, 'Spread visualization must be removed from Loadouts.');
assert.equal(loadout.includes('weapon-rule'), false, 'Weapon description/reference copy must be removed from Loadouts.');
assert.equal(loadout.includes('SWAP T'), false, 'Swap-tier reference copy must not clutter Loadouts weapon cards.');
assert.equal(loadout.includes('fireMode.toUpperCase()'), false, 'Fire-mode reference copy must not clutter Loadouts weapon cards.');
assert.ok(loadout.includes('weaponModelSvg(item)'), 'Weapon selection cards must retain actual gameplay weapon models.');
assert.ok(loadout.includes('weaponModelSvg(weapon)'), 'Selected-weapon preview must retain the actual gameplay model.');
assert.ok(loadout.includes('data-loadout-index'), 'Saved loadout selection must remain functional.');
assert.ok(loadout.includes('data-slot="primary"') && loadout.includes('data-slot="secondary"'), 'Primary and secondary slot switching must remain functional.');
assert.ok(loadout.includes('id="selectWeapon"'), 'Explicit weapon equip action must remain available.');
assert.ok(loadout.includes('id="deployButton"'), 'Save/deploy flow must remain available.');

assert.ok(css.includes('height:clamp(72px,10.5vh,112px)'), 'Weapon-card model stages must be materially larger than the old 34px treatment.');
assert.ok(css.includes('width:min(96%,220px)'), 'Weapon-card canvases must fill substantially more of their card.');
assert.ok(css.includes('width:min(92%,620px)'), 'Selected weapon preview must use the available detail area.');
assert.ok(css.includes('height:clamp(180px,30vh,310px)'), 'Selected weapon preview must be visually dominant.');
assert.ok(runtime.includes("ensureStyle('ui-2.3.3.css')"), '2.3.3 Loadouts stylesheet must load from the deterministic presentation runtime.');
assert.ok(runtime.includes("document.body.classList.add('ui-231', 'ui-232', 'ui-233')"), '2.3.3 body state must be active after boot.');

assert.ok(store.includes('LOADOUT_SLOT_COUNT = 25'), 'Loadout capacity must remain 25.');
assert.ok(store.includes('DEFAULT_LOADOUT_SLOT_COUNT = 3'), 'Fresh profiles must still start with three created slots.');
assert.ok(weapons.includes("id: 'assault-rifle'") && weapons.includes("id: 'melee'"), 'Canonical weapon data must remain centralized in weapons.js.');

console.log('Skirmish Arena 2.3.3 checks passed: Loadouts is selection-focused, real weapon models are larger, deep reference clutter is removed, and save/equip contracts remain intact.');
