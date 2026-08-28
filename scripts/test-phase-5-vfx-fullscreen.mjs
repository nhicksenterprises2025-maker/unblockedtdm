import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const debug = read('game/src/debug-tuning.js');
const runtime = read('game/src/phase5-runtime.js');
const css = read('game/src/ui-phase5.css');
const weapons = read('game/src/data/weapons.js');
const constants = read('game/src/engine/constants.js');
const match = read('game/src/match/MatchManager.js');
const renderer = read('game/src/renderer.js');

assert.ok(debug.includes("import('./phase5-runtime.js')"));
assert.ok(runtime.includes("ensureStyle('ui-phase5.css')"));
assert.ok(runtime.includes("document.body.classList.add('ui-phase5')"));
for (const token of ['--p5-safe-x','--p5-safe-y','grid-template-columns:var(--p5-sidebar) minmax(0,1fr)!important','.loadout-shell','.pause-shell','.postgame-shell','.phase3-scoreboard-shell','.round-loadout-panel']) assert.ok(css.includes(token), `Phase 5 fullscreen reflow missing ${token}.`);
for (const [name, pattern] of [
  ['dash HUD', /\.dash-hud\s*\{[^}]*left\s*:\s*auto!important;[^}]*right\s*:\s*var\(--p5-safe-x\)!important;/s],
  ['weapon HUD', /\.weapon-hud\s*\{[^}]*left\s*:\s*auto!important;[^}]*right\s*:\s*var\(--p5-safe-x\)!important;/s],
  ['health HUD', /\.health-hud\s*\{[^}]*left\s*:\s*var\(--p5-safe-x\)!important;[^}]*right\s*:\s*auto!important;/s],
  ['stamina HUD', /\.stamina-hud\s*\{[^}]*left\s*:\s*var\(--p5-safe-x\)!important;[^}]*right\s*:\s*auto!important;/s],
  ['minimap', /\.minimap-shell\s*\{[^}]*left\s*:\s*var\(--p5-safe-x\)!important;[^}]*right\s*:\s*auto!important;/s]
]) assert.match(css, pattern, `Phase 5 must reset conflicting fullscreen anchor for ${name}.`);
assert.equal(css.includes('pointer-events:none'), false);
for (const token of ['CombatFeedbackRenderer','DamageFeedbackRenderer','WeaponRenderer','shockwaves','blastCores','impactBursts','muzzleBursts','__phase5Remnants','globalCompositeOperation = \'lighter\'','createRadialGradient']) assert.ok(runtime.includes(token), `Phase 5 VFX runtime missing ${token}.`);
for (const forbidden of ["from './data/weapons.js'","from './engine/constants.js'","from './match/MatchManager.js'","from './ai/BotController.js'","from './world/TileMap.js'"]) assert.equal(runtime.includes(forbidden), false, `Phase 5 VFX runtime must not import gameplay system ${forbidden}.`);
assert.ok(renderer.includes('new CombatFeedbackRenderer(ctx)'));
assert.ok(renderer.includes('new DamageFeedbackRenderer(ctx)'));
assert.ok(renderer.includes('new WeaponRenderer(ctx)'));
for (const id of ['assault-rifle','smg','sniper','shotgun','lmg','pistol','launcher','melee']) assert.ok(weapons.includes(`id: '${id}'`), `Weapon roster missing ${id}.`);
for (const field of ['damage:', 'fireInterval:', 'magazineSize:', 'reloadTime:']) assert.ok(weapons.includes(field), `Weapon data schema missing ${field}`);
for (const token of ['PLAYER_SPEED_TILES = 5','SPRINT_SPEED_MULTIPLIER = 1.35','DASH_CHARGES_MAX = 4','DASH_DISTANCE_TILES = 3']) assert.ok(constants.includes(token), `Canonical movement contract changed: ${token}`);
for (const token of ['const ROUND_DURATION = 90;','const ROUND_KILL_TARGET = 12;','const ROUND_WINS_TO_MATCH = 5;']) assert.ok(match.includes(token), `Canonical match contract changed: ${token}`);

console.log('Phase 5 checks passed: true fullscreen safe-zone reflow, isolated renderer VFX, preserved UI, and balance-ready weapon schema.');
