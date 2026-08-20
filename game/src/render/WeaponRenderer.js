const SKIN = '#dfb293';
const SKIN_DARK = '#9b7157';
const MOUNT_SIDE = 12.5;
const ADS_SIDE_SHIFT = 2.5;

export class WeaponRenderer {
  constructor(ctx) { this.ctx = ctx; }

  draw(player, manager) {
    if (!player.health.alive || !manager.currentWeapon()) return;
    const state = manager.animationState();
    const ctx = this.ctx;
    const angle = player.visualAimAngle;
    const adsShift = state.ads * 4;
    const sideShift = MOUNT_SIDE - state.ads * ADS_SIDE_SHIFT;
    const kick = state.fireKick * 3;
    const reload = state.reloading ? state.reloadProgress : 0;
    const reloadTilt = state.reloading ? Math.sin(Math.PI * reload) * 0.55 : 0;
    const switchDrop = state.switching ? Math.sin(Math.PI * state.switchProgress) * 11 : 0;

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(angle + reloadTilt);
    ctx.translate(4 + adsShift - kick, sideShift + switchDrop);

    // Shoulder stock. The rifle is offset from the head centerline so it reads
    // as a shouldered weapon instead of a weapon mounted over the head.
    ctx.fillStyle = '#223640';
    ctx.beginPath();
    ctx.roundRect(-17, -5.5, 20, 11, 5);
    ctx.fill();
    ctx.strokeStyle = '#122833';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Receiver.
    ctx.fillStyle = '#39515d';
    ctx.beginPath();
    ctx.roundRect(0, -6, 25, 12, 3);
    ctx.fill();
    ctx.strokeStyle = '#132934';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Upper rail / rear sight.
    ctx.fillStyle = '#172b36';
    ctx.fillRect(5, -8, 13, 2.5);
    ctx.fillRect(9, -11, 5, 3);

    // Magazine animation.
    const magPhase = reload < 0.5 ? reload / 0.5 : (1 - reload) / 0.5;
    const magDrop = state.reloading ? magPhase * 17 : 0;
    ctx.save();
    ctx.translate(8, 5 + magDrop);
    ctx.rotate(0.22 + magPhase * 0.18);
    ctx.fillStyle = '#1b303a';
    ctx.beginPath();
    ctx.roundRect(-3, 0, 9, 15, 2);
    ctx.fill();
    ctx.strokeStyle = '#10232c';
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.restore();

    // Handguard and barrel.
    ctx.fillStyle = '#476571';
    ctx.beginPath();
    ctx.roundRect(23, -4.5, 19, 9, 2.5);
    ctx.fill();
    ctx.fillStyle = '#172a34';
    ctx.fillRect(40, -2, 17, 4);
    ctx.fillStyle = '#101f27';
    ctx.fillRect(56, -1.5, 7, 3);

    // Small team-accent receiver strip.
    ctx.fillStyle = '#72d3f2';
    ctx.fillRect(2, -2, 9, 2);

    // Visible grip hands make the weapon read as actually held. During reload,
    // the support hand follows the magazine instead of floating on the handguard.
    this.drawHands(ctx, state, magPhase);
    ctx.restore();
  }

  drawHands(ctx, state, magPhase) {
    const triggerX = 9;
    const triggerY = 5.3;
    const supportX = state.reloading ? 12 : 31;
    const supportY = state.reloading ? 8 + magPhase * 10 : 4.6;

    ctx.fillStyle = SKIN_DARK;
    ctx.beginPath();
    ctx.arc(triggerX, triggerY, 4.4, 0, Math.PI * 2);
    ctx.arc(supportX, supportY, 4.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = SKIN;
    ctx.beginPath();
    ctx.arc(triggerX - 0.6, triggerY - 0.5, 3.5, 0, Math.PI * 2);
    ctx.arc(supportX - 0.6, supportY - 0.5, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  drawMuzzleFlash(player, manager) {
    if (manager.fireVisualTimer <= 0) return;
    const ctx = this.ctx;
    const a = player.visualAimAngle;
    const muzzle = manager.muzzleWorldPosition();
    ctx.save();
    ctx.translate(muzzle.x, muzzle.y);
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
