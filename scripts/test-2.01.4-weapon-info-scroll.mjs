import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const runtime = readFileSync(new URL('../game/src/phase2014-runtime.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../game/src/ui-2.01.4.css', import.meta.url), 'utf8');
const loader = readFileSync(new URL('../game/src/debug-tuning.js', import.meta.url), 'utf8');
const weapons = readFileSync(new URL('../game/src/data/weapons.js', import.meta.url), 'utf8');
const constants = readFileSync(new URL('../game/src/engine/constants.js', import.meta.url), 'utf8');
const match = readFileSync(new URL('../game/src/match/MatchManager.js', import.meta.url), 'utf8');

assert.match(loader, /phase2014-runtime\.js/, '2.01.4 runtime must load');
assert.match(runtime, /ui-2\.01\.4\.css/, '2.01.4 stylesheet must load');
assert.match(runtime, /ui-2014/, '2.01.4 body class must be applied');

assert.match(css, /weapon-info-open \.main-content/, 'Weapon Info must own a dedicated scroll container');
assert.match(css, /height:100%!important/, 'Weapon Info main-content must be constrained to the menu shell');
assert.match(css, /overflow-y:auto!important/, 'Weapon Info must be vertically scrollable');
assert.match(css, /overflow-x:hidden!important/, 'Weapon Info must not gain horizontal scrolling');
assert.match(css, /loadout-screen:not\(\.hidden\)/, 'Loadouts one-page rules must remain scoped');
assert.match(css, /loadout-shell-v16/, 'Loadouts shell must remain no-scroll');

for (const forbidden of [
  "../data/weapons.js",
  "../actors/Player.js",
  "../ai/BotController.js",
  "../match/MatchManager.js",
  "../world/SpawnSystem.js",
  "../world/map01.js"
]) {
  assert.ok(!runtime.includes(forbidden), `2.01.4 runtime must not import gameplay system ${forbidden}`);
}

// Canonical gameplay contracts must still be present.
assert.match(weapons, /damage:\s*20/, 'AR damage contract changed unexpectedly');
assert.match(constants, /PLAYER_SPEED_TILES\s*=\s*5/, 'Player speed contract changed unexpectedly');
assert.match(match, /90/, 'Round timer contract must remain present');
assert.match(match, /12/, 'Round kill target contract must remain present');

console.log('2.01.4 Weapon Info scroll regression passed.');
