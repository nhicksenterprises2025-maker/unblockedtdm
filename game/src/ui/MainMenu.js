import { WEAPON_LIST, formatWeaponStats } from '../data/weapons.js';
import { spreadVisualHtml, statBarsHtml, weaponModelSvg } from './WeaponPresentation.js';

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

    window.addEventListener('skirmish:show-menu-home', () => this.show('home'));
  }

  show(view = 'home') {
    this.view = ['home', 'settings', 'weapon-info', 'career'].includes(view) ? view : 'home';
    this.root.classList.add('visible');
    for (const panel of this.root.querySelectorAll('[data-menu-view]')) panel.classList.toggle('active', panel.dataset.menuView === this.view);
    for (const button of this.root.querySelectorAll('[data-menu-nav]')) button.classList.toggle('active', button.dataset.menuNav === this.view);
    window.dispatchEvent(new CustomEvent('skirmish:menu-view-change', { detail:{ view:this.view } }));
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
      <div class="phase2-weapon-stage">${weaponModelSvg(this.previewWeapon)}</div>
      <p>${weaponDescription(this.previewWeapon)}</p>
      ${statBarsHtml(this.previewWeapon)}
      ${spreadVisualHtml(this.previewWeapon)}
      <div class="weapon-info-stats">${stats.map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join('')}</div>`;
  }
}
