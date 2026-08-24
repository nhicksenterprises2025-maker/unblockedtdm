import { CombatFeedbackRenderer } from './render/CombatFeedbackRenderer.js';
import { DamageFeedbackRenderer } from './render/DamageFeedbackRenderer.js';
import { WeaponRenderer } from './render/WeaponRenderer.js';

function ensureStyle(href) {
  if ([...document.querySelectorAll('link[rel="stylesheet"]')].some((link) => link.getAttribute('href') === href)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

function combatFx(renderer) {
  if (!renderer.__phase5Fx) {
    renderer.__phase5Fx = {
      muzzleBursts: [],
      impactBursts: [],
      shockwaves: [],
      debris: [],
      blastCores: []
    };
  }
  return renderer.__phase5Fx;
}

function decay(list, dt) {
  for (const item of list) item.life -= dt;
  return list.filter((item) => item.life > 0);
}

function installCombatVfx() {
  if (CombatFeedbackRenderer.prototype.__phase5Installed) return;

  const originalShot = CombatFeedbackRenderer.prototype.spawnShot;
  CombatFeedbackRenderer.prototype.spawnShot = function phase5Shot(payload = {}) {
    const result = originalShot.call(this, payload);
    const fx = combatFx(this);
    if (payload.muzzle) {
      fx.muzzleBursts.push({
        x: payload.muzzle.x,
        y: payload.muzzle.y,
        type: payload.type || 'assault-rifle',
        life: 0.095,
        maxLife: 0.095
      });
    }
    if (payload.end) {
      fx.impactBursts.push({
        x: payload.end.x,
        y: payload.end.y,
        hit: Boolean(payload.hit),
        crit: Boolean(payload.crit),
        life: payload.crit ? 0.32 : 0.22,
        maxLife: payload.crit ? 0.32 : 0.22,
        size: payload.type === 'shotgun-pellet' ? 6 : 9
      });
    }
    return result;
  };

  const originalProjectileImpact = CombatFeedbackRenderer.prototype.spawnProjectileImpact;
  CombatFeedbackRenderer.prototype.spawnProjectileImpact = function phase5ProjectileImpact(payload = {}) {
    const result = originalProjectileImpact.call(this, payload);
    const fx = combatFx(this);
    if (payload.point) {
      fx.impactBursts.push({
        x: payload.point.x,
        y: payload.point.y,
        hit: Boolean(payload.hit),
        crit: Boolean(payload.crit),
        life: payload.type === 'sniper' ? 0.42 : 0.28,
        maxLife: payload.type === 'sniper' ? 0.42 : 0.28,
        size: payload.type === 'sniper' ? 16 : 10
      });
    }
    return result;
  };

  const originalExplosion = CombatFeedbackRenderer.prototype.spawnExplosion;
  CombatFeedbackRenderer.prototype.spawnExplosion = function phase5Explosion(payload = {}) {
    const result = originalExplosion.call(this, payload);
    const fx = combatFx(this);
    const point = payload.point || { x: 0, y: 0 };
    const radius = Math.max(32, Number(payload.radius || 110));
    fx.shockwaves.push({ x: point.x, y: point.y, radius, life: 0.72, maxLife: 0.72 });
    fx.blastCores.push({ x: point.x, y: point.y, radius, life: 0.22, maxLife: 0.22 });
    for (let index = 0; index < 22; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 95 + Math.random() * 250;
      fx.debris.push({
        x: point.x,
        y: point.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 13,
        size: 2 + Math.random() * 5,
        life: 0.45 + Math.random() * 0.55,
        maxLife: 1
      });
    }
    return result;
  };

  const originalUpdate = CombatFeedbackRenderer.prototype.update;
  CombatFeedbackRenderer.prototype.update = function phase5Update(dt) {
    const result = originalUpdate.call(this, dt);
    const fx = combatFx(this);
    fx.muzzleBursts = decay(fx.muzzleBursts, dt);
    fx.impactBursts = decay(fx.impactBursts, dt);
    fx.shockwaves = decay(fx.shockwaves, dt);
    fx.blastCores = decay(fx.blastCores, dt);
    for (const piece of fx.debris) {
      piece.life -= dt;
      piece.x += piece.vx * dt;
      piece.y += piece.vy * dt;
      piece.vx *= Math.exp(-2.6 * dt);
      piece.vy *= Math.exp(-2.6 * dt);
      piece.vy += 120 * dt;
      piece.rotation += piece.spin * dt;
    }
    fx.debris = fx.debris.filter((piece) => piece.life > 0);
    return result;
  };

  const originalDrawWorld = CombatFeedbackRenderer.prototype.drawWorld;
  CombatFeedbackRenderer.prototype.drawWorld = function phase5DrawWorld() {
    originalDrawWorld.call(this);
    const fx = combatFx(this);
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (const burst of fx.muzzleBursts) {
      const alpha = Math.max(0, burst.life / burst.maxLife);
      const size = burst.type === 'lmg' ? 18 : burst.type === 'shotgun-pellet' ? 15 : 12;
      const gradient = ctx.createRadialGradient(burst.x, burst.y, 0, burst.x, burst.y, size);
      gradient.addColorStop(0, `rgba(255,248,205,${0.78 * alpha})`);
      gradient.addColorStop(0.35, `rgba(255,181,66,${0.48 * alpha})`);
      gradient.addColorStop(1, 'rgba(255,120,32,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(burst.x, burst.y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const burst of fx.impactBursts) {
      const alpha = Math.max(0, burst.life / burst.maxLife);
      const progress = 1 - alpha;
      ctx.globalAlpha = alpha * 0.9;
      ctx.strokeStyle = burst.crit ? '#ffe66d' : burst.hit ? '#b9f5ff' : '#d9e2e6';
      ctx.lineWidth = burst.crit ? 3 : 1.6;
      ctx.beginPath();
      ctx.arc(burst.x, burst.y, burst.size * (0.45 + progress * 1.5), 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = alpha * 0.36;
      ctx.fillStyle = burst.crit ? '#ffd64f' : '#bcecff';
      ctx.beginPath();
      ctx.arc(burst.x, burst.y, Math.max(2, burst.size * 0.42 * alpha), 0, Math.PI * 2);
      ctx.fill();
    }

    for (const core of fx.blastCores) {
      const alpha = Math.max(0, core.life / core.maxLife);
      const progress = 1 - alpha;
      const radius = core.radius * (0.12 + progress * 0.42);
      const gradient = ctx.createRadialGradient(core.x, core.y, 0, core.x, core.y, radius);
      gradient.addColorStop(0, `rgba(255,255,235,${0.95 * alpha})`);
      gradient.addColorStop(0.28, `rgba(255,218,96,${0.78 * alpha})`);
      gradient.addColorStop(0.7, `rgba(255,101,37,${0.42 * alpha})`);
      gradient.addColorStop(1, 'rgba(255,76,22,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(core.x, core.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
    for (const ring of fx.shockwaves) {
      const alpha = Math.max(0, ring.life / ring.maxLife);
      const progress = 1 - alpha;
      ctx.globalAlpha = alpha * 0.75;
      ctx.strokeStyle = '#f5dfaa';
      ctx.lineWidth = 4 * alpha + 1;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius * (0.18 + progress * 0.9), 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = alpha * 0.22;
      ctx.strokeStyle = '#68747a';
      ctx.lineWidth = 14 * alpha + 2;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius * (0.28 + progress * 0.98), 0, Math.PI * 2);
      ctx.stroke();
    }

    for (const piece of fx.debris) {
      const alpha = Math.max(0, Math.min(1, piece.life / piece.maxLife));
      ctx.save();
      ctx.translate(piece.x, piece.y);
      ctx.rotate(piece.rotation);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = alpha > 0.55 ? '#d79547' : '#6b6255';
      ctx.fillRect(-piece.size, -piece.size * 0.35, piece.size * 2, piece.size * 0.7);
      ctx.restore();
    }
    ctx.restore();
  };

  Object.defineProperty(CombatFeedbackRenderer.prototype, '__phase5Installed', { value: true });
}

function installDeathVfx() {
  if (DamageFeedbackRenderer.prototype.__phase5Installed) return;

  const originalDeath = DamageFeedbackRenderer.prototype.spawnDeathBurst;
  DamageFeedbackRenderer.prototype.spawnDeathBurst = function phase5Death(player) {
    const result = originalDeath.call(this, player);
    if (!this.__phase5Remnants) this.__phase5Remnants = [];
    this.__phase5Remnants.push({
      x: player.x,
      y: player.y,
      angle: player.visualMoveAngle || player.aimAngle || 0,
      team: player.team,
      life: 4.6,
      maxLife: 4.6,
      scale: 0.88 + Math.random() * 0.18
    });
    if (this.__phase5Remnants.length > 12) this.__phase5Remnants.shift();
    return result;
  };

  const originalUpdate = DamageFeedbackRenderer.prototype.update;
  DamageFeedbackRenderer.prototype.update = function phase5DamageUpdate(dt) {
    const result = originalUpdate.call(this, dt);
    if (this.__phase5Remnants) {
      for (const remnant of this.__phase5Remnants) remnant.life -= dt;
      this.__phase5Remnants = this.__phase5Remnants.filter((remnant) => remnant.life > 0);
    }
    return result;
  };

  const originalDrawWorld = DamageFeedbackRenderer.prototype.drawWorld;
  DamageFeedbackRenderer.prototype.drawWorld = function phase5DamageDrawWorld() {
    originalDrawWorld.call(this);
    const remnants = this.__phase5Remnants || [];
    const ctx = this.ctx;
    ctx.save();
    for (const remnant of remnants) {
      const fade = Math.min(1, remnant.life / 0.65);
      ctx.save();
      ctx.translate(remnant.x, remnant.y);
      ctx.rotate(remnant.angle + Math.PI * 0.5);
      ctx.scale(remnant.scale, remnant.scale);
      ctx.globalAlpha = 0.68 * fade;
      ctx.fillStyle = 'rgba(2,8,12,.55)';
      ctx.beginPath();
      ctx.ellipse(4, 5, 25, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.72 * fade;
      ctx.fillStyle = remnant.team === 'red' ? '#7d3947' : '#2f6479';
      ctx.beginPath();
      ctx.roundRect(-13, -22, 26, 38, 8);
      ctx.fill();
      ctx.fillStyle = remnant.team === 'red' ? '#b65163' : '#4086a0';
      ctx.beginPath();
      ctx.arc(0, -24, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(223,239,246,.16)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-9, 11);
      ctx.lineTo(-18, 28);
      ctx.moveTo(9, 11);
      ctx.lineTo(18, 28);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  };

  Object.defineProperty(DamageFeedbackRenderer.prototype, '__phase5Installed', { value: true });
}

function installMuzzleVfx() {
  if (WeaponRenderer.prototype.__phase5Installed) return;
  const originalMuzzle = WeaponRenderer.prototype.drawMuzzleFlash;
  WeaponRenderer.prototype.drawMuzzleFlash = function phase5Muzzle(player, manager) {
    originalMuzzle.call(this, player, manager);
    if (manager.fireVisualTimer <= 0) return;
    const weapon = manager.currentWeapon();
    if (!weapon || weapon.kind === 'melee') return;
    const ctx = this.ctx;
    const muzzle = manager.muzzleWorldPosition();
    const angle = player.visualAimAngle;
    const alpha = Math.min(1, manager.fireVisualTimer / 0.045);
    const heavy = ['sniper', 'shotgun', 'lmg', 'launcher'].includes(weapon.id);
    const radius = heavy ? 24 : 17;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(muzzle.x, muzzle.y, 0, muzzle.x, muzzle.y, radius);
    glow.addColorStop(0, `rgba(255,250,214,${0.72 * alpha})`);
    glow.addColorStop(0.35, `rgba(255,187,70,${0.48 * alpha})`);
    glow.addColorStop(1, 'rgba(255,119,32,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(muzzle.x, muzzle.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.translate(muzzle.x, muzzle.y);
    ctx.rotate(angle);
    ctx.globalAlpha = 0.7 * alpha;
    ctx.strokeStyle = '#fff3bf';
    ctx.lineWidth = heavy ? 2.4 : 1.6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(heavy ? 34 : 25, 0);
    ctx.stroke();
    ctx.restore();
  };
  Object.defineProperty(WeaponRenderer.prototype, '__phase5Installed', { value: true });
}

ensureStyle('ui-phase5.css');
document.body.classList.add('ui-phase5');
installCombatVfx();
installDeathVfx();
installMuzzleVfx();
