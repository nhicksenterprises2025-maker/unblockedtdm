import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const flow = read('game/src/flow-v18.js');
const css = read('game/src/ui-v1941.css');
const menu = read('game/src/ui/MainMenu.js');
const loadouts = read('game/src/ui/LoadoutScreen.js');
const presentation = read('game/src/ui/WeaponPresentation.js');
const weapons = read('game/src/data/weapons.js');
const constants = read('game/src/engine/constants.js');
const match = read('game/src/match/MatchManager.js');

assert.ok(flow.includes("ensureStyle('ui-v1941.css')"), 'Phase 2 stylesheet must load through the proven front-end flow.');
assert.ok(flow.includes("nav.querySelector('[data-menu-action=\"home\"]')?.remove()"), 'Phase 2 must remove the visible Home button.');
assert.ok(flow.includes("const order = ['play', 'loadouts', 'weapon-info', 'settings', 'quit'];"), 'Phase 2 menu order must be Play, Loadouts/Weapon Info, Settings/Quit.');
for (const action of ['play:', 'loadouts:', "'weapon-info':", 'settings:', 'quit:']) {
  assert.ok(flow.includes(action), `Missing Phase 2 button definition: ${action}`);
}
assert.ok(flow.includes("button.classList.add('phase2-nav-button', `phase2-${action}`)"), 'Phase 2 must decorate the existing working buttons instead of replacing the controller.');
assert.ok(menu.includes("this.root.addEventListener('click'"), 'Phase 2 must preserve delegated menu click handling.');
assert.ok(menu.includes("window.addEventListener('skirmish:show-menu-home'"), 'ESC return must use the MainMenu controller instead of a removed Home button.');
assert.ok(css.includes('grid-template-rows:minmax(128px,1.35fr) minmax(112px,1fr) minmax(112px,1fr)'), 'Phase 2 navigation must use the full-height three-tier hierarchy.');
assert.ok(css.includes('body.ui-v18 .main-nav button.phase2-play{grid-column:1/3'), 'PLAY must span the entire top row.');
assert.equal(css.includes('pointer-events:none'), false, 'Phase 2 stylesheet must not block UI mouse input.');
assert.equal(css.includes('pointer-events: none'), false, 'Phase 2 stylesheet must not block UI mouse input.');

for (const token of ['weaponModelSvg', 'statBarsHtml', 'spreadVisualHtml']) {
  assert.ok(menu.includes(token), `Weapon Info must use ${token}.`);
  assert.ok(loadouts.includes(token), `Loadouts must use ${token}.`);
}
for (const id of ['assault-rifle', 'smg', 'sniper', 'shotgun', 'lmg', 'pistol', 'launcher', 'melee']) {
  assert.ok(presentation.includes(id), `Missing authored weapon model for ${id}.`);
}

for (const token of [
  'damage: 20, critChance: 0.02, critDamage: 32',
  'damage: 145, critChance: 0.35, critDamage: 200',
  'damage: 125, critChance: 0, critDamage: 125'
]) assert.ok(weapons.includes(token), `Canonical weapon contract changed: ${token}`);
for (const token of ['PLAYER_SPEED_TILES = 5', 'SPRINT_SPEED_MULTIPLIER = 1.35', 'DASH_CHARGES_MAX = 4', 'DASH_DISTANCE_TILES = 3']) {
  assert.ok(constants.includes(token), `Canonical movement contract changed: ${token}`);
}
for (const token of ['const ROUND_DURATION = 90;', 'const ROUND_KILL_TARGET = 12;', 'const ROUND_WINS_TO_MATCH = 5;']) {
  assert.ok(match.includes(token), `Canonical match contract changed: ${token}`);
}

console.log('1.94.1 Phase 2 checks passed: full-screen hierarchy, working delegated controls, weapon presentation, and unchanged gameplay contracts.');
