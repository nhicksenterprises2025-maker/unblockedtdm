import { WEAPON_LIST, formatWeaponStats } from '../data/weapons.js';
import { spreadVisualHtml, statBarsHtml, weaponModelSvg } from './WeaponPresentation.js';

function weaponDescription(weapon) {
  if (weapon.id === 'sniper') return 'Physical high-speed projectile with no piercing. Built around long sightlines and high single-target burst.';
  if (weapon.id === 'shotgun') return 'Eight-pellet close-range blast with shell-by-shell reload. Full damage ends at 2.0 tiles, falls off through 2.5 tiles, then deals no damage.';
  if (weapon.id === 'launcher') return 'Explosive projectile with a 2.5-tile blast radius, full self-damage, zero friendly fire and no splash falloff.';
  if (weapon.id === 'melee') return 'Two-tile melee reach with no lunge. Fastest movement modifier and no ammunition requirement.';
  if (weapon.id === 'pistol') return 'Semi-auto sidearm. Every discrete trigger press fires one round with quick handling and neutral movement.';
  if (weapon.id === 'lmg') return 'Heavy 75-round primary with strong damage, long reload and substantial movement cost.';
  if (weapon.id === 'smg') return 'Fast automatic primary for close-range pressure, quick handling and neutral movement.';
  return 'Balanced automatic rifle with predictable spread, medium-range falloff and moderate handling penalties.';
}

function weaponRole(weapon) {
  if (weapon.id === 'assault-rifle') return 'VERSATILE PRIMARY';
  if (weapon.id === 'smg') return 'CLOSE-RANGE PRIMARY';
  if (weapon.id === 'sniper') return 'LONG-RANGE PRIMARY';
  if (weapon.id === 'shotgun') return 'CLOSE-RANGE FLEX';
  if (weapon.id === 'lmg') return 'HEAVY PRIMARY';
  if (weapon.id === 'pistol') return 'QUICK-HANDLING SECONDARY';
  if (weapon.id === 'launcher') return 'EXPLOSIVE SECONDARY';
  return 'MOBILITY SECONDARY';
}

function weaponCatalogCard(weapon, index) {
  const stats = formatWeaponStats(weapon);
  const slot = weapon.slot === 'both' ? 'PRIMARY / SECONDARY' : weapon.slot.toUpperCase();
  return `
    <article class="ui2211-weapon-card" data-catalog-weapon="${weapon.id}">
      <header class="ui2211-weapon-card-head">
        <div>
          <span class="ui2211-weapon-index">${String(index + 1).padStart(2, '0')} · ${slot}</span>
          <h3>${weapon.name}</h3>
          <small>${weaponRole(weapon)} · ${weapon.kind.toUpperCase()} · SWAP T${weapon.swapTier}</small>
        </div>
        <b>${weapon.shortName}</b>
      </header>
      <div class="ui2211-weapon-model">${weaponModelSvg(weapon)}</div>
      <p class="ui2211-weapon-description">${weaponDescription(weapon)}</p>
      ${statBarsHtml(weapon)}
      ${spreadVisualHtml(weapon)}
      <div class="ui2211-exact-stats">
        ${stats.map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join('')}
      </div>
    </article>`;
}

export class MainMenu {
  constructor(root, { onPlay, onLoadouts, onQuit } = {}) {
    this.root = root;
    this.onPlay = onPlay;
    this.onLoadouts = onLoadouts;
    this.onQuit = onQuit;
    this.view = 'home';
    this.previewWeapon = WEAPON_LIST[0]; // historical compatibility; 2.21.1 renders the full catalog instead.
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

      // Retained for compatibility with historical UI hooks. The live 2.21.1
      // Weapon Info page is an all-weapons catalog and does not require selection.
      const weaponButton = event.target.closest('[data-weapon-info]');
      if (weaponButton) {
        const weapon = WEAPON_LIST.find((entry) => entry.id === weaponButton.dataset.weaponInfo);
        if (weapon) this.previewWeapon = weapon;
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
    const view = this.root.querySelector('[data-menu-view="weapon-info"]');
    const layout = view?.querySelector('.weapon-info-layout');
    if (!view || !layout) return;

    layout.classList.add('ui2211-catalog-layout');
    layout.innerHTML = `
      <div class="ui2211-weapon-catalog" data-weapon-info-catalog>
        ${WEAPON_LIST.map(weaponCatalogCard).join('')}
      </div>`;
  }
}
