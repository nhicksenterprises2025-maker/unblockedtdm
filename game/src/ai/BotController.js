import { castHitscan } from '../combat/Hitscan.js';
import { TILE_SIZE } from '../engine/constants.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const normalize = (x, y) => {
  const length = Math.hypot(x, y);
  return length > 0.0001 ? { x: x / length, y: y / length } : { x: 0, y: 0 };
};

function preferredRange(weapon) {
  switch (weapon?.id) {
    case 'melee': return 1.35;
    case 'shotgun': return 3.4;
    case 'smg': return 5.6;
    case 'pistol': return 6.5;
    case 'assault-rifle': return 8.5;
    case 'launcher': return 9.0;
    case 'lmg': return 10.5;
    case 'sniper': return 14.5;
    default: return 8;
  }
}

export class BotController {
  constructor(player, weaponManager, seed = 0) {
    this.player = player;
    this.weaponManager = weaponManager;
    this.seed = seed;
    this.camera = null;
    this.aimWorld = { x: player.x + 100, y: player.y };
    this.moveAxis = { x: 0, y: 0 };
    this.fire = false;
    this.firePulse = false;
    this.ads = false;
    this.sprint = false;
    this.dashPulse = false;
    this.reloadPulse = false;
    this.primaryPulse = false;
    this.secondaryPulse = false;
    this.shotTimer = 0;
    this.dashThinkTimer = 0.8 + seed * 0.17;
    this.strafeClock = seed * 0.71;
    this.target = null;
  }

  resetTransient() {
    this.fire = false;
    this.firePulse = false;
    this.dashPulse = false;
    this.reloadPulse = false;
    this.primaryPulse = false;
    this.secondaryPulse = false;
  }

  update(dt, { camera, enemies = [], teammates = [], map }) {
    this.resetTransient();
    this.camera = camera;
    this.shotTimer = Math.max(0, this.shotTimer - dt);
    this.dashThinkTimer -= dt;
    this.strafeClock += dt;

    if (!this.player.health.alive) {
      this.moveAxis = { x: 0, y: 0 };
      this.sprint = false;
      this.ads = false;
      this.target = null;
      return;
    }

    const livingEnemies = enemies.filter((enemy) => enemy.health?.alive);
    if (!livingEnemies.length) {
      this.moveAxis = { x: 0, y: 0 };
      this.sprint = false;
      this.ads = false;
      this.target = null;
      return;
    }

    livingEnemies.sort((a, b) => Math.hypot(a.x - this.player.x, a.y - this.player.y) - Math.hypot(b.x - this.player.x, b.y - this.player.y));
    this.target = livingEnemies[0];

    const weapon = this.weaponManager.currentWeapon();
    const ammo = this.weaponManager.currentAmmo();
    if (weapon?.magazineSize > 0 && ammo && ammo.magazine <= 0 && ammo.reserve <= 0) {
      if (this.weaponManager.currentSlot === 'primary') this.secondaryPulse = true;
      else this.primaryPulse = true;
    }
    const dx = this.target.x - this.player.x;
    const dy = this.target.y - this.player.y;
    const distance = Math.hypot(dx, dy);
    const distanceTiles = distance / TILE_SIZE;
    const toward = normalize(dx, dy);

    const sight = castHitscan({
      origin: { x: this.player.x, y: this.player.y },
      angle: Math.atan2(dy, dx),
      map,
      targets: [this.target],
      shooter: this.player,
      maxDistance: distance + this.target.radius + 4
    });
    const hasLOS = sight.target === this.target;

    const jitter = weapon?.id === 'sniper' ? 5 : weapon?.id === 'smg' ? 12 : 8;
    this.aimWorld = {
      x: this.target.x + Math.cos(this.strafeClock * 1.8 + this.seed) * jitter,
      y: this.target.y + Math.sin(this.strafeClock * 1.4 + this.seed * 0.7) * jitter
    };

    const preferred = preferredRange(weapon);
    const strafeSign = (this.seed % 2 === 0 ? 1 : -1) * (Math.sin(this.strafeClock * 0.72) >= 0 ? 1 : -1);
    let moveX = 0;
    let moveY = 0;

    if (!hasLOS || distanceTiles > preferred * 1.22) {
      moveX = toward.x;
      moveY = toward.y;
    } else if (distanceTiles < preferred * 0.48) {
      moveX = -toward.x;
      moveY = -toward.y;
    } else {
      const radialCorrection = clamp((distanceTiles - preferred) / Math.max(1, preferred), -0.35, 0.35);
      moveX = -toward.y * strafeSign + toward.x * radialCorrection;
      moveY = toward.x * strafeSign + toward.y * radialCorrection;
    }

    for (const mate of teammates) {
      if (!mate.health?.alive || mate === this.player) continue;
      const mx = this.player.x - mate.x;
      const my = this.player.y - mate.y;
      const md = Math.hypot(mx, my);
      if (md > 0 && md < TILE_SIZE * 1.4) {
        moveX += (mx / md) * 0.65;
        moveY += (my / md) * 0.65;
      }
    }

    this.moveAxis = normalize(moveX, moveY);
    this.sprint = !hasLOS && distanceTiles > 9 && this.player.stamina > 30;
    this.ads = hasLOS && weapon?.canADS !== false && distanceTiles > (weapon?.id === 'shotgun' ? 2.2 : 3.2);

    const practicalRange = weapon?.id === 'melee'
      ? 2.05
      : weapon?.id === 'shotgun'
        ? 6.5
        : weapon?.id === 'smg'
          ? 11
          : weapon?.id === 'pistol'
            ? 10
            : weapon?.id === 'launcher'
              ? 15
              : weapon?.id === 'sniper'
                ? 25
                : 18;
    const wantsFire = hasLOS && distanceTiles <= practicalRange;

    if (weapon?.magazineSize > 0 && ammo && ammo.reserve > 0 && !this.weaponManager.isReloading()) {
      const low = ammo.magazine <= Math.max(1, Math.floor(weapon.magazineSize * 0.18));
      if (ammo.magazine === 0 || (low && !hasLOS)) this.reloadPulse = true;
    }

    if (wantsFire && !this.reloadPulse) {
      if (weapon?.fireMode === 'auto') this.fire = true;
      else if (this.shotTimer <= 0) {
        this.firePulse = true;
        const cadence = weapon?.id === 'pistol' ? 0.22 : Math.max(0.16, weapon?.fireInterval || 0.24);
        this.shotTimer = cadence;
      }
    }

    if (this.dashThinkTimer <= 0) {
      this.dashThinkTimer = 2.3 + ((this.seed * 0.37 + this.strafeClock * 0.13) % 1.4);
      const underPressure = hasLOS && distanceTiles < preferred * 0.85;
      if (underPressure && this.player.dashCharges > 0 && this.player.stamina >= 15) this.dashPulse = true;
    }
  }

  axis() { return { ...this.moveAxis }; }
  sprintHeld() { return this.sprint; }
  dashPressed() { return this.dashPulse; }
  reloadPressed() { return this.reloadPulse; }
  slotPrimaryPressed() { return this.primaryPulse; }
  slotSecondaryPressed() { return this.secondaryPulse; }
  fireHeld() { return this.fire; }
  firePressed() { return this.firePulse; }
  adsHeld() { return this.ads; }
  pointerPosition() {
    if (!this.camera) return { x: 0, y: 0, inside: true };
    return {
      x: (this.aimWorld.x - this.camera.x) * this.camera.zoom + this.camera.width / 2,
      y: (this.aimWorld.y - this.camera.y) * this.camera.zoom + this.camera.height / 2,
      inside: true
    };
  }
  wasPressed() { return false; }
  endFrame() { this.resetTransient(); }
}
