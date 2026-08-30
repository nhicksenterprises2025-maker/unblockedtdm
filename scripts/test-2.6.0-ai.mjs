import assert from 'node:assert/strict';
import { BotController, WEAPON_TACTICS, tacticForWeapon } from '../game/src/ai/BotController.js';
import { GridPathfinder } from '../game/src/ai/GridPathfinder.js';
import { WEAPONS, WEAPON_LIST } from '../game/src/data/weapons.js';
import { PLAYER_RADIUS_TILES, TILE_SIZE } from '../game/src/engine/constants.js';
import { circleIntersectsRect, moveCircle } from '../game/src/world/Collision.js';
import { TileMap } from '../game/src/world/TileMap.js';
import { MAP_01 } from '../game/src/world/map01.js';
import { MAP_02 } from '../game/src/world/map02.js';

let liveDifficulty = 'Average';
globalThis.localStorage = { getItem:() => liveDifficulty };

const PLAYER_RADIUS = PLAYER_RADIUS_TILES * TILE_SIZE;
const openDefinition = Object.freeze({
  id:'ai-open-range',
  cols:26,
  rows:18,
  tileSize:TILE_SIZE,
  structures:[],
  spawns:{ blue:[], red:[] }
});

function actor({ id, team, x, y, health = 150 }) {
  return {
    id,
    team,
    x,
    y,
    radius:PLAYER_RADIUS,
    aimAngle:team === 'red' ? Math.PI : 0,
    visualAimAngle:team === 'red' ? Math.PI : 0,
    stamina:100,
    dashCharges:4,
    sprinting:false,
    health:{ alive:true, health, maxHealth:150, timeSinceDamage:health < 100 ? .4 : 99 },
    speedTilesPerSecond:() => 0
  };
}

function manager(primary, secondary = null, { magazine = primary.magazineSize, reserve = primary.magazineSize * 3 } = {}) {
  return {
    loadout:{ primary, secondary },
    currentSlot:'primary',
    ammo:{
      primary:primary.magazineSize > 0 ? { magazine, reserve } : null,
      secondary:secondary?.magazineSize > 0
        ? { magazine:secondary.magazineSize, reserve:secondary.magazineSize * 3 }
        : null
    },
    currentWeapon() { return this.loadout[this.currentSlot]; },
    currentAmmo() { return this.ammo[this.currentSlot]; },
    isSwitching() { return false; },
    isReloading() { return false; }
  };
}

function assertRoute(pathfinder, start, goal, label) {
  const path = pathfinder.findPath(start, goal, {
    preferredClearance:TILE_SIZE * .5,
    clearanceWeight:.42
  });
  assert.ok(path.length > 0, `${label}: route must exist.`);
  let previous = start;
  for (const [index, waypoint] of path.entries()) {
    assert.equal(pathfinder.isWorldWalkable(waypoint.x, waypoint.y), true, `${label}: waypoint ${index} must have full bot clearance.`);
    assert.ok(pathfinder.wallClearanceAt(waypoint.x, waypoint.y) >= -0.001, `${label}: waypoint ${index} may not overlap padded geometry.`);
    assert.equal(pathfinder.segmentClear(previous, waypoint), true, `${label}: smoothed segment ${index} must anticipate corners.`);
    const distance = Math.hypot(waypoint.x - previous.x, waypoint.y - previous.y);
    const steps = Math.max(1, Math.ceil(distance / 5));
    for (let step = 1; step <= steps; step += 1) {
      const t = step / steps;
      const x = previous.x + (waypoint.x - previous.x) * t;
      const y = previous.y + (waypoint.y - previous.y) * t;
      assert.equal(pathfinder.isWorldWalkable(x, y), true, `${label}: traversal sample ${index}.${step} must remain clear.`);
    }
    previous = waypoint;
  }
  return path;
}

function challengingPoints(pathfinder) {
  const points = [];
  for (let row = 1; row < pathfinder.rows - 1; row += 1) {
    for (let col = 1; col < pathfinder.cols - 1; col += 1) {
      if (!pathfinder.isTileWalkable(col, row)) continue;
      const point = pathfinder.tileCenter(col, row);
      if (pathfinder.wallClearanceAt(point.x, point.y) >= TILE_SIZE * .08) points.push(point);
    }
  }
  const pairs = [];
  for (const from of points.filter((_, index) => index % Math.max(1, Math.floor(points.length / 12)) === 0)) {
    let farthest = null;
    let distance = -1;
    for (const to of points) {
      const next = Math.hypot(to.x - from.x, to.y - from.y);
      if (next > distance) { distance = next; farthest = to; }
    }
    if (farthest) pairs.push([from, farthest]);
  }
  return pairs.slice(0, 8);
}

function findWallProbe(pathfinder) {
  const padded = pathfinder.radius + pathfinder.clearance + 2;
  for (const rect of pathfinder.map.blockers) {
    const candidates = [
      [{ x:rect.x - padded, y:rect.y + rect.h / 2 }, { x:1, y:0 }],
      [{ x:rect.x + rect.w + padded, y:rect.y + rect.h / 2 }, { x:-1, y:0 }],
      [{ x:rect.x + rect.w / 2, y:rect.y - padded }, { x:0, y:1 }],
      [{ x:rect.x + rect.w / 2, y:rect.y + rect.h + padded }, { x:0, y:-1 }]
    ];
    for (const [origin, direction] of candidates) {
      const ahead = { x:origin.x + direction.x * TILE_SIZE * .65, y:origin.y + direction.y * TILE_SIZE * .65 };
      if (pathfinder.isWorldWalkable(origin.x, origin.y) && !pathfinder.segmentClear(origin, ahead)) return { origin, direction };
    }
  }
  return null;
}

// Repeated clearance-safe traversal across every spawn pairing and additional
// far-corner routes on both production maps.
let productionRouteCount = 0;
for (const definition of [MAP_01, MAP_02]) {
  const map = new TileMap(definition);
  const pathfinder = new GridPathfinder(map, PLAYER_RADIUS, 4);
  assert.equal(pathfinder.cols, definition.cols, `${definition.id}: pathfinder must use the live map width.`);
  assert.equal(pathfinder.rows, definition.rows, `${definition.id}: pathfinder must use the live map height.`);
  assert.equal(map.width, definition.cols * definition.tileSize, `${definition.id}: world bounds must match map metadata.`);
  for (const [blueIndex, blue] of definition.spawns.blue.entries()) {
    for (const [redIndex, red] of definition.spawns.red.entries()) {
      assertRoute(pathfinder, blue, red, `${definition.id} blue ${blueIndex} → red ${redIndex}`);
      assertRoute(pathfinder, red, blue, `${definition.id} red ${redIndex} → blue ${blueIndex}`);
      productionRouteCount += 2;
    }
  }
  for (const [index, [from, to]] of challengingPoints(pathfinder).entries()) {
    assertRoute(pathfinder, from, to, `${definition.id} difficult route ${index}`);
    productionRouteCount += 1;
  }

  const wallProbe = findWallProbe(pathfinder);
  assert.ok(wallProbe, `${definition.id}: test requires an ordinary wall approach.`);
  const steering = pathfinder.steeringProbe(wallProbe.origin, wallProbe.direction, {
    radius:PLAYER_RADIUS,
    lookAhead:TILE_SIZE * 1.4
  });
  assert.equal(steering.blocked, true, `${definition.id}: forward probe must flag the obstructed heading.`);
  if (Math.hypot(steering.direction.x, steering.direction.y) > .1) {
    const corrected = {
      x:wallProbe.origin.x + steering.direction.x * TILE_SIZE * .48,
      y:wallProbe.origin.y + steering.direction.y * TILE_SIZE * .48
    };
    assert.equal(pathfinder.segmentClear(wallProbe.origin, corrected), true, `${definition.id}: local correction must be collision-safe.`);
    assert.ok(
      steering.direction.x * wallProbe.direction.x + steering.direction.y * wallProbe.direction.y < .98,
      `${definition.id}: correction may not keep pushing directly into the wall.`
    );
  }
  assert.equal(
    pathfinder.canDash(wallProbe.origin, wallProbe.direction, 3 * TILE_SIZE, PLAYER_RADIUS),
    false,
    `${definition.id}: a dash probe must reject geometry in its full swept route.`
  );
}
assert.ok(productionRouteCount >= 45, 'The 2.6 navigation simulation must exercise a broad set of production routes.');

// Ordinary autonomous patrol should not hold movement into a collider on either
// map. Collision resolution remains a last line of defense, not the bot's plan.
for (const definition of [MAP_01, MAP_02]) {
  const map = new TileMap(definition);
  const pathfinder = new GridPathfinder(map, PLAYER_RADIUS, 4);
  for (let seed = 1; seed <= 3; seed += 1) {
    const spawn = definition.spawns.blue[(seed - 1) % definition.spawns.blue.length];
    const botActor = actor({ id:`${definition.id}-patrol-${seed}`, team:'blue', x:spawn.x, y:spawn.y });
    const bot = new BotController(botActor, manager(WEAPONS.assaultRifle), seed, 'Average');
    let blockedStreak = 0;
    let maxBlockedStreak = 0;
    for (let frame = 0; frame < 720; frame += 1) {
      const dt = 1 / 60;
      bot.update(dt, { camera:null, enemies:[], teammates:[], map, pathfinder, targetCounts:new Map() });
      const axis = bot.axis();
      const before = { x:botActor.x, y:botActor.y };
      moveCircle(botActor, axis.x * 5 * TILE_SIZE * dt, axis.y * 5 * TILE_SIZE * dt, map.blockers, { w:map.width, h:map.height });
      const requested = Math.hypot(axis.x, axis.y);
      const moved = Math.hypot(botActor.x - before.x, botActor.y - before.y);
      if (requested > .45 && moved < .2) blockedStreak += 1;
      else blockedStreak = 0;
      maxBlockedStreak = Math.max(maxBlockedStreak, blockedStreak);
      assert.equal(
        map.blockers.some((rect) => circleIntersectsRect(botActor.x, botActor.y, PLAYER_RADIUS, rect)),
        false,
        `${definition.id} patrol ${seed}: bot may never enter static geometry.`
      );
    }
    assert.ok(maxBlockedStreak <= 2, `${definition.id} patrol ${seed}: bot pushed into a wall for ${maxBlockedStreak} consecutive frames.`);
  }
}

const openMap = new TileMap(openDefinition);
const towardDot = (axis) => axis.x;

function tacticSample(weapon, distanceTiles, seed, options = {}) {
  liveDifficulty = options.difficulty || 'Average';
  const botActor = actor({ id:`bot-${weapon.id}-${seed}`, team:'blue', x:5 * TILE_SIZE, y:9 * TILE_SIZE, health:options.health ?? 150 });
  const enemy = actor({ id:`enemy-${weapon.id}-${seed}`, team:'red', x:(5 + distanceTiles) * TILE_SIZE, y:9 * TILE_SIZE, health:options.enemyHealth ?? 150 });
  const weaponManager = manager(weapon, options.secondary || null, options.ammo || {});
  const bot = new BotController(botActor, weaponManager, seed, liveDifficulty);
  bot.update(1 / 60, {
    camera:null,
    enemies:[enemy, ...(options.extraEnemies || [])],
    teammates:options.teammates || [],
    map:openMap,
    pathfinder:null,
    targetCounts:new Map()
  });
  return { bot, botActor, enemy, weaponManager, axis:bot.axis() };
}

assert.deepEqual(Object.keys(WEAPON_TACTICS).sort(), WEAPON_LIST.map((weapon) => weapon.id).sort(), 'All eight weapons require an authored tactical profile.');
for (const weapon of WEAPON_LIST) {
  const tactic = tacticForWeapon(weapon);
  assert.ok(tactic.min < tactic.ideal && tactic.ideal < tactic.fireMax, `${weapon.id}: tactical ranges must be ordered.`);
  for (const field of ['aggression', 'flank', 'cover', 'hold', 'laneRisk', 'dashClose', 'dashEscape']) {
    assert.ok(tactic[field] >= 0 && tactic[field] <= 1, `${weapon.id}: ${field} must be normalized.`);
  }
}

const tendency = Object.fromEntries(WEAPON_LIST.map((weapon) => {
  const samples = [];
  for (let seed = 1; seed <= 16; seed += 1) samples.push(towardDot(tacticSample(weapon, 9, seed).axis));
  return [weapon.id, samples.reduce((sum, value) => sum + value, 0) / samples.length];
}));
assert.ok(tendency.melee > tendency.sniper + .75, 'Melee must close a long gap far more aggressively than a sniper.');
assert.ok(tendency.shotgun > tendency.sniper + .65, 'Shotgun must close long gaps while sniper preserves range.');
assert.ok(tendency.smg > tendency.lmg + .45, 'SMG must rotate/advance more aggressively than LMG.');
assert.ok(tendency.pistol > tendency.sniper + .35, 'Pistol must remain more mobile than sniper.');
assert.ok(tacticSample(WEAPONS.sniper, 5, 2).axis.x < -.5, 'Sniper must retreat from CQC.');
assert.ok(tacticSample(WEAPONS.launcher, 3.5, 2).axis.x < -.5, 'Launcher must create blast-safe distance.');
assert.ok(tacticSample(WEAPONS.melee, 12, 2).axis.x > .6, 'Melee must commit to an approach at range.');

const openPathfinder = new GridPathfinder(openMap, PLAYER_RADIUS, 4);
const dashActor = actor({ id:'dash-smg', team:'blue', x:5 * TILE_SIZE, y:9 * TILE_SIZE });
const dashTarget = actor({ id:'dash-target', team:'red', x:17 * TILE_SIZE, y:9 * TILE_SIZE });
const dashBot = new BotController(dashActor, manager(WEAPONS.smg), 1, 'Average');
dashBot.dashThinkTimer = 0;
dashBot.update(1 / 60, { camera:null, enemies:[dashTarget], teammates:[], map:openMap, pathfinder:openPathfinder, targetCounts:new Map() });
assert.equal(dashBot.dashPressed(), true, 'An aggressive SMG bot should use an available dash when the full swept approach is clear.');
assert.equal(
  openPathfinder.canDash(dashActor, dashBot.axis(), 3 * TILE_SIZE, PLAYER_RADIUS),
  true,
  'Every requested approach dash must have a fully clear path and endpoint.'
);

// Weapon selection, reload and survivability are tactical decisions rather than
// aim multipliers.
const closeSniper = tacticSample(WEAPONS.sniper, 2.8, 4, { secondary:WEAPONS.shotgun });
assert.equal(closeSniper.bot.slotSecondaryPressed(), true, 'A sniper surprised in CQC should prefer the equipped shotgun.');
const emptySmg = tacticSample(WEAPONS.smg, 7, 3, { ammo:{ magazine:0, reserve:44 } });
assert.equal(emptySmg.bot.reloadPressed(), true, 'An empty ranged weapon with reserve must request reload.');
const woundedSmg = tacticSample(WEAPONS.smg, 7, 3, { health:42 });
assert.ok(woundedSmg.axis.x < -.3, 'A badly wounded bot must break contact instead of blindly rushing.');

// Fire discipline prevents range-wasting shotgun shots and self-destructive
// launcher shots. Heavy weapons settle into their lane before sustained fire.
function runFireWindow(weapon, distanceTiles, duration = .7, difficulty = 'Average') {
  liveDifficulty = difficulty;
  const botActor = actor({ id:`fire-${weapon.id}-${difficulty}`, team:'blue', x:5 * TILE_SIZE, y:9 * TILE_SIZE });
  const enemy = actor({ id:`fire-target-${weapon.id}`, team:'red', x:(5 + distanceTiles) * TILE_SIZE, y:9 * TILE_SIZE });
  const bot = new BotController(botActor, manager(weapon), 5, difficulty);
  let firedAt = null;
  let elapsed = 0;
  while (elapsed < duration) {
    botActor.aimAngle = 0;
    bot.update(.02, { camera:null, enemies:[enemy], teammates:[], map:openMap, pathfinder:null, targetCounts:new Map() });
    elapsed += .02;
    if ((bot.fireHeld() || bot.firePressed()) && firedAt == null) firedAt = elapsed;
  }
  return { bot, firedAt };
}
assert.equal(runFireWindow(WEAPONS.shotgun, 7).firedAt, null, 'Shotgun must not fire uselessly beyond pellet range.');
assert.equal(runFireWindow(WEAPONS.launcher, 3.2).firedAt, null, 'Launcher must not fire inside its safe blast distance.');
assert.ok(runFireWindow(WEAPONS.lmg, 10).bot.axis().x ** 2 + runFireWindow(WEAPONS.lmg, 10).bot.axis().y ** 2 < .5, 'LMG should settle while controlling a firing lane.');

// Perception is LOS/audibility based. A hidden enemy is not selected from global
// game state, and a remembered target does not update to its live hidden position.
const sightDefinition = {
  ...openDefinition,
  id:'ai-perception-range',
  structures:[{ x:10 * TILE_SIZE, y:1 * TILE_SIZE, w:1 * TILE_SIZE, h:16 * TILE_SIZE, kind:'wall' }]
};
const sightMap = new TileMap(sightDefinition);
const scout = actor({ id:'scout', team:'blue', x:7 * TILE_SIZE, y:9 * TILE_SIZE });
const hidden = actor({ id:'hidden', team:'red', x:13 * TILE_SIZE, y:9 * TILE_SIZE });
const scoutBot = new BotController(scout, manager(WEAPONS.assaultRifle), 8, 'Average');
scoutBot.update(.1, { camera:null, enemies:[hidden], teammates:[], map:sightMap, pathfinder:null, targetCounts:new Map() });
assert.equal(scoutBot.target, null, 'Bots may not acquire a silent opponent through a wall.');
sightMap.setDefinition({ ...openDefinition, id:'ai-perception-open' });
scoutBot.update(.2, { camera:null, enemies:[hidden], teammates:[], map:sightMap, pathfinder:null, targetCounts:new Map() });
assert.equal(scoutBot.target, hidden, 'Visible opponents should be perceived normally.');
const lastSeenX = scoutBot.targetIntel.x;
sightMap.setDefinition(sightDefinition);
hidden.x = 16 * TILE_SIZE;
scoutBot.update(.2, { camera:null, enemies:[hidden], teammates:[], map:sightMap, pathfinder:null, targetCounts:new Map() });
assert.equal(scoutBot.targetIntel.x, lastSeenX, 'Hidden movement may not leak into last-known target memory.');
assert.equal(scoutBot.fireHeld() || scoutBot.firePressed(), false, 'Bots may never fire using stale hidden-target knowledge.');

// Launcher target selection values a visible cluster without receiving extra
// vision. This uses only already perceived candidates.
const launcherActor = actor({ id:'launcher-bot', team:'blue', x:5 * TILE_SIZE, y:9 * TILE_SIZE });
const launcherBot = new BotController(launcherActor, manager(WEAPONS.launcher), 10, 'Average');
const isolated = actor({ id:'isolated', team:'red', x:14 * TILE_SIZE, y:5 * TILE_SIZE });
const clusteredA = actor({ id:'cluster-a', team:'red', x:14 * TILE_SIZE, y:11 * TILE_SIZE });
const clusteredB = actor({ id:'cluster-b', team:'red', x:14.8 * TILE_SIZE, y:11.4 * TILE_SIZE });
const perceived = [isolated, clusteredA, clusteredB].map((enemy) => ({ actor:enemy, x:enemy.x, y:enemy.y, visible:true, confidence:1, health:1 }));
assert.notEqual(launcherBot.chooseTarget(perceived, new Map(), WEAPON_TACTICS.launcher)?.actor, isolated, 'Launcher should prefer useful visible splash clustering.');

// Difficulty improves reaction and decision cadence. Both levels use the same
// weapon damage and perception rules; Pro does not receive wall vision.
const beginnerFire = runFireWindow(WEAPONS.assaultRifle, 8, .8, 'Beginner').firedAt;
const proFire = runFireWindow(WEAPONS.assaultRifle, 8, .8, 'Pro').firedAt;
assert.ok(beginnerFire != null && proFire != null, 'Both difficulties must eventually react to a visible target.');
assert.ok(proFire <= beginnerFire - .14, `Pro reaction (${proFire}) should be meaningfully quicker than Beginner (${beginnerFire}).`);

// Cached routes are invalidated immediately when the active map revision and
// dimensions change (Training Complex 32x22 → Foundry Zero 38x24 in 2.6).
const switchingMap = new TileMap(MAP_01);
const switchingPathfinder = new GridPathfinder(switchingMap, PLAYER_RADIUS, 4);
const deadActor = actor({ id:'dead-switch-test', team:'blue', x:MAP_01.spawns.blue[0].x, y:MAP_01.spawns.blue[0].y });
deadActor.health.alive = false;
const switchingBot = new BotController(deadActor, {}, 7, 'Average');
switchingBot.path = [{ x:9999, y:9999 }];
switchingBot.pathGoal = { x:9999, y:9999 };
switchingBot.pathMapRevision = switchingPathfinder.mapRevision;
switchingMap.setDefinition(MAP_02);
switchingBot.update(.016, { camera:null, map:switchingMap, pathfinder:switchingPathfinder });
assert.deepEqual(switchingBot.path, []);
assert.equal(switchingBot.pathGoal, null);
assert.equal(switchingBot.pathMapRevision, switchingMap.revision);
assert.equal(switchingPathfinder.cols, MAP_02.cols);
assert.equal(switchingPathfinder.rows, MAP_02.rows);

console.log(`Skirmish Arena 2.6 AI checks passed: ${productionRouteCount} production routes, repeated wall-safe patrols, clearance/corner probes, safe dashes, non-psychic perception, eight weapon tactics, health/ammo discipline, launcher clustering and difficulty reaction behavior.`);
