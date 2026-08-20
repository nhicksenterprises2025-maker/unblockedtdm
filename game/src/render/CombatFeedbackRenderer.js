export class CombatFeedbackRenderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.tracers = [];
    this.impacts = [];
    this.damageNumbers = [];
    this.hitmarkerTimer = 0;
    this.hitmarkerCrit = false;
  }

  spawnShot({ muzzle, end, hit, crit }) {
    this.tracers.push({ start: { ...muzzle }, end: { ...end }, life: 0.075, maxLife: 0.075 });
    this.impacts.push({ x: end.x, y: end.y, life: 0.12, maxLife: 0.12, hit, crit });
  }

  spawnHit({ point, damage, crit }) {
    this.damageNumbers.push({ x: point.x, y: point.y - 8, damage: Math.round(damage), crit, life: 0.75, maxLife: 0.75 });
    this.hitmarkerTimer = crit ? 0.16 : 0.11;
    this.hitmarkerCrit = crit;
  }

  update(dt) {
    this.hitmarkerTimer = Math.max(0, this.hitmarkerTimer - dt);
    for (const item of [...this.tracers, ...this.impacts, ...this.damageNumbers]) item.life -= dt;
    for (const number of this.damageNumbers) number.y -= 27 * dt;
    this.tracers = this.tracers.filter((item) => item.life > 0);
    this.impacts = this.impacts.filter((item) => item.life > 0);
    this.damageNumbers = this.damageNumbers.filter((item) => item.life > 0);
  }

  drawWorld() {
    const ctx = this.ctx;
    ctx.save();
    ctx.lineCap = 'round';
    for (const tracer of this.tracers) {
      ctx.globalAlpha = tracer.life / tracer.maxLife;
      ctx.strokeStyle = '#eaf7ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(tracer.start.x, tracer.start.y);
      ctx.lineTo(tracer.end.x, tracer.end.y);
      ctx.stroke();
    }
    for (const impact of this.impacts) {
      const alpha = impact.life / impact.maxLife;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = impact.hit ? (impact.crit ? '#ffe577' : '#b8f4ff') : '#d1dde3';
      ctx.lineWidth = impact.crit ? 3 : 2;
      ctx.beginPath();
      ctx.arc(impact.x, impact.y, 3 + (1 - alpha) * 5, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const number of this.damageNumbers) {
      const alpha = Math.min(1, number.life / 0.22);
      ctx.globalAlpha = alpha;
      ctx.font = number.crit ? '900 18px ui-monospace, monospace' : '900 14px ui-monospace, monospace';
      ctx.fillStyle = number.crit ? '#ffe45f' : '#f4fbff';
      ctx.strokeStyle = 'rgba(4,12,18,.88)';
      ctx.lineWidth = 4;
      ctx.strokeText(`${number.damage}`, number.x, number.y);
      ctx.fillText(`${number.damage}`, number.x, number.y);
    }
    ctx.restore();
  }

  drawCrosshair(pointer, weaponManager) {
    const ctx = this.ctx;
    const spread = weaponManager.currentSpreadDegrees();
    const gap = 7 + spread * 2.2;
    const len = weaponManager.isFullyADS() ? 7 : 8;
    const x = pointer.x;
    const y = pointer.y;
    ctx.save();
    ctx.strokeStyle = 'rgba(239,249,255,.94)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (const [x1,y1,x2,y2] of [
      [x-gap-len,y,x-gap,y],[x+gap,y,x+gap+len,y],[x,y-gap-len,x,y-gap],[x,y+gap,x,y+gap+len]
    ]) {
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    }
    ctx.restore();
  }

  drawHitmarker(pointer) {
    if (this.hitmarkerTimer <= 0) return;
    const ctx = this.ctx;
    const x = pointer.x;
    const y = pointer.y;
    const alpha = Math.min(1, this.hitmarkerTimer / 0.08);
    const inner = this.hitmarkerCrit ? 7 : 6;
    const outer = this.hitmarkerCrit ? 15 : 13;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = this.hitmarkerCrit ? '#ffe45f' : '#ffffff';
    ctx.lineWidth = this.hitmarkerCrit ? 3 : 2;
    for (const sx of [-1,1]) for (const sy of [-1,1]) {
      ctx.beginPath();
      ctx.moveTo(x + sx * inner, y + sy * inner);
      ctx.lineTo(x + sx * outer, y + sy * outer);
      ctx.stroke();
    }
    ctx.restore();
  }
}
