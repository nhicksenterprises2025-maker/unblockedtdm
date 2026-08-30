import assert from 'node:assert/strict';
import fs from 'node:fs';
import { BotController } from '../game/src/ai/BotController.js';
import { GridPathfinder } from '../game/src/ai/GridPathfinder.js';
import { ARENA_EMBLEM_IDS, arenaBadgeMarkup } from '../game/src/arena/ArenaBadges.js';
import { ARENA_RANKS, ArenaStore } from '../game/src/arena/ArenaStore.js';
import { refreshTeamWipeLatch, resolveTeamWipe } from '../game/src/arena/ArenaTelemetry.js';
import { LoadoutStore } from '../game/src/data/LoadoutStore.js';
import { WEAPONS, WEAPON_LIST } from '../game/src/data/weapons.js';
import { TILE_SIZE } from '../game/src/engine/constants.js';
import { GameSettings } from '../game/src/engine/GameSettings.js';
import { CAREER_RANKS, ProgressionStore } from '../game/src/progression/ProgressionStore.js';
import { rankBadgeMarkup } from '../game/src/progression/RankBadges.js';
import { TileMap } from '../game/src/world/TileMap.js';
import { MAP_01 } from '../game/src/world/map01.js';
import { MAP_02 } from '../game/src/world/map02.js';

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

const read = (relative) => fs.readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8');

// Arena and Career are separate products backed by separate persistence keys.
const sharedStorage = new MemoryStorage();
let now = new Date(2026, 7, 28, 12, 0, 0);
const arenaStore = new ArenaStore({ storage:sharedStorage, now:() => now });
const careerStore = new ProgressionStore(sharedStorage);
arenaStore.recordMatch({
  matchId:'phase3-isolation-arena', won:true, kills:12, deaths:4, assists:3,
  criticalKills:1, roundWins:5, roundLosses:2, bestStreak:5, mvp:true, playSeconds:780
});
assert.equal(careerStore.snapshot().totalXp, 0, 'Arena play must never award permanent Career XP through shared storage.');
const arenaAp = arenaStore.snapshot().ap;
careerStore.recordMatch({
  won:true,
  local:{ team:'blue', kills:8, deaths:5, assists:2, damage:900, criticals:1, bestStreak:4 },
  roundHistory:[{ winner:'blue' }, { winner:'red' }, { winner:'blue' }],
  duration:720,
  durationLabel:'12:00'
});
assert.equal(arenaStore.snapshot().ap, arenaAp, 'Career play must never mutate Arena AP.');

// Team wipes are a simultaneous team-state transition, not three remembered local kills.
let wipeLatched = refreshTeamWipeLatch(false, 3);
let wipe = resolveTeamWipe({ latched:wipeLatched, attackerTeam:'blue', localTeam:'blue', opponentsAliveAfter:0 });
assert.equal(wipe.awarded, true, 'The local team must receive one team-wipe event when all opponents become dead.');
wipe = resolveTeamWipe({ latched:wipe.latched, attackerTeam:'blue', localTeam:'blue', opponentsAliveAfter:0 });
assert.equal(wipe.awarded, false, 'A dead team must not generate repeated team-wipe awards.');
wipeLatched = refreshTeamWipeLatch(wipe.latched, 1);
assert.equal(wipeLatched, true, 'A staggered single respawn must not reopen a full-team wipe award.');
wipeLatched = refreshTeamWipeLatch(wipeLatched, 3);
assert.equal(wipeLatched, false, 'The latch may reopen once all three opponents are alive again.');
assert.equal(resolveTeamWipe({ latched:false, attackerTeam:'red', localTeam:'blue', opponentsAliveAfter:0 }).awarded, false);

// Every Arena threshold has a distinct inline competitive emblem. Career remains
// a separately authored external sprite set with all 26 permanent ranks present.
assert.equal(ARENA_RANKS.length, 14);
assert.equal(ARENA_EMBLEM_IDS.length, 14);
assert.deepEqual([...ARENA_EMBLEM_IDS].sort(), ARENA_RANKS.map((rank) => rank.id).sort());
const arenaBadges = ARENA_RANKS.map((rank) => arenaBadgeMarkup(rank));
assert.equal(new Set(arenaBadges).size, 14);
for (const [index, badge] of arenaBadges.entries()) {
  assert.ok(badge.includes('data-arena-emblem="authored"'));
  assert.ok(badge.includes(`data-arena-index="${index}"`));
  assert.ok(!badge.includes('rank-badges.svg'), 'Arena must not masquerade as the permanent Career sprite set.');
}
assert.ok(arenaBadges.at(-1).includes('arena-rank-apex'));
assert.ok(arenaBadges.at(-1).includes('circle cx="48" cy="58" r="18"'));

const careerSprite = read('game/src/assets/ranks/rank-badges.svg');
assert.equal(CAREER_RANKS.length, 26);
for (const rank of CAREER_RANKS) {
  assert.ok(careerSprite.includes(`id="rank-${rank.id}"`), `Career emblem sprite is missing ${rank.id}.`);
  const badge = rankBadgeMarkup(rank);
  assert.ok(badge.includes('career-rank-badge'));
  assert.ok(badge.includes(`rank-badges.svg#rank-${rank.id}`));
  assert.ok(!badge.includes('data-arena-emblem'));
}

// The shared weapon renderer/UI roster is complete and gameplay balance stayed exact.
assert.deepEqual(WEAPON_LIST.map((weapon) => weapon.id), [
  'assault-rifle', 'smg', 'sniper', 'shotgun', 'lmg', 'pistol', 'launcher', 'melee'
]);
assert.deepEqual(WEAPON_LIST.map((weapon) => [
  weapon.id, weapon.kind, weapon.damage, weapon.critChance, weapon.critDamage,
  weapon.fireInterval, weapon.magazineSize, weapon.reloadTime, weapon.movementMultiplier
]), [
  ['assault-rifle','hitscan',20,.02,32,.22,36,2.7,.8],
  ['smg','hitscan',9,.018,20,.11,44,2.2,1],
  ['sniper','projectile',148,.35,200,1.3,6,3.2,.6],
  ['shotgun','shotgun',16,.007,21,.8,6,1,.8],
  ['lmg','hitscan',24,.025,56,.36,75,4.3,.6],
  ['pistol','hitscan',15,.05,30,1 / 7,10,1.7,1],
  ['launcher','projectile',125,0,125,2.5,1,2.5,.6],
  ['melee','melee',75,.1,150,.9,0,0,1.05]
]);

// Loadouts and settings still persist after the Phase 3 presentation changes.
const loadoutStorage = new MemoryStorage();
const loadouts = new LoadoutStore(loadoutStorage);
loadouts.save(3, { name:'Phase 3 Precision', primary:WEAPONS.sniper, secondary:WEAPONS.launcher });
const restoredLoadouts = new LoadoutStore(loadoutStorage);
assert.equal(restoredLoadouts.get(3).name, 'Phase 3 Precision');
assert.equal(restoredLoadouts.get(3).primary.id, 'sniper');
assert.equal(restoredLoadouts.get(3).secondary.id, 'launcher');

const settingsStorage = new MemoryStorage();
const settings = new GameSettings(settingsStorage);
settings.setGameplay('sensitivity', 1.65);
settings.setGameplay('minimapMode', 'rotate');
settings.setBinding('map', 'KeyG');
const restoredSettings = new GameSettings(settingsStorage);
assert.equal(restoredSettings.gameplay().sensitivity, 1.65);
assert.equal(restoredSettings.gameplay().minimapMode, 'rotate');
assert.equal(restoredSettings.binding('map'), 'KeyG');

// Foundry preserves six safe spawns, symmetry, and a route from every spawn to
// all three strategic lanes in both directions. Casual remains Training Complex.
assert.equal(MAP_01.id, 'training-complex');
assert.equal(MAP_02.id, 'foundry-zero');
assert.equal(MAP_02.mode, 'arena');
assert.equal(MAP_02.arenaOnly, true);
const liveMap = new TileMap(MAP_02);
const pathfinder = new GridPathfinder(liveMap, 18, 4);
const anchors = [
  { x:16 * TILE_SIZE, y:6.5 * TILE_SIZE },
  { x:16 * TILE_SIZE, y:11 * TILE_SIZE },
  { x:16 * TILE_SIZE, y:15.5 * TILE_SIZE }
];
for (const [team, spawns] of Object.entries(MAP_02.spawns)) {
  assert.equal(spawns.length, 3);
  for (const [spawnIndex, spawn] of spawns.entries()) {
    assert.ok(pathfinder.isWorldWalkable(spawn.x, spawn.y), `${team} spawn ${spawnIndex} must be collision safe.`);
    for (const [anchorIndex, anchor] of anchors.entries()) {
      assert.ok(pathfinder.findPath(spawn, anchor).length > 0, `${team} spawn ${spawnIndex} cannot reach lane ${anchorIndex}.`);
      assert.ok(pathfinder.findPath(anchor, spawn).length > 0, `Lane ${anchorIndex} cannot return to ${team} spawn ${spawnIndex}.`);
    }
  }
}
for (let index = 0; index < MAP_02.spawns.blue.length; index += 1) {
  const blue = MAP_02.spawns.blue[index];
  const red = MAP_02.spawns.red[index];
  assert.equal(blue.x + red.x, MAP_02.cols * MAP_02.tileSize, 'Paired spawns must remain exactly X-symmetric.');
  assert.equal(blue.y, red.y, 'Paired spawns must remain exactly Y-aligned.');
}

// A cached Casual route must be invalidated on the first bot tick after the
// shared TileMap switches to Arena, before any cached-path early return.
const switchingMap = new TileMap(MAP_01);
const switchingPathfinder = new GridPathfinder(switchingMap, 18, 4);
const player = { x:MAP_01.spawns.blue[0].x, y:MAP_01.spawns.blue[0].y, health:{ alive:false } };
const bot = new BotController(player, {}, 7, 'Average');
bot.path = [{ x:9999, y:9999 }];
bot.debugPath = [{ x:9999, y:9999 }];
bot.pathGoal = { x:9999, y:9999 };
bot.pathMapRevision = switchingPathfinder.mapRevision;
switchingMap.setDefinition(MAP_02);
bot.update(.016, { map:switchingMap, pathfinder:switchingPathfinder });
assert.deepEqual(bot.path, []);
assert.deepEqual(bot.debugPath, []);
assert.equal(bot.pathGoal, null);
assert.equal(bot.pathMapRevision, switchingMap.revision);

const runtime = read('game/src/phase2433-runtime.js');
const parentRuntime = read('game/src/phase241-runtime.js');
const arenaRuntime = read('game/src/phase2431-runtime.js');
const mapRuntime = read('game/src/phase2432-runtime.js');
const css = read('game/src/ui-2.4.3.3.css');
const main = read('game/src/main.js');
const index = read('game/src/index.html');
const postgame = read('game/src/ui/PostgameScreen.js');
const workflow = read('.github/workflows/publish-windows.yml');

assert.ok(parentRuntime.indexOf("import './phase2433-runtime.js';") > parentRuntime.indexOf("import './phase2432-runtime.js';"));
assert.ok(parentRuntime.includes("ensureStyle('ui-2.4.3.3.css')"));
for (const token of [
  "document.body.dataset.arenaPhase3Ready = 'true'",
  'arenaEmblems:ARENA_EMBLEM_IDS.length === 14',
  'careerEmblems:CAREER_RANKS.length === 26',
  'weapons:WEAPON_LIST.length === 8',
  'foundryPresentation',
  "pulse('match-intro'",
  "pulse('round-transition'",
  "pulse('critical-elimination'",
  "pulse('mvp'"
]) assert.ok(runtime.includes(token), `Phase 3 runtime is missing ${token}.`);
for (const token of ['resetModeState', 'teamWipeLatched', 'cancelArenaRankChange', 'data-rank="${safe(rank.id)}"']) {
  assert.ok(arenaRuntime.includes(token), `Arena integration is missing ${token}.`);
}
assert.ok(mapRuntime.includes('function definitionForMode(mode = selectedMode())'));
assert.ok(mapRuntime.includes("mode === 'arena' ? MAP_02 : MAP_01"));
assert.ok(mapRuntime.includes('debugLabel.textContent = map.name'));
assert.ok(mapRuntime.includes('small.textContent !== label'));
for (const token of ['arenaPhase3', 'phase3Integrity', 'foundryPresentation']) {
  assert.ok(main.includes(token), `Packaged smoke probe is missing ${token}.`);
}
assert.ok(workflow.includes('git diff-tree --no-commit-id --name-only -r -m HEAD'));
assert.ok(css.includes('.arena-strip') && css.includes('.career-strip:not(.arena-strip)'));
assert.ok(css.includes(':focus-visible') && css.includes('@media(prefers-reduced-motion:reduce)'));
for (const className of ['phase2433-match-intro', 'phase2433-round-transition', 'phase2433-critical-elimination', 'phase2433-mvp']) {
  assert.ok(css.includes(className), `Phase 3 stylesheet is missing ${className}.`);
}
assert.ok(!index.includes('UNBLOCKEDTDM'));
assert.ok(!postgame.includes('UNBLOCKEDTDM'));
assert.ok(!runtime.includes('UNBLOCKEDTDM'));
assert.equal(/unblockedtdm/i.test(`${index}\n${postgame}`), false, 'Visible shell and postgame copy must use Skirmish Arena branding.');
const phase3UiText = `${index}\n${postgame}\n${runtime}\n${css}`;
assert.equal(/[\u3040-\u30ff\u3400-\u9fff]/u.test(phase3UiText), false, 'Phase 3 UI must not contain Japanese or CJK lettering.');
assert.equal(/\p{Extended_Pictographic}/u.test(phase3UiText), false, 'Phase 3 UI must not contain emoji glyphs.');

console.log('Skirmish Arena 2.4.3.3 Phase 3 integration checks passed: isolated progression, correct team wipes, complete emblem systems, exact eight-weapon balance, persisted loadouts/settings, six symmetric spawns, three-lane navigation, map-switch bot invalidation, packaged integrity and restrained UI contracts.');
