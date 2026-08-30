import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const debug = read('game/src/debug-tuning.js');
const runtime = read('game/src/phase6-runtime.js');
const css = read('game/src/ui-phase6.css');
const flow = read('game/src/flow-v18.js');
const menu = read('game/src/ui/MainMenu.js');
const weapons = read('game/src/data/weapons.js');
const constants = read('game/src/engine/constants.js');
const match = read('game/src/match/MatchManager.js');

assert.ok(debug.includes("import('./phase6-runtime.js')"));
assert.ok(runtime.includes("ensureStyle('ui-phase6.css')"));
assert.ok(runtime.includes("document.body.classList.add('ui-phase6')"));
assert.ok(runtime.includes("const order = ['play', 'loadouts', 'weapon-info', 'settings', 'quit'];"));
assert.ok(runtime.includes("removeAttribute('data-phase6-index')"), 'Retired Home tile counters must be actively removed from upgraded profiles.');
assert.ok(runtime.includes("setAttribute('aria-posinset'"));
assert.ok(runtime.includes("setAttribute('aria-setsize'"));
assert.equal(css.includes('content:attr(data-phase6-index)'), false, 'Home tiles must not render the retired 01–05 counters.');
for (const token of ['--p6-sidebar','grid-template-columns:var(--p6-sidebar) minmax(0,1fr)!important','grid-template-rows:minmax(170px,1.32fr) minmax(140px,1fr) minmax(140px,1fr)!important','grid-column:1/3!important','max-width:calc(100% - 78px)','white-space:nowrap!important','[data-phase6-home]','justify-content:center','.menu-feature-grid']) assert.ok(css.includes(token), `Phase 6 fullscreen menu contract missing ${token}.`);
for (const selector of ['.phase2-loadouts','.phase2-settings','.phase2-quit','.phase2-weapon-info','.phase2-play']) assert.ok(css.includes(selector), `Phase 6 missing authored sizing for ${selector}.`);
assert.equal(css.includes('pointer-events:none'), false);
assert.equal(css.includes('pointer-events: none'), false);
assert.ok(flow.includes("const order = ['play', 'loadouts', 'weapon-info', 'settings', 'quit'];"));
assert.ok(flow.includes("button.classList.add('phase2-nav-button', `phase2-${action}`)"));
assert.ok(menu.includes("this.root.addEventListener('click'"));
for (const forbidden of ["from './data/weapons.js'","from './engine/constants.js'","from './match/MatchManager.js'","from './ai/BotController.js'","from './world/TileMap.js'"]) assert.equal(runtime.includes(forbidden), false, `Phase 6 UI runtime must not import gameplay system ${forbidden}.`);
for (const id of ['assault-rifle','smg','sniper','shotgun','lmg','pistol','launcher','melee']) assert.ok(weapons.includes(`id: '${id}'`), `Weapon roster missing ${id}.`);
for (const field of ['damage:', 'critChance:', 'fireInterval:', 'magazineSize:']) assert.ok(weapons.includes(field), `Weapon data schema missing ${field}`);
for (const token of ['PLAYER_SPEED_TILES = 5','SPRINT_SPEED_MULTIPLIER = 1.35','DASH_CHARGES_MAX = 4','DASH_DISTANCE_TILES = 3']) assert.ok(constants.includes(token), `Canonical movement contract changed: ${token}`);
for (const token of ['const ROUND_DURATION = 90;','const ROUND_KILL_TARGET = 12;','const ROUND_WINS_TO_MATCH = 5;']) assert.ok(match.includes(token), `Canonical match contract changed: ${token}`);

console.log('Phase 6 checks passed: fullscreen menu proportions, unclipped navigation labels, preserved controller, and balance-ready weapon schema.');
