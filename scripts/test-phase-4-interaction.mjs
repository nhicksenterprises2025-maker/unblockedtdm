import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const gameMain = read('game/src/main.js');
const settings = read('game/src/engine/GameSettings.js');
const debug = read('game/src/debug-tuning.js');
const runtime = read('game/src/phase4-runtime.js');
const audio = read('game/src/audio/AudioSystem.js');
const css = read('game/src/ui-phase4.css');
const phase3 = read('game/src/phase3-runtime.js');
const weapons = read('game/src/data/weapons.js');
const constants = read('game/src/engine/constants.js');
const match = read('game/src/match/MatchManager.js');

assert.ok(gameMain.includes('fullscreen: true'), 'Phase 4 must launch fullscreen-first.');
assert.ok(gameMain.includes('window.setFullScreen(!window.isFullScreen())'), 'F11/settings fullscreen toggle must remain available.');
for (const token of ['autoSprint: true', 'audioEnabled: true', 'masterVolume: 0.75']) assert.ok(settings.includes(token), `Phase 4 settings default missing ${token}.`);
assert.ok(runtime.includes('settings.gameplay().autoSprint'));
assert.ok(runtime.includes('automaticInput.sprintHeld = () => true'));
assert.ok(runtime.includes('data-phase4-setting="autoSprint"'));
assert.ok(runtime.includes('data-phase4-setting="audioEnabled"'));
assert.ok(runtime.includes('data-phase4-setting="masterVolume"'));
assert.ok(debug.includes("import('./flow-v18.js')"));
assert.ok(debug.includes("import('./phase4-runtime.js')"));

for (const id of ['assault-rifle','smg','sniper','shotgun','lmg','pistol','launcher','melee']) {
  assert.ok(audio.includes(`${id}:`) || audio.includes(`'${id}':`), `Missing Phase 4 weapon audio profile for ${id}.`);
  assert.ok(weapons.includes(`id: '${id}'`), `Weapon roster missing ${id}.`);
}
for (const token of ['createDynamicsCompressor','createStereoPanner','playDry','playReloadStart','playReloadFinish','playShell','playSwap','playFootstep','playExplosion','playUi']) assert.ok(audio.includes(token), `Phase 4 audio engine missing ${token}.`);
for (const token of ['WeaponManager.prototype.tryFire','WeaponManager.prototype.startReload','WeaponManager.prototype.insertShell','WeaponManager.prototype.requestSwitch','ProjectileSystem.prototype.explode','audio.updateFootsteps']) assert.ok(runtime.includes(token), `Phase 4 runtime missing live audio hook ${token}.`);

assert.ok(css.includes('width:100vw;height:100vh'));
assert.ok(css.includes('.loadout-shell'));
assert.ok(css.includes('.pause-shell'));
assert.ok(css.includes('.phase3-scoreboard-shell'));
assert.equal(css.includes('pointer-events:none'), false);
assert.ok(phase3.includes('TacticalHUD'));

for (const field of ['damage:', 'critChance:', 'critDamage:', 'fireInterval:', 'magazineSize:', 'reloadTime:']) assert.ok(weapons.includes(field), `Weapon data schema missing ${field}`);
for (const token of ['PLAYER_SPEED_TILES = 5','SPRINT_SPEED_MULTIPLIER = 1.35','DASH_CHARGES_MAX = 4','DASH_DISTANCE_TILES = 3']) assert.ok(constants.includes(token), `Canonical movement contract changed: ${token}`);
for (const token of ['const ROUND_DURATION = 90;','const ROUND_KILL_TARGET = 12;','const ROUND_WINS_TO_MATCH = 5;']) assert.ok(match.includes(token), `Canonical match contract changed: ${token}`);

console.log('Phase 4 checks passed: fullscreen-first UI, Auto Sprint, procedural audio, responsive scaling, preserved Phase 3, and balance-ready weapon schema.');
