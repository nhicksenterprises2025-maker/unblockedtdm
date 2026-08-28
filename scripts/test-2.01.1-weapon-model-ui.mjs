import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const presentation = read('game/src/ui/WeaponPresentation.js');
const runtime = read('game/src/phase2011-runtime.js');
const css = read('game/src/ui-2.01.1.css');
const debug = read('game/src/debug-tuning.js');
const renderer = read('game/src/render/WeaponRenderer.js');
const weapons = read('game/src/data/weapons.js');
const constants = read('game/src/engine/constants.js');
const match = read('game/src/match/MatchManager.js');

assert.ok(debug.includes("import('./phase2011-runtime.js')"));
assert.ok(presentation.includes("import { WeaponRenderer } from '../render/WeaponRenderer.js';"));
assert.ok(presentation.includes('data-game-weapon-model'));
assert.ok(presentation.includes('renderer[method](ctx, state, 0)'));
assert.equal(presentation.includes('legacyWeaponModelSvg'), false);
assert.equal(presentation.includes('function modelShape'), false);
assert.equal(presentation.includes('<svg class="phase2-weapon-svg'), false);
for (const method of ['drawAR','drawSMG','drawSniper','drawShotgun','drawLMG','drawPistol','drawLauncher','drawMelee']) {
  assert.ok(presentation.includes(`'${method}'`) || presentation.includes(`: '${method}'`), `2.01.1 preview mapping missing ${method}.`);
  assert.ok(renderer.includes(`${method}(ctx`), `Gameplay renderer missing ${method}.`);
}
for (const token of ['enhanceWeaponInfoList','phase2011-list-model','enhanceRoundLoadoutSwitcher','phase2011-round-models','weaponModelSvg(slot.primary','weaponModelSvg(slot.secondary','hydrateWeaponModelCanvases']) assert.ok(runtime.includes(token), `2.01.1 UI runtime missing ${token}.`);
for (const token of ['.phase2011-weapon-canvas','.phase2011-list-canvas','#roundLoadoutGrid button','.phase2011-round-models','.phase2011-round-canvas']) assert.ok(css.includes(token), `2.01.1 presentation missing ${token}.`);
for (const id of ['assault-rifle','smg','sniper','shotgun','lmg','pistol','launcher','melee']) assert.ok(weapons.includes(`id: '${id}'`), `Weapon roster missing ${id}.`);
for (const field of ['damage:', 'critChance:', 'critDamage:', 'fireInterval:', 'magazineSize:', 'reloadTime:']) assert.ok(weapons.includes(field), `Weapon schema missing ${field}`);
for (const token of ['PLAYER_SPEED_TILES = 5','SPRINT_SPEED_MULTIPLIER = 1.35','DASH_CHARGES_MAX = 4','DASH_DISTANCE_TILES = 3']) assert.ok(constants.includes(token));
for (const token of ['const ROUND_DURATION = 90;','const ROUND_KILL_TARGET = 12;','const ROUND_WINS_TO_MATCH = 5;']) assert.ok(match.includes(token));

console.log('Skirmish Arena 2.01.1 checks passed: actual gameplay weapon models remain shared across UI and gameplay with a balance-ready weapon schema.');
