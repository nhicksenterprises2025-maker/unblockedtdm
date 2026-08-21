import { WEAPON_LIST, formatWeaponStats } from '../data/weapons.js';

function weaponDescription(weapon) {
  if (weapon.id === 'sniper') return 'Physical high-speed projectile with no piercing. Built around long sightlines and high single-target burst.';
  if (weapon.id === 'shotgun') return 'Eight-pellet blast with shell-by-shell reload. Strongest when closing distance and controlling corners.';
  if (weapon.id === 'launcher') return 'Explosive projectile with a 2.5-tile blast radius, full self-damage, zero friendly fire and no splash falloff.';
  if (weapon.id === 'melee') return 'Two-tile melee reach with no lunge. Fastest movement modifier and no ammunition requirement.';
  if (weapon.id === 'pistol') return 'Semi-auto sidearm. Every discrete trigger press fires one round with quick handling and neutral movement.';
  if (weapon.id === 'lmg') return 'Heavy 75-round primary with strong damage, long reload and substantial movement cost.';
  if (weapon.id === 'smg') return 'Fast automatic primary for close-range pressure, quick handling and neutral movement.';
  return 'Balanced automatic rifle with predictable spread, medium-range falloff and moderate handling penalties.';
}

function clamp01(value) { return Math.max(0, Math.min(1, value)); }
function percent(value, max) { return Math.round(clamp01(value / max) * 100); }

function visualBars(weapon) {
  const fireRate = weapon.fireInterval > 0 ? 1 / weapon.fireInterval : 7.5;
  const range = Number.isFinite(weapon.fullDamageRangeTiles) ? weapon.fullDamageRangeTiles : 25;
  const handling = 1 / Math.max(weapon.swapTime || 0.45, 0.2);
  const rows = [
    ['DAMAGE', weapon.kind === 'shotgun' ? weapon.damage * weapon.pelletCount : weapon.damage, percent(weapon.kind === 'shotgun' ? weapon.damage * weapon.pelletCount : weapon.damage, 200)],
    ['FIRE RATE', fireRate, percent(fireRate, 7.5)],
    ['RANGE', range, percent(range, 25)],
    ['MOBILITY', weapon.movementMultiplier, percent(weapon.movementMultiplier, 1.05)],
    ['HANDLING', handling, percent(handling, 2.3)]
  ];
  return rows.map(([label, value, width]) => `
    <div class="weapon-visual-bar">
      <div><span>${label}</span><small>${label === 'FIRE RATE' ? `${value.toFixed(2)} shots/s` : label === 'RANGE' ? `${value} tiles` : label === 'MOBILITY' ? `${Math.round(value * 100)}% move` : label === 'HANDLING' ? `${weapon.swapTime}s swap` : `${value}`}</small></div>
      <i><b style="width:${width}%"></b></i>
    </div>`).join('');
}

function spreadVisualizer(weapon) {
  if (weapon.baseSpreadDegrees <= 0) {
    return `<div class="spread-visualizer no-spread"><div class="spread-field"><i></i></div><div><strong>NO RANDOM SPREAD</strong><span>${weapon.kind === 'melee' ? 'Melee attack' : 'Projectile travels on the aim line'}</span></div></div>`;
  }
  const ads = weapon.baseSpreadDegrees * weapon.adsSpreadMultiplier;
  const stationary = weapon.baseSpreadDegrees * weapon.stationarySpreadMultiplier;
  const width = Math.max(14, Math.min(94, weapon.movingSpreadDegrees * 8));
  return `
    <div class="spread-visualizer">
      <div class="spread-field" style="--spread-width:${width}%"><i></i><b></b></div>
      <div class="spread-copy">
        <strong>SPREAD CONE</strong>
        <span>Base ${weapon.baseSpreadDegrees.toFixed(2)}° · Moving ${weapon.movingSpreadDegrees.toFixed(2)}°</span>
        <span>Stationary ${stationary.toFixed(2)}° · ADS ${ads.toFixed(2)}°</span>
      </div>
    </div>`;
}

export class MainMenu {
  constructor(root, { onPlay, onLoadouts, onQuit } = {}) {
    this.root = root;
    this.onPlay = onPlay;
    this.onLoadouts = onLoadouts;
    this.onQuit = onQuit;
    this.view = 'home';
    this.previewWeapon = WEAPON_LIST[0];
    this.bindEvents();
    this.renderWeaponInfo();
    this.show('home');
  }

  bindEvents() {
    this.root.addEventListener('click', (event) => {
      const actionButton = event.target.closest('[data-menu-action]');
      if (actionButton) {
        const action = actionButton.dataset.menuAction;
        if (action === 'play') this.onPlay?.();
        else if (action === 'loadouts') this.onLoadouts?.();
        else if (action === 'quit') this.onQuit?.();
        else this.show(action);
        return;
      }

      const weaponButton = event.target.closest('[data-weapon-info]');
      if (weaponButton) {
        const weapon = WEAPON_LIST.find((entry) => entry.id === weaponButton.dataset.weaponInfo);
        if (weapon) {
          this.previewWeapon = weapon;
          this.renderWeaponInfo();
        }
      }
    });
  }

  show(view = 'home') {
    this.view = ['home', 'settings', 'weapon-info'].includes(view) ? view : 'home';
    this.root.classList.add('visible');
    for (const panel of this.root.querySelectorAll('[data-menu-view]')) panel.classList.toggle('active', panel.dataset.menuView === this.view);
    for (const button of this.root.querySelectorAll('[data-menu-nav]')) button.classList.toggle('active', button.dataset.menuNav === this.view);
  }

  hide() {
    this.root.classList.remove('visible');
  }

  renderWeaponInfo() {
    const list = this.root.querySelector('[data-weapon-info-list]');
    const detail = this.root.querySelector('[data-weapon-info-detail]');
    if (!list || !detail) return;

    list.innerHTML = WEAPON_LIST.map((weapon) => `
      <button type="button" data-weapon-info="${weapon.id}" class="${weapon.id === this.previewWeapon.id ? 'active' : ''}">
        <span>${weapon.slot === 'both' ? 'PRIMARY / SECONDARY' : weapon.slot.toUpperCase()}</span>
        <strong>${weapon.name}</strong>
        <small>${weapon.kind.toUpperCase()} · SWAP T${weapon.swapTier}</small>
      </button>`).join('');

    const stats = formatWeaponStats(this.previewWeapon);
    detail.innerHTML = `
      <div class="weapon-info-heading">
        <div><span>CANONICAL WEAPON DATA</span><h2>${this.previewWeapon.name}</h2></div>
        <b>${this.previewWeapon.shortName}</b>
      </div>
      <p>${weaponDescription(this.previewWeapon)}</p>
      <div class="weapon-info-viz">
        <section><small>RELATIVE VISUAL SCALE · EXACT VALUES SHOWN</small>${visualBars(this.previewWeapon)}</section>
        ${spreadVisualizer(this.previewWeapon)}
      </div>
      <div class="weapon-info-stats">${stats.map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join('')}</div>`;
  }
}
