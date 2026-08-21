import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const phase2 = read('game/src/phase2-ui.js');
const css = read('game/src/ui-v20.css');
const menu = read('game/src/ui/MainMenu.js');
const tuning = read('game/src/debug-tuning.js');
const weapons = read('game/src/data/weapons.js');

for (const token of ["['play', 'loadouts', 'weapon-info', 'settings', 'quit']", "[data-menu-action=\"home\"]", 'nav-glyph', 'GAMEPLAY', 'CONTROLS', 'weapon-model-stage']) {
  assert.ok(phase2.includes(token), `Phase 2 runtime missing ${token}`);
}
assert.ok(css.includes('[data-phase2-order="play"]'), 'PLAY must have dominant Phase 2 styling.');
assert.ok(css.includes('.weapon-model-stage'), 'Loadouts must have weapon-model presentation.');
assert.ok(menu.includes('spreadVisualizer'), 'Weapon Info must include a spread visualizer.');
assert.ok(menu.includes('formatWeaponStats'), 'Weapon Info must retain exact canonical stat values.');
assert.ok(menu.includes('Stationary') && menu.includes('ADS'), 'Spread view must expose stationary and ADS spread values.');
assert.ok(tuning.includes("import('./phase2-ui.js')"), 'Phase 2 must load through normal startup.');
for (const token of ['damage: 20', 'damage: 11', 'damage: 145', 'damage: 16', 'damage: 24', 'damage: 15', 'damage: 125', 'damage: 75']) {
  assert.ok(weapons.includes(token), `Canonical weapon data unexpectedly missing ${token}`);
}
console.log('Phase 2 UI checks passed: hierarchy, functional source reuse, loadout models, exact weapon data and spread presentation are present.');
