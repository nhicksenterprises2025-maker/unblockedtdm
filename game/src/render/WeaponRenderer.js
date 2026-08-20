export class WeaponRenderer {
  constructor(ctx) { this.ctx = ctx; }

  draw(player, manager) {
    if (!player.health.alive || !manager.currentWeapon()) return;
    const state = manager.animationState();
    const ctx = this.ctx;
    const angle = player.visualAimAngle;
    const adsShift = state.ads * 4;
    const kick = state.fireKick * 3;
    const reload = state.reloading ? state.reloadProgress : 0;
    const reloadTilt = state.reloading ? Math.sin(Math.PI * reload) * 0.55 : 0;
    const switchDrop = state.switching ? Math.sin(Math.PI * state.switchProgress) * 11 : 0;

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(angle + reloadTilt);
    ctx.translate(4 + adsShift - kick, switchDrop);

    ctx.fillStyle = '#263944';
    ctx.beginPath();
    ctx.roundRect(-14, -5, 17, 10, 4);
    ctx.fill();

    ctx.fillStyle = '#334b58';
    ctx.beginPath();
    ctx.roundRect(0, -6, 25, 12, 3);
    ctx.fill();
    ctx.strokeStyle = '#132934';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#172b36';
    ctx.fillRect(5, -8, 13, 2.5);
    ctx.fillRect(9, -11, 5, 3);

    const magPhase = reload < 0.5 ? reload / 0.5 : (1 - reload) / 0.5;
    const magDrop = state.reloading ? magPhase * 17 : 0;
    ctx.save();
    ctx.translate(8, 5 + magDrop);
    ctx.rotate(0.22 + magPhase * 0.18);
    ctx.fillStyle = '#1b303a';
    ctx.beginPath();
    ctx.roundRect(-3, 0, 9, 15, 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#405f6b';
    ctx.beginPath();
    ctx.roundRect(23, -4.5, 19, 9, 2.5);
    ctx.fill();
    ctx.fillStyle = '#172a34';
    ctx.fillRect(40, -2, 17, 4);
    ctx.fillStyle = '#101f27';
    ctx.fillRect(56, -1.5, 7, 3);

    ctx.fillStyle = '#72d3f2';
    ctx.fillRect(2, -2, 9, 2);
    ctx.restore();
  }

  drawMuzzleFlash(player, manager) {
    if (manager.fireVisualTimer <= 0) return;
    const ctx = this.ctx;
    const a = player.visualAimAngle;
    const x = player.x + Math.cos(a) * 67;
    const y = player.y + Math.sin(a) * 67;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.globalAlpha = Math.min(1, manager.fireVisualTimer / 0.04);
    ctx.fillStyle = '#fff3b3';
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(16, -5); ctx.lineTo(10, 0); ctx.lineTo(16, 5); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffb83f';
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(10,-2.2); ctx.lineTo(7,0); ctx.lineTo(10,2.2); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}
