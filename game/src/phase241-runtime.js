import './phase2431-runtime.js';
import './phase2432-runtime.js';
import './phase2433-runtime.js';
import { WEAPON_LIST } from './data/weapons.js';
import { lowAmmoState } from './combat/AmmoState.js';
import { MatchManager } from './match/MatchManager.js';
import { WeaponRenderer } from './render/WeaponRenderer.js';
import { hydrateWeaponModelCanvases } from './ui/WeaponPresentation.js';

function ensureStyle(href) {
  if ([...document.querySelectorAll('link[rel="stylesheet"]')].some((link) => link.getAttribute('href') === href)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

function drawPumpShotgun(ctx, state, reload) {
  const pumpSlide = Math.max(0, Math.min(5, (state?.fireKick || 0) * 1.2));
  const receiverGradient = ctx.createLinearGradient(-2,-6,-2,6);
  receiverGradient.addColorStop(0,'#71858d');
  receiverGradient.addColorStop(.45,'#3f5862');
  receiverGradient.addColorStop(1,'#223840');

  // Full walnut stock with cheek line and a hard rubber butt plate.
  ctx.fillStyle = '#513824'; ctx.strokeStyle = '#102732'; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(-22,-6); ctx.lineTo(-8,-5); ctx.lineTo(2,-3.5); ctx.lineTo(2,3.5); ctx.lineTo(-8,5); ctx.lineTo(-22,8); ctx.lineTo(-27,4); ctx.lineTo(-27,-4); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#172a31';ctx.beginPath();ctx.roundRect(-29,-5,4,10,1.5);ctx.fill();ctx.stroke();
  ctx.strokeStyle='rgba(204,151,91,.48)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-20,-3.8);ctx.quadraticCurveTo(-8,-3,0,-1.8);ctx.stroke();

  // Receiver, loading port, safety and action pins remain readable at HUD scale.
  ctx.fillStyle = receiverGradient; ctx.beginPath(); ctx.roundRect(-2,-6,27,12,3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#152831'; ctx.beginPath(); ctx.roundRect(8,-4.2,10,4.3,1.4); ctx.fill();
  ctx.fillStyle='#9fadb2';ctx.fillRect(9,-3.45,6,.75);
  ctx.fillStyle = '#9aaab2'; ctx.fillRect(2,-1,7,2);
  for(const x of [1.5,21.5]){ctx.fillStyle='#102732';ctx.beginPath();ctx.arc(x,3.4,1.2,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(215,229,233,.35)';ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(x-.6,3.4);ctx.lineTo(x+.6,3.4);ctx.stroke();}

  ctx.strokeStyle = '#162931'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(7,6.1,6,4,0,0,Math.PI*2); ctx.stroke();
  ctx.fillStyle = '#44301f'; ctx.beginPath(); ctx.roundRect(2,6,8,12,2); ctx.fill();
  ctx.strokeStyle='rgba(199,145,82,.4)';ctx.lineWidth=.8;for(let y=9;y<17;y+=3){ctx.beginPath();ctx.moveTo(3,y);ctx.lineTo(9,y-1);ctx.stroke();}

  const pumpX = 27 - pumpSlide;
  ctx.fillStyle = '#8c6238'; ctx.strokeStyle = '#5a3c22'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.roundRect(pumpX,-6.2,20,12.4,3); ctx.fill(); ctx.stroke();
  ctx.strokeStyle='rgba(221,171,105,.4)';ctx.beginPath();ctx.moveTo(pumpX+3,-4.5);ctx.lineTo(pumpX+17,-4.5);ctx.stroke();
  ctx.strokeStyle = 'rgba(45,28,17,.7)'; ctx.lineWidth = 1;
  for (let x=pumpX+4; x<pumpX+18; x+=4) { ctx.beginPath(); ctx.moveTo(x,-4.5); ctx.lineTo(x,4.5); ctx.stroke(); }

  ctx.fillStyle = '#172a32'; ctx.fillRect(44,-3.4,25,3.4);
  ctx.fillStyle = '#263e47'; ctx.fillRect(44,1.1,21,3.1);
  ctx.fillStyle='rgba(170,193,201,.38)';ctx.fillRect(46,1.5,17,.7);
  ctx.fillStyle = '#0d1d24'; ctx.fillRect(68,-3.1,4,2.8);
  ctx.fillStyle='#6e858e';ctx.fillRect(68,-3.8,1.2,4.2);ctx.fillRect(71,-3.4,1,3.4);
  ctx.fillStyle = '#76c9e6'; ctx.fillRect(63,-4.3,1.5,1.5);

  if (state?.reloading) {
    const shellY = 10 + Math.sin(reload * Math.PI) * 6;
    const shellX = 10 + Math.sin(reload*Math.PI*2)*2;
    ctx.save();ctx.translate(shellX,shellY);ctx.rotate(-.12+reload*.22);
    ctx.fillStyle = '#d84a37';ctx.strokeStyle='#652720';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(0,0,10,4.5,2);ctx.fill();ctx.stroke();
    ctx.fillStyle = '#d7b15b'; ctx.fillRect(8,0,2,4.5);ctx.restore();
  }
}

WeaponRenderer.prototype.drawShotgun = function drawShotgun241(ctx, state, reload) {
  drawPumpShotgun(ctx, state, reload);
};

if (!MatchManager.prototype.__ui241DisplayNames) {
  MatchManager.prototype.__ui241DisplayNames = true;
  const originalStatsSnapshot = MatchManager.prototype.statsSnapshot;
  MatchManager.prototype.statsSnapshot = function statsSnapshot241(...args) {
    const names = new Map(this.players.map((player) => [player.id, player.displayName]));
    return originalStatsSnapshot.apply(this, args).map((row) => ({ ...row, displayName: names.get(row.id) || row.displayName || null }));
  };
}

const WEAPON_BY_NAME = new Map(WEAPON_LIST.map((weapon) => [weapon.name.toUpperCase(), weapon]));

function syncLowAmmoHud() {
  const root = document.getElementById('weaponRoot');
  if (!root) return;
  if (!document.body.classList.contains('match-started')) {
    root.classList.remove('low-ammo');
    return;
  }
  const weaponName = document.getElementById('weaponName')?.textContent?.trim()?.toUpperCase();
  const magazineText = document.getElementById('ammoMagazine')?.textContent?.trim();
  const weapon = WEAPON_BY_NAME.get(weaponName);
  const magazine = Number(magazineText);
  const state = lowAmmoState(weapon, { magazine: Number.isFinite(magazine) ? magazine : 0 });
  root.classList.toggle('low-ammo', state.active);
  root.dataset.lowAmmoProgress = state.active ? state.progress.toFixed(3) : '';
}

ensureStyle('ui-2.4.1.css');
ensureStyle('ui-2.4.1.2.css');
ensureStyle('ui-2.4.2.1.css');
ensureStyle('ui-2.4.3.3.css');
document.body.classList.add('ui-241', 'ui-2412', 'ui-2421');
hydrateWeaponModelCanvases(document);
syncLowAmmoHud();

const lowAmmoTimer = window.setInterval(syncLowAmmoHud, 50);
window.addEventListener('beforeunload', () => window.clearInterval(lowAmmoTimer), { once:true });
window.addEventListener('skirmish:menu-view-change', () => requestAnimationFrame(() => hydrateWeaponModelCanvases(document)));
