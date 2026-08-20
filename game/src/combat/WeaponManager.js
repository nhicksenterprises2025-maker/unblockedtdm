import { TILE_SIZE } from '../engine/constants.js';
import { DEFAULT_LOADOUT, canEquipInSlot } from '../data/weapons.js';
import { castHitscan } from './Hitscan.js';

const DEG_TO_RAD = Math.PI / 180;
const lerp = (a, b, t) => a + (b - a) * t;

function freshAmmo(weapon) {
  if (!weapon || weapon.magazineSize <= 0) return null;
  return { magazine: weapon.magazineSize, reserve: weapon.magazineSize * weapon.extraMagazines };
}

function normalizeLoadout(loadout) {
  const primary = loadout?.primary ?? DEFAULT_LOADOUT.primary;
  const secondary = loadout?.secondary ?? DEFAULT_LOADOUT.secondary;
  if (!canEquipInSlot(primary, 'primary')) throw new Error(`${primary?.name ?? 'Unknown'} cannot equip as primary`);
  if (!canEquipInSlot(secondary, 'secondary')) throw new Error(`${secondary?.name ?? 'Unknown'} cannot equip as secondary`);
  if (primary.id === secondary.id) throw new Error('The exact same weapon cannot occupy both slots');
  return { primary, secondary };
}

export class WeaponManager {
  constructor(owner, damageSystem, combatFeedback, projectileSystem = null, loadout = DEFAULT_LOADOUT, callbacks = {}) {
    this.owner = owner;
    this.damageSystem = damageSystem;
    this.feedback = combatFeedback;
    this.projectiles = projectileSystem;
    this.callbacks = callbacks;
    this.loadout = normalizeLoadout(loadout);
    this.currentSlot = 'primary';
    this.pendingSlot = null;
    this.ammo = { primary: freshAmmo(this.loadout.primary), secondary: freshAmmo(this.loadout.secondary) };

    this.fireCooldown = 0;
    this.postReloadDelay = 0;
    this.reloadTimer = 0;
    this.reloadDuration = 0;
    this.reloadProgress = 0;
    this.reloadShellsInserted = 0;
    this.switchTimer = 0;
    this.switchDuration = 0;
    this.adsProgress = 0;
    this.fireVisualTimer = 0;
    this.dryFireTimer = 0;
    this.meleeVisualTimer = 0;
    this.lastShotKind = null;
  }

  currentWeapon() { return this.loadout[this.currentSlot]; }
  currentAmmo() { return this.ammo[this.currentSlot]; }
  isReloading() { return this.reloadTimer > 0; }
  isSwitching() { return this.switchTimer > 0; }
  isADSActive() { return this.adsProgress > 0.01; }
  isFullyADS() { return this.adsProgress >= 0.999; }

  setLoadout(primary, secondary) {
    const next = normalizeLoadout({ primary, secondary });
    this.loadout = next;
    this.currentSlot = 'primary';
    this.pendingSlot = null;
    this.resetForLife();
    return true;
  }

  update(dt, input, map, targets = []) {
    this.fireCooldown = Math.max(0, this.fireCooldown - dt);
    this.postReloadDelay = Math.max(0, this.postReloadDelay - dt);
    this.fireVisualTimer = Math.max(0, this.fireVisualTimer - dt);
    this.dryFireTimer = Math.max(0, this.dryFireTimer - dt);
    this.meleeVisualTimer = Math.max(0, this.meleeVisualTimer - dt);

    if (!this.owner.health.alive) {
      this.cancelReload();
      this.adsProgress = 0;
      return;
    }
    if (this.owner.dashing) {
      this.cancelReload();
      this.meleeVisualTimer = 0;
      const weapon = this.currentWeapon();
      if (weapon?.canADS === false) {
        this.adsProgress = 0;
      } else {
        const wantsADS = input.adsHeld();
        const adsDelta = dt / Math.max(0.01, weapon?.adsTime || 0.01);
        this.adsProgress = Math.max(0, Math.min(1, this.adsProgress + (wantsADS ? adsDelta : -adsDelta)));
      }
      return;
    }

    if (input.slotPrimaryPressed()) this.requestSwitch('primary');
    if (input.slotSecondaryPressed()) this.requestSwitch('secondary');

    if (this.isSwitching()) {
      this.switchTimer = Math.max(0, this.switchTimer - dt);
      if (this.switchTimer <= 0 && this.pendingSlot) this.finishSwitch();
      const weapon = this.currentWeapon();
      this.adsProgress = Math.max(0, this.adsProgress - dt / Math.max(0.01, weapon?.adsTime || 0.4));
      return;
    }

    let weapon = this.currentWeapon();
    if (!weapon) return;
    let fireIntent = weapon.fireMode === 'auto' ? input.fireHeld() : input.firePressed();

    if (this.isReloading()) {
      const ammo = this.currentAmmo();
      if (weapon.reloadStyle === 'shell' && fireIntent && ammo?.magazine > 0) {
        this.cancelReload();
        this.postReloadDelay = 0;
      } else {
        this.updateReload(dt);
        return;
      }
    }

    if (input.reloadPressed()) {
      this.startReload();
      if (this.isReloading()) return;
    }

    weapon = this.currentWeapon();
    const wantsADS = weapon.canADS !== false && input.adsHeld();
    const adsDelta = dt / Math.max(0.01, weapon.adsTime || 0.01);
    this.adsProgress = weapon.canADS === false
      ? 0
      : Math.max(0, Math.min(1, this.adsProgress + (wantsADS ? adsDelta : -adsDelta)));
    if (wantsADS) this.owner.sprinting = false;

    fireIntent = weapon.fireMode === 'auto' ? input.fireHeld() : input.firePressed();
    if (fireIntent) this.tryFire(map, targets);
  }

  tryFire(map, targets) {
    const weapon = this.currentWeapon();
    const ammo = this.currentAmmo();
    if (!weapon || !this.owner.canFire() || this.isReloading() || this.isSwitching() || this.postReloadDelay > 0 || this.fireCooldown > 0) return false;
    if (weapon.magazineSize > 0 && (!ammo || ammo.magazine <= 0)) {
      this.dryFireTimer = 0.12;
      return false;
    }

    if (weapon.magazineSize > 0) ammo.magazine -= 1;
    this.fireCooldown = weapon.fireInterval;
    this.fireVisualTimer = weapon.kind === 'melee' ? 0 : 0.10;
    this.meleeVisualTimer = weapon.kind === 'melee' ? Math.min(0.32, weapon.fireInterval) : 0;
    this.lastShotKind = weapon.kind;
    if (weapon.kind !== 'melee') this.owner.sprinting = false;
    this.owner.notifyFired();

    if (weapon.kind === 'shotgun') return this.fireShotgun(weapon, map, targets);
    if (weapon.kind === 'projectile') return this.fireProjectile(weapon);
    if (weapon.kind === 'melee') return this.fireMelee(weapon, targets);
    return this.fireHitscan(weapon, map, targets);
  }

  fireHitscan(weapon, map, targets) {
    const spread = this.currentSpreadDegrees();
    const shotAngle = this.owner.aimAngle + (Math.random() - 0.5) * spread * DEG_TO_RAD;
    const muzzle = this.muzzleWorldPosition();
    const hit = castHitscan({ origin: muzzle, angle: shotAngle, map, targets, shooter: this.owner, maxDistance: Math.hypot(map.width, map.height) });
    const crit = Math.random() < weapon.critChance;
    const damage = crit ? weapon.critDamage : (hit.distance <= weapon.fullDamageRangeTiles * TILE_SIZE ? weapon.damage : weapon.falloffDamage);
    this.feedback.spawnShot({ muzzle, end: hit.point, crit, hit: Boolean(hit.target), type: weapon.id });
    if (!hit.target) return { applied: false, reason: hit.structure ? 'structure' : 'miss' };
    return this.applyWeaponDamage(hit.target, damage, crit, hit.point, weapon);
  }

  fireShotgun(weapon, map, targets) {
    const muzzle = this.muzzleWorldPosition();
    const spread = this.currentSpreadDegrees();
    const crit = Math.random() < weapon.critChance;
    const aggregate = new Map();

    for (let i = 0; i < weapon.pelletCount; i += 1) {
      const radial = Math.sqrt(Math.random());
      const ringAngle = Math.random() * Math.PI * 2;
      const angularOffset = Math.cos(ringAngle) * radial * (spread * 0.5) * DEG_TO_RAD;
      const angle = this.owner.aimAngle + angularOffset;
      const hit = castHitscan({ origin: muzzle, angle, map, targets, shooter: this.owner, maxDistance: Math.hypot(map.width, map.height) });
      this.feedback.spawnShot({ muzzle, end: hit.point, crit, hit: Boolean(hit.target), type: 'shotgun-pellet' });
      if (!hit.target) continue;
      const centerDistance = Math.hypot(hit.target.x - this.owner.x, hit.target.y - this.owner.y);
      const pelletDamage = crit ? weapon.critDamage : (centerDistance <= weapon.fullDamageRangeTiles * TILE_SIZE ? weapon.damage : weapon.falloffDamage);
      const record = aggregate.get(hit.target.id) || { target: hit.target, damage: 0, point: hit.point };
      record.damage += pelletDamage;
      record.point = hit.point;
      aggregate.set(hit.target.id, record);
    }

    let anyApplied = false;
    for (const record of aggregate.values()) {
      const result = this.applyWeaponDamage(record.target, record.damage, crit, record.point, weapon);
      anyApplied ||= Boolean(result.applied);
    }
    return { applied: anyApplied, pelletsHit: [...aggregate.values()].reduce((sum, r) => sum + Math.round(r.damage / (crit ? weapon.critDamage : weapon.damage)), 0) };
  }

  fireProjectile(weapon) {
    if (!this.projectiles) return { applied: false, reason: 'projectile-system-missing' };
    const spread = this.currentSpreadDegrees();
    const angle = this.owner.aimAngle + (Math.random() - 0.5) * spread * DEG_TO_RAD;
    const crit = weapon.projectileType === 'sniper' && Math.random() < weapon.critChance;
    const muzzle = this.muzzleWorldPosition();
    this.projectiles.spawn({ owner: this.owner, weapon, origin: muzzle, angle, crit });
    this.feedback.spawnLaunch?.({ muzzle, angle, type: weapon.projectileType });
    return { applied: true, reason: 'projectile-fired' };
  }

  fireMelee(weapon, targets) {
    const maxDistance = weapon.fullDamageRangeTiles * TILE_SIZE;
    const halfArc = 55 * DEG_TO_RAD;
    let best = null;
    for (const target of targets) {
      if (!target?.health?.alive || target === this.owner || target.team === this.owner.team) continue;
      const dx = target.x - this.owner.x;
      const dy = target.y - this.owner.y;
      const distance = Math.hypot(dx, dy);
      if (distance > maxDistance + target.radius) continue;
      const angle = Math.atan2(dy, dx);
      let delta = angle - this.owner.aimAngle;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      if (Math.abs(delta) > halfArc) continue;
      if (!best || distance < best.distance) best = { target, distance };
    }
    this.feedback.spawnMeleeSwing?.({ owner: this.owner, range: maxDistance, angle: this.owner.aimAngle });
    if (!best) return { applied: false, reason: 'miss' };
    const crit = Math.random() < weapon.critChance;
    const hitPoint = { x: best.target.x, y: best.target.y };
    return this.applyWeaponDamage(best.target, crit ? weapon.critDamage : weapon.damage, crit, hitPoint, weapon);
  }

  applyWeaponDamage(target, damage, crit, point, weapon) {
    const result = this.damageSystem.applyDamage({
      target,
      amount: damage,
      sourceId: this.owner.id,
      sourceTeam: this.owner.team,
      sourcePosition: { x: this.owner.x, y: this.owner.y },
      sourceType: weapon.id
    });
    if (result.applied) {
      this.feedback.spawnHit({ point, damage: result.amount, crit });
      if (result.killed) {
        target.onDeath();
        this.callbacks.onKill?.(target, result);
      }
    }
    return result;
  }

  muzzleWorldPosition() {
    const weapon = this.currentWeapon();
    if (!weapon) return { x: this.owner.x, y: this.owner.y };
    const state = this.animationState();
    const angle = this.owner.visualAimAngle;
    const visual = weapon.render || {};
    const forward = (visual.muzzleForward || 50) + state.ads * (visual.adsForwardShift || 0) - state.fireKick * (visual.kick || 0);
    const side = (visual.shoulderSide || 0) - state.ads * (visual.adsSideShift || 0);
    return {
      x: this.owner.x + Math.cos(angle) * forward - Math.sin(angle) * side,
      y: this.owner.y + Math.sin(angle) * forward + Math.cos(angle) * side
    };
  }

  startReload() {
    const weapon = this.currentWeapon();
    const ammo = this.currentAmmo();
    if (!weapon || weapon.magazineSize <= 0 || !ammo || this.isReloading() || this.isSwitching() || this.owner.dashing || ammo.magazine >= weapon.magazineSize || ammo.reserve <= 0) return false;
    this.reloadDuration = weapon.reloadTime;
    this.reloadTimer = weapon.reloadTime;
    this.reloadProgress = 0;
    this.reloadShellsInserted = 0;
    this.adsProgress = 0;
    return true;
  }

  updateReload(dt) {
    const weapon = this.currentWeapon();
    if (!weapon || !this.isReloading()) return;
    this.reloadTimer = Math.max(0, this.reloadTimer - dt);
    this.reloadProgress = 1 - this.reloadTimer / Math.max(0.001, this.reloadDuration);
    this.adsProgress = 0;
    if (this.reloadTimer > 0) return;
    if (weapon.reloadStyle === 'shell') this.insertShell();
    else this.finishMagazineReload();
  }

  insertShell() {
    const weapon = this.currentWeapon();
    const ammo = this.currentAmmo();
    if (!weapon || !ammo || ammo.reserve <= 0 || ammo.magazine >= weapon.magazineSize) {
      this.finishShellReload();
      return;
    }
    ammo.magazine += 1;
    ammo.reserve -= 1;
    this.reloadShellsInserted += 1;
    if (ammo.magazine >= weapon.magazineSize || ammo.reserve <= 0) {
      this.finishShellReload();
    } else {
      this.reloadDuration = weapon.reloadTime;
      this.reloadTimer = weapon.reloadTime;
      this.reloadProgress = 0;
    }
  }

  finishShellReload() {
    const weapon = this.currentWeapon();
    this.reloadTimer = 0;
    this.reloadProgress = 1;
    this.postReloadDelay = weapon?.postReloadDelay || 0;
  }

  finishMagazineReload() {
    const weapon = this.currentWeapon();
    const ammo = this.currentAmmo();
    if (!weapon || !ammo) return;
    const needed = weapon.magazineSize - ammo.magazine;
    const transferred = Math.min(needed, ammo.reserve);
    ammo.magazine += transferred;
    ammo.reserve -= transferred;
    this.reloadTimer = 0;
    this.reloadProgress = 1;
    this.postReloadDelay = weapon.postReloadDelay;
  }

  cancelReload() {
    if (!this.isReloading()) return false;
    this.reloadTimer = 0;
    this.reloadProgress = 0;
    return true;
  }

  requestSwitch(slot) {
    if (slot === this.currentSlot || !this.loadout[slot] || this.owner.dashing || !this.owner.canSwitchWeapon()) return false;
    const next = this.loadout[slot];
    this.cancelReload();
    this.adsProgress = 0;
    this.pendingSlot = slot;
    this.switchDuration = next.swapTime;
    this.switchTimer = next.swapTime;
    return true;
  }

  finishSwitch() {
    this.currentSlot = this.pendingSlot;
    this.pendingSlot = null;
    this.switchTimer = 0;
  }

  resetForLife() {
    this.ammo = { primary: freshAmmo(this.loadout.primary), secondary: freshAmmo(this.loadout.secondary) };
    this.fireCooldown = 0;
    this.postReloadDelay = 0;
    this.reloadTimer = 0;
    this.reloadDuration = 0;
    this.reloadProgress = 0;
    this.reloadShellsInserted = 0;
    this.switchTimer = 0;
    this.switchDuration = 0;
    this.pendingSlot = null;
    this.adsProgress = 0;
    this.fireVisualTimer = 0;
    this.dryFireTimer = 0;
    this.meleeVisualTimer = 0;
  }

  currentSpreadDegrees() {
    const weapon = this.currentWeapon();
    if (!weapon || weapon.baseSpreadDegrees <= 0) return 0;
    const moving = this.owner.speedTilesPerSecond() > 0.08;
    let spread = moving ? weapon.movingSpreadDegrees : weapon.baseSpreadDegrees * weapon.stationarySpreadMultiplier;
    spread *= lerp(1, weapon.adsSpreadMultiplier, this.adsProgress);
    return spread;
  }

  movementMultiplier(input = null) {
    const weapon = this.currentWeapon();
    if (!weapon) return 1;
    let multiplier = weapon.movementMultiplier;
    if (weapon.canADS !== false) {
      const adsIntent = input?.adsHeld?.() ? Math.max(this.adsProgress, 0.15) : this.adsProgress;
      if (adsIntent > 0.01) multiplier *= lerp(1, weapon.adsMovementMultiplier, adsIntent);
    }
    if (this.isReloading()) multiplier *= weapon.reloadMovementMultiplier;
    if (this.isSwitching()) multiplier *= weapon.swapMovementMultiplier;
    return multiplier;
  }

  animationState() {
    const weapon = this.currentWeapon();
    const kickScale = weapon?.render?.kick || 1;
    return {
      weaponId: weapon?.id ?? null,
      ads: this.adsProgress,
      firing: this.fireVisualTimer > 0,
      fireKick: Math.min(1, this.fireVisualTimer / 0.10),
      kickScale,
      meleeSwing: this.meleeVisualTimer > 0 ? 1 - this.meleeVisualTimer / Math.min(0.32, weapon?.fireInterval || 0.32) : 0,
      reloading: this.isReloading(),
      reloadProgress: this.reloadProgress,
      shellsInserted: this.reloadShellsInserted,
      switching: this.isSwitching(),
      switchProgress: this.switchDuration > 0 ? 1 - this.switchTimer / this.switchDuration : 1
    };
  }
}
