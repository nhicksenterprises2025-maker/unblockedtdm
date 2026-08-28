import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { packageSemverFor } from './versioning.mjs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const tactical = read('game/src/ui/TacticalHUD.js');
const css = read('game/src/ui-2.4.1.2.css');
const phase241 = read('game/src/phase241-runtime.js');
const constants = read('game/src/engine/constants.js');
const weapons = read('game/src/data/weapons.js');
const syncBuild = read('scripts/sync-build-info.mjs');

for (const token of [
  'phase3BlueScoreRows',
  'phase3RedScoreRows',
  'phase3-team-scoreboards',
  'phase3-team-board blue',
  'phase3-team-board red',
  "stats.filter((row) => row.team === 'blue')",
  "stats.filter((row) => row.team === 'red')",
  'renderTeamRows(blueRows',
  'renderTeamRows(redRows'
]) {
  assert.ok(tactical.includes(token), `2.4.1.2 split-team scoreboard missing: ${token}`);
}
assert.ok(!tactical.includes('id="phase3ScoreRows"'), 'Mixed all-player scoreboard table must not return.');
assert.ok(tactical.includes('phase3TopThree'), 'Global Top 3 / MVP strip must remain above separated teams.');

assert.ok(css.includes('#roundLabel'), 'Round counter scale override missing.');
assert.ok(css.includes('font-size:8.5px!important'), 'Round counter should be slightly larger.');
assert.ok(css.includes('#roundTimer'), 'Round timer scale override missing.');
assert.ok(css.includes('font-size:24px!important'), 'Round timer should be larger without becoming oversized.');
assert.ok(css.includes('grid-template-columns:repeat(2,minmax(0,1fr))'), 'Desktop scoreboard must show Blue and Red side by side.');
assert.ok(css.includes('.phase3-team-board.blue') && css.includes('.phase3-team-board.red'), 'Both team scoreboard treatments must exist.');

assert.ok(phase241.includes("ensureStyle('ui-2.4.1.2.css')"), '2.4.1.2 stylesheet must load through the deterministic runtime.');
assert.ok(phase241.includes("'ui-241'") && phase241.includes("'ui-2412'"), '2.4.1.2 body scopes must remain active through later additive updates.');
assert.ok(constants.includes('DASH_STAMINA_COST = 0'), 'Dash stamina independence from 2.3.4 must remain intact.');
assert.ok(weapons.includes('fireInterval: 0.22') && weapons.includes('damage: 148'), '2.4.1 player-authored balance values must remain intact.');

assert.equal(packageSemverFor('2.4.1.2'), '2.4.1-2', 'Four-part public hotfix version must map to valid Electron SemVer.');
assert.equal(packageSemverFor('2.4.1'), '2.4.1', 'Normal three-part SemVer must remain unchanged.');
assert.equal(packageSemverFor('3.1.0.12'), '3.1.0-12', 'Future numeric four-part hotfix versions must remain package-safe.');
assert.ok(syncBuild.includes('packageSemverFor(plan.gameVersion)'), 'Build sync must never write a four-part display version directly into package.json.');

console.log('Skirmish Arena 2.4.1.2 checks passed: larger round/timer readout, separated Blue/Red scoreboard, Top 3 preservation, package-safe hotfix versioning, and 2.4.1 gameplay compatibility.');
