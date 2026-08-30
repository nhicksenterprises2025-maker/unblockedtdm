import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  WEAPONS,
  deriveWeaponDps,
  formatWeaponDps,
  formatWeaponStats
} from '../game/src/data/weapons.js';
import { GameSettings } from '../game/src/engine/GameSettings.js';
import { WeaponManager } from '../game/src/combat/WeaponManager.js';
import {
  ARENA_AP_REWARDS,
  ArenaStore,
  calculateArenaMatch
} from '../game/src/arena/ArenaStore.js';
import {
  careerLevelFromXp,
  totalXpAtLevel
} from '../game/src/progression/ProgressionStore.js';
import {
  animateProgression,
  arenaProgressionState,
  arenaTransitionRanks,
  careerProgressionState,
  careerTransitionLevels
} from '../game/src/ui/PostgameProgression.js';

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

const read = (relative) => fs.readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8');
const close = (actual, expected, message = '') => assert.ok(Math.abs(actual - expected) < 1e-9, message || `${actual} must equal ${expected}`);

// Weapon Info derives DPS from canonical live values and documents special
// semantics without maintaining a second balance table.
const ar = deriveWeaponDps(WEAPONS.assaultRifle);
close(ar.directDps, WEAPONS.assaultRifle.damage / WEAPONS.assaultRifle.fireInterval);
const tunedAr = deriveWeaponDps({ ...WEAPONS.assaultRifle, damage:25 });
close(tunedAr.directDps, 25 / WEAPONS.assaultRifle.fireInterval, 'Changing balance data must automatically change DPS.');

const shotgun = deriveWeaponDps(WEAPONS.shotgun);
close(shotgun.directDps, WEAPONS.shotgun.damage * WEAPONS.shotgun.pelletCount / WEAPONS.shotgun.fireInterval);
close(shotgun.falloffDps, WEAPONS.shotgun.falloffDamage * WEAPONS.shotgun.pelletCount / WEAPONS.shotgun.fireInterval);
assert.equal(shotgun.semantics, 'maximum-close-range-pellet');
assert.match(formatWeaponDps(WEAPONS.shotgun), /pellet hits\/range vary/);

const launcher = deriveWeaponDps(WEAPONS.launcher);
close(launcher.directDps, WEAPONS.launcher.damage / WEAPONS.launcher.fireInterval);
assert.equal(launcher.semantics, 'splash-per-exposed-target');
assert.match(formatWeaponDps(WEAPONS.launcher), /splash \/ exposed target.*direct impact adds no bonus/);

const melee = deriveWeaponDps(WEAPONS.melee);
close(melee.directDps, WEAPONS.melee.damage / WEAPONS.melee.fireInterval);
assert.equal(melee.semantics, 'melee-swing');
for (const weapon of Object.values(WEAPONS)) {
  const dpsRow = formatWeaponStats(weapon).find(([label]) => label === 'DPS');
  assert.ok(dpsRow && dpsRow[1] !== 'N/A', `${weapon.name} must expose a derived DPS row.`);
}

// Auto Reload persists as an opt-in setting and the 2.6 HUD ceiling remains
// independently bounded at 140%.
const settingsStorage = new MemoryStorage();
let settings = new GameSettings(settingsStorage);
assert.equal(settings.gameplay().autoReload, false, 'Manual reload remains the compatibility default.');
settings.setGameplay('autoReload', true);
settings.setGameplay('hudScale', 9);
settings = new GameSettings(settingsStorage);
assert.equal(settings.gameplay().autoReload, true);
assert.equal(settings.gameplay().hudScale, 1.4);
settings.resetGameplay();
assert.equal(settings.gameplay().autoReload, false);

function input(overrides = {}) {
  return {
    adsHeld:() => false,
    fireHeld:() => false,
    firePressed:() => false,
    reloadPressed:() => false,
    slotPrimaryPressed:() => false,
    slotSecondaryPressed:() => false,
    ...overrides
  };
}

function owner() {
  return {
    id:'local-test',
    team:'blue',
    health:{ alive:true },
    dashing:false,
    sprinting:false,
    aimAngle:0,
    visualAimAngle:0,
    canFire:() => true,
    canSwitchWeapon:() => true,
    speedTilesPerSecond:() => 0,
    notifyFired() {}
  };
}

function manager({ primary = WEAPONS.assaultRifle, secondary = WEAPONS.pistol, autoReload = true } = {}) {
  const actor = owner();
  const instance = new WeaponManager(
    actor,
    { applyDamage:() => ({ applied:false }) },
    { spawnShot() {}, spawnMeleeSwing() {} },
    null,
    { primary, secondary },
    { autoReloadEnabled:() => autoReload }
  );
  return { actor, instance };
}

{
  const { instance } = manager();
  instance.ammo.primary = { magazine:0, reserve:12 };
  instance.update(0.016, input(), {}, []);
  assert.equal(instance.isReloading(), true, 'A valid zero-mag state must begin reload.');
}
{
  const { instance } = manager({ autoReload:false });
  instance.ammo.primary = { magazine:0, reserve:12 };
  instance.update(0.016, input(), {}, []);
  assert.equal(instance.isReloading(), false, 'Disabled assistance must preserve manual control.');
  instance.update(0.016, input({ reloadPressed:() => true }), {}, []);
  assert.equal(instance.isReloading(), true, 'Manual reload must remain available when assistance is off.');
}
{
  const { actor, instance } = manager();
  instance.ammo.primary = { magazine:0, reserve:12 };
  actor.dashing = true;
  instance.update(0.016, input(), {}, []);
  assert.equal(instance.isReloading(), false, 'Dash must guard reload.');
  actor.dashing = false;
  instance.update(0.016, input(), {}, []);
  assert.equal(instance.isReloading(), true, 'Assistance may retry once dash ends.');
}
{
  const { instance } = manager();
  instance.ammo.primary = { magazine:0, reserve:12 };
  instance.update(0.016, input({ slotSecondaryPressed:() => true }), {}, []);
  assert.equal(instance.isReloading(), false, 'A weapon swap must guard auto reload.');
  assert.equal(instance.isSwitching(), true);
  instance.update(10, input(), {}, []);
  assert.equal(instance.currentSlot, 'secondary');
  instance.update(0.016, input({ slotPrimaryPressed:() => true }), {}, []);
  instance.update(10, input(), {}, []);
  assert.equal(instance.currentSlot, 'primary');
  assert.equal(instance.isReloading(), false, 'Reload does not begin inside the frame that completes a swap.');
  instance.update(0.016, input(), {}, []);
  assert.equal(instance.isReloading(), true, 'The empty weapon may reload once its swap has fully settled.');
}
{
  const { actor, instance } = manager();
  instance.ammo.primary = { magazine:0, reserve:12 };
  actor.health.alive = false;
  instance.update(0.016, input(), {}, []);
  assert.equal(instance.isReloading(), false, 'Dead actors cannot auto reload.');
}
{
  const { instance } = manager();
  instance.ammo.primary = { magazine:0, reserve:12 };
  instance.resetForLife();
  instance.update(0.016, input(), {}, []);
  assert.equal(instance.currentAmmo().magazine, WEAPONS.assaultRifle.magazineSize);
  assert.equal(instance.isReloading(), false, 'Spawn/round reset restores ammo and cannot create an invalid reload.');
}
{
  const { instance } = manager();
  instance.ammo.primary = { magazine:0, reserve:0 };
  for (let index = 0; index < 10; index += 1) instance.update(0.016, input(), {}, []);
  assert.equal(instance.isReloading(), false, 'No reserve ammo must not create a reload loop.');
}
{
  const { instance } = manager({ primary:WEAPONS.shotgun });
  instance.ammo.primary = { magazine:0, reserve:6 };
  instance.update(0.016, input(), {}, []);
  assert.equal(instance.isReloading(), true, 'Shell reloads use the same validated trigger.');
  instance.update(WEAPONS.shotgun.reloadTime, input(), {}, []);
  assert.equal(instance.ammo.primary.magazine, 1);
  assert.equal(instance.ammo.primary.reserve, 5);
}
{
  const { instance } = manager({ secondary:WEAPONS.launcher });
  instance.currentSlot = 'secondary';
  instance.ammo.secondary = { magazine:0, reserve:2 };
  instance.update(0.016, input(), {}, []);
  assert.equal(instance.isReloading(), true, 'Launcher reloads remain compatible.');
}
{
  const { instance } = manager({ secondary:WEAPONS.melee });
  instance.currentSlot = 'secondary';
  instance.update(0.016, input(), {}, []);
  assert.equal(instance.isReloading(), false, 'Melee can never enter a reload state.');
}

// Arena abandonment is one exact -50 AP ledger transaction, remains
// match-ID-idempotent, and obeys the AP floor.
assert.equal(ARENA_AP_REWARDS.forfeit, -50);
const scoredForfeit = calculateArenaMatch({ forfeit:true, won:true, kills:50, deaths:1, roundWins:4, mvp:true });
assert.equal(scoredForfeit.rawDelta, -50);
assert.equal(scoredForfeit.breakdown.forfeit, -50);
assert.equal(scoredForfeit.breakdown.kills, 0);
assert.equal(scoredForfeit.breakdown.loss, 0);
assert.equal(scoredForfeit.flags.won, false);

const forfeitStorage = new MemoryStorage();
const forfeitStore = new ArenaStore({ storage:forfeitStorage, now:() => new Date(2026, 7, 30, 12) });
forfeitStore.profile.current.ap = 120;
forfeitStore.profile.current.peakAp = 120;
forfeitStore.save();
forfeitStore.beginMatch({ id:'arena-forfeit-one' });
forfeitStore.updateActiveMatch({ kills:8, deaths:2, roundWins:3, playSeconds:240 });
const forfeit = forfeitStore.forfeitActive();
assert.equal(forfeit.rawDelta, -50);
assert.equal(forfeit.apBefore, 120);
assert.equal(forfeit.apAfter, 70);
assert.equal(forfeitStore.snapshot().forfeits, 1);
assert.equal(forfeitStore.snapshot().recent[0].rawDelta, -50);
assert.equal(forfeitStore.snapshot().recent[0].forfeit, true);
assert.equal(forfeitStore.recordMatch({ matchId:'arena-forfeit-one', won:true }).duplicate, true);
assert.equal(forfeitStore.snapshot().ap, 70, 'Replaying a processed forfeit ID cannot charge or award AP.');
assert.equal(forfeitStore.forfeitActive(), null, 'No active match means no penalty.');

const floorStore = new ArenaStore({ storage:new MemoryStorage(), now:() => new Date(2026, 7, 30, 12) });
floorStore.profile.current.ap = 30;
floorStore.profile.current.peakAp = 30;
floorStore.save();
floorStore.beginMatch({ id:'arena-floor' });
const floor = floorStore.forfeitActive();
assert.equal(floor.rawDelta, -50);
assert.equal(floor.apDelta, -30);
assert.equal(floor.apAfter, 0);

const recoveryStorage = new MemoryStorage();
let recoveryStore = new ArenaStore({ storage:recoveryStorage, now:() => new Date(2026, 7, 30, 12) });
recoveryStore.profile.current.ap = 130;
recoveryStore.profile.current.peakAp = 130;
recoveryStore.save();
recoveryStore.beginMatch({ id:'arena-crash' });
recoveryStore = new ArenaStore({ storage:recoveryStorage, now:() => new Date(2026, 7, 30, 12) });
assert.equal(recoveryStore.recoveredForfeit.rawDelta, -50);
assert.equal(recoveryStore.snapshot().ap, 80);
assert.equal(recoveryStore.snapshot().forfeits, 1);
recoveryStore = new ArenaStore({ storage:recoveryStorage, now:() => new Date(2026, 7, 30, 12) });
assert.equal(recoveryStore.recoveredForfeit, null);
assert.equal(recoveryStore.snapshot().ap, 80, 'Recovery cannot double-charge the same match.');

const completedStore = new ArenaStore({ storage:new MemoryStorage(), now:() => new Date(2026, 7, 30, 12) });
completedStore.beginMatch({ id:'arena-completed' });
const completed = completedStore.recordMatch({ matchId:'arena-completed', won:false, kills:0, deaths:1, roundWins:0, roundLosses:5 });
assert.equal(completed.flags.forfeit, false);
assert.equal(completed.breakdown.forfeit, 0);
assert.equal(completed.rawDelta, -18, 'A legitimate result retains normal Arena scoring.');

// Career and Arena presentation state resolves from persisted totals, crosses
// every real threshold, and always finishes on the exact store value.
const beforeXp = totalXpAtLevel(21) + 53;
const afterXp = beforeXp + 420;
const careerBefore = careerProgressionState(beforeXp);
const careerAfter = careerProgressionState(afterXp);
assert.deepEqual(
  { level:careerAfter.level, levelXp:careerAfter.levelXp, levelXpRequired:careerAfter.levelXpRequired },
  careerLevelFromXp(afterXp)
);
assert.ok(careerTransitionLevels(beforeXp, afterXp).length >= 1);
assert.equal(careerBefore.totalXp, beforeXp);

assert.equal(arenaProgressionState(43).rank.id, 'prospect');
assert.equal(arenaProgressionState(101).rank.id, 'rookie-i');
assert.deepEqual(arenaTransitionRanks(43, 260), ['rookie-i', 'rookie-ii']);
assert.deepEqual(arenaTransitionRanks(260, 43), ['rookie-i', 'prospect']);

let finalAnimatedValue = null;
const skippable = animateProgression({
  from:43,
  to:101,
  duration:2000,
  quantize:(value) => Math.round(value * 2) / 2,
  onFrame:(value) => { finalAnimatedValue = value; }
});
skippable.finish();
await skippable.promise;
assert.equal(finalAnimatedValue, 101, 'Skipping must synchronously resolve the exact persisted final value.');

let careerAnimatedValue = null;
const immediate = animateProgression({
  from:beforeXp,
  to:afterXp,
  duration:0,
  quantize:Math.floor,
  onFrame:(value) => { careerAnimatedValue = value; }
});
await immediate.promise;
assert.equal(careerAnimatedValue, afterXp);

// Integration seams: the real panels own skip-safe actions, exact final-state
// markers, persistent auto reload, and no placeholder online controls.
const settingsPanel = read('game/src/ui/SettingsPanel.js');
const legacySettings = read('game/src/phase4-runtime.js');
const renderer = read('game/src/renderer.js');
const postgame = read('game/src/ui/PostgameScreen.js');
const careerRuntime = read('game/src/phase211-runtime.js');
const arenaRuntime = read('game/src/phase2431-runtime.js');
for (const token of ['data-setting="autoReload"', 'AUTO RELOAD', 'max="1.4"']) assert.ok(settingsPanel.includes(token));
assert.ok(legacySettings.includes("grid.closest('[data-settings-version]')"), 'Legacy settings augmentation must not duplicate cards on the versioned 2.6 panel.');
assert.ok(renderer.includes('autoReloadEnabled'));
for (const token of ['data-postgame-action="menu"', 'data-postgame-action="rematch"', 'data-postgame-action="skip"', 'skirmish:skip-postgame-progression', 'MATCH MVP', 'row?.identity?.displayName']) assert.ok(postgame.includes(token));
for (const token of ['dataset.finalTotalXp', 'animateProgression', '__careerAnimationPromise211']) assert.ok(careerRuntime.includes(token));
for (const token of ['dataset.finalAp', 'animateProgression', 'FORFEIT', 'match.forfeit ? match.rawDelta : match.apDelta', 'settleLiveForfeit']) assert.ok(arenaRuntime.includes(token));
assert.match(arenaRuntime, /skirmish:show-menu-home[\s\S]*?if \(telemetry\.active\) settleLiveForfeit\(\)/, 'Every route back to Home must settle an active Arena match.');
assert.ok(!postgame.includes('FRIENDS') && !postgame.includes('MATCHMAKING'), '2.6 must not fake future online UI.');

console.log('Skirmish Arena 2.6 systems checks passed: canonical DPS, guarded persistent Auto Reload, exact/idempotent -50 AP forfeits and recovery, exact skippable Career/Arena progression, and reusable roster identity seams.');
