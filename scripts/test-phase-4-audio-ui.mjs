import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const settings = read('game/src/engine/GameSettings.js');
const player = read('game/src/actors/Player.js');
const audio = read('game/src/audio/AudioSystem.js');
const runtime = read('game/src/phase4-runtime.js');
const main = read('game/src/main.js');
const tuning = read('game/src/debug-tuning.js');

for (const token of ['autoSprint: true', 'audioEnabled: true', 'masterVolume: 0.75']) assert.ok(settings.includes(token), `Phase 4 setting missing ${token}`);
assert.ok(player.includes('(autoSprint || input.sprintHeld())'), 'Auto Sprint must preserve manual sprint while becoming default-on.');
assert.ok(player.includes('SPRINT_DRAIN_PER_SECOND') && player.includes('SPRINT_SPEED_MULTIPLIER'), 'Existing sprint balance constants must remain in use.');
assert.ok(main.includes('fullscreen: true'), 'Game must launch fullscreen-first.');
assert.ok(main.includes('minWidth: 1280') && main.includes('minHeight: 720'), 'Fullscreen UI baseline sizing must support 720p+ layouts.');
for (const weapon of ["'assault-rifle'", 'smg:', 'sniper:', 'shotgun:', 'lmg:', 'pistol:', 'launcher:', 'melee:']) assert.ok(audio.includes(weapon), `Audio profile missing ${weapon}`);
for (const method of ['dryFire()', 'swap()', 'reload(shell = false)', 'footstep(sprint = false)', "ui(kind = 'click')", 'explosion(']) assert.ok(audio.includes(method), `Audio system missing ${method}`);
for (const token of ['phase4-auto-sprint', 'phase4-audio-toggle', 'phase4-master-volume', 'patchCombatAudio', 'pointerover']) assert.ok(runtime.includes(token), `Phase 4 runtime missing ${token}`);
assert.ok(tuning.includes("import('./phase4-runtime.js')"), 'Phase 4 must load through normal startup.');
console.log('Phase 4 checks passed: fullscreen-first, default Auto Sprint, category weapon audio, movement/combat/UI audio and user controls are present.');
