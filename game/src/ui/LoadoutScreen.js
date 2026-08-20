import { PRIMARY_WEAPONS, SECONDARY_WEAPONS, formatWeaponStats } from '../data/weapons.js';

export class LoadoutScreen {
  constructor(root, store, onDeploy) {
    this.root = root;
    this.store = store;
    this.onDeploy = onDeploy;
    const active = this.store.get();
    this.selectedIndex = active.index;
    this.selection = { primary: active.primary, secondary: active.secondary };
    this.activeSlot = 'primary';
    this.previewWeapon = this.selection.primary;
    this.message = '25 loadout slots save automatically when you equip a weapon.';
    this.render();
  }

  weaponsFor(slot) { return slot === 'primary' ? PRIMARY_WEAPONS : SECONDARY_WEAPONS; }

  loadSavedSlot(index) {
    const saved = this.store.setActive(index);
    this.selectedIndex = saved.index;
    this.selection = { primary: saved.primary, secondary: saved.secondary };
    this.previewWeapon = this.selection[this.activeSlot];
    this.message = `${saved.name} selected.`;
    this.render();
  }

  setSlot(slot) {
    this.activeSlot = slot;
    this.previewWeapon = this.selection[slot] || this.weaponsFor(slot)[0];
    this.message = `${slot.toUpperCase()} slot active.`;
    this.render();
  }

  preview(weapon) {
    this.previewWeapon = weapon;
    this.render();
  }

  persistSelection() {
    const current = this.store.get(this.selectedIndex);
    return this.store.save(this.selectedIndex, {
      name: current.name,
      primary: this.selection.primary,
      secondary: this.selection.secondary
    });
  }

  select(weapon) {
    const otherSlot = this.activeSlot === 'primary' ? 'secondary' : 'primary';
    if (this.selection[otherSlot]?.id === weapon.id) {
      this.message = 'That exact weapon is already equipped in the other slot.';
      this.render();
      return false;
    }
    this.selection[this.activeSlot] = weapon;
    this.previewWeapon = weapon;
    const saved = this.persistSelection();
    this.message = `${weapon.name} saved to ${saved.name} as ${this.activeSlot.toUpperCase()}.`;
    this.render();
    return true;
  }

  renameCurrent(name) {
    const saved = this.store.rename(this.selectedIndex, name);
    this.message = `Saved as ${saved.name}.`;
    this.render();
  }

  resetCurrent() {
    const saved = this.store.resetSlot(this.selectedIndex);
    this.selection = { primary: saved.primary, secondary: saved.secondary };
    this.previewWeapon = this.selection[this.activeSlot];
    this.message = `${saved.name} reset to AR + Pistol.`;
    this.render();
  }

  deploy() {
    if (!this.selection.primary || !this.selection.secondary) {
      this.message = 'Choose both a PRIMARY and SECONDARY weapon first.';
      this.render();
      return;
    }
    const saved = this.persistSelection();
    this.root.classList.add('hidden');
    this.onDeploy?.({ primary: saved.primary, secondary: saved.secondary, slotIndex: saved.index, name: saved.name });
  }

  render() {
    const weapon = this.previewWeapon;
    const stats = formatWeaponStats(weapon);
    const list = this.weaponsFor(this.activeSlot);
    const otherSlot = this.activeSlot === 'primary' ? 'secondary' : 'primary';
    const selectedHere = this.selection[this.activeSlot]?.id === weapon.id;
    const blockedPreview = this.selection[otherSlot]?.id === weapon.id;
    const savedSlots = this.store.all();
    const current = savedSlots[this.selectedIndex];

    this.root.innerHTML = `
      <div class="loadout-shell loadout-shell-v15">
        <div class="loadout-head">
          <div><span class="eyebrow">UNBLOCKEDTDM · BUILD 1.5</span><h1>LOADOUTS</h1><p>Choose one of 25 persistent slots, edit its weapons, then deploy.</p></div>
          <div class="selected-summary"><span>PRIMARY <b>${this.selection.primary?.name || '—'}</b></span><span>SECONDARY <b>${this.selection.secondary?.name || '—'}</b></span></div>
        </div>
        <div class="loadout-presets" aria-label="Saved loadouts">
          ${savedSlots.map((slot) => `<button type="button" data-loadout-index="${slot.index}" class="loadout-preset ${slot.index === this.selectedIndex ? 'active' : ''}" title="${slot.name}: ${slot.primary.shortName} + ${slot.secondary.shortName}"><b>${String(slot.index + 1).padStart(2, '0')}</b><span>${slot.name}</span><small>${slot.primary.shortName} + ${slot.secondary.shortName}</small></button>`).join('')}
        </div>
        <div class="loadout-name-row">
          <label>ACTIVE SLOT <strong>${String(this.selectedIndex + 1).padStart(2, '0')}</strong></label>
          <input id="loadoutName" maxlength="24" value="${current.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')}" aria-label="Loadout name" />
          <button type="button" id="saveLoadoutName">SAVE NAME</button>
          <button type="button" id="resetLoadoutSlot" class="muted">RESET SLOT</button>
        </div>
        <div class="slot-tabs">
          <button type="button" data-slot="primary" class="${this.activeSlot === 'primary' ? 'active' : ''}">1 · PRIMARY</button>
          <button type="button" data-slot="secondary" class="${this.activeSlot === 'secondary' ? 'active' : ''}">2 · SECONDARY</button>
        </div>
        <div class="loadout-body">
          <div class="weapon-list">${list.map((item) => {
            const selected = this.selection[this.activeSlot]?.id === item.id;
            const blocked = this.selection[otherSlot]?.id === item.id;
            return `<button type="button" class="weapon-card ${selected ? 'selected' : ''} ${blocked ? 'blocked' : ''}" data-weapon="${item.id}" ${blocked ? 'disabled' : ''}>
              <span class="weapon-class">${item.kind.toUpperCase()}</span><strong>${item.name}</strong><small>${item.fireMode.toUpperCase()} · SWAP T${item.swapTier}</small>${selected ? '<i>EQUIPPED</i>' : '<i>CLICK TO EQUIP</i>'}
            </button>`;
          }).join('')}</div>
          <div class="weapon-detail">
            <div class="weapon-detail-title"><div><span>${this.activeSlot.toUpperCase()} WEAPON</span><h2>${weapon.name}</h2></div><b>${weapon.shortName}</b></div>
            <div class="stat-grid">${stats.map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join('')}</div>
            <div class="weapon-rule">${this.description(weapon)}</div>
            <button type="button" id="selectWeapon" class="select-weapon" ${blockedPreview ? 'disabled' : ''}>${selectedHere ? `EQUIPPED AS ${this.activeSlot.toUpperCase()}` : `SELECT ${weapon.name.toUpperCase()}`}</button>
            <div class="loadout-message">${this.message}</div>
          </div>
        </div>
        <div class="loadout-foot"><div><span>READY LOADOUT · SLOT ${String(this.selectedIndex + 1).padStart(2, '0')}</span><strong>${current.name} · ${this.selection.primary?.name || '—'} + ${this.selection.secondary?.name || '—'}</strong><small>During a round break you can switch instantly between any of these 25 saved slots.</small></div><button type="button" id="deployButton" class="deploy-button">START MATCH</button></div>
      </div>`;

    for (const button of this.root.querySelectorAll('[data-loadout-index]')) button.addEventListener('click', () => this.loadSavedSlot(Number(button.dataset.loadoutIndex)));
    for (const button of this.root.querySelectorAll('[data-slot]')) button.addEventListener('click', () => this.setSlot(button.dataset.slot));
    for (const button of this.root.querySelectorAll('[data-weapon]')) {
      button.addEventListener('mouseenter', () => {
        const item = list.find((entry) => entry.id === button.dataset.weapon);
        if (item && item !== this.previewWeapon) this.previewWeapon = item;
      });
      button.addEventListener('click', () => {
        const item = list.find((entry) => entry.id === button.dataset.weapon);
        if (item) this.select(item);
      });
    }
    this.root.querySelector('#selectWeapon')?.addEventListener('click', () => this.select(weapon));
    this.root.querySelector('#saveLoadoutName')?.addEventListener('click', () => this.renameCurrent(this.root.querySelector('#loadoutName')?.value));
    this.root.querySelector('#loadoutName')?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') this.renameCurrent(event.currentTarget.value);
    });
    this.root.querySelector('#resetLoadoutSlot')?.addEventListener('click', () => this.resetCurrent());
    this.root.querySelector('#deployButton')?.addEventListener('click', () => this.deploy());
  }

  description(weapon) {
    if (weapon.id === 'sniper') return 'Physical high-speed projectile. No piercing. Strongest single-target critical damage.';
    if (weapon.id === 'shotgun') return 'Eight-pellet circular spread. One critical roll controls the entire blast. Shell-by-shell reload can be interrupted to fire.';
    if (weapon.id === 'launcher') return 'Physical explosive projectile. 2.5-tile blast radius, full self-damage, zero friendly fire and no splash falloff.';
    if (weapon.id === 'melee') return 'Two-tile melee reach with no lunge. Can attack while moving and carries the fastest movement modifier.';
    if (weapon.id === 'pistol') return 'Semi-auto sidearm. Every click fires one round with no artificial repeat-fire cadence beyond the trigger press.';
    if (weapon.id === 'lmg') return 'Heavy 75-round primary with strong per-shot damage, long reload and substantial movement cost.';
    if (weapon.id === 'smg') return 'Fast automatic primary built around close-range pressure, quick handling and neutral movement speed.';
    return 'Balanced automatic rifle with predictable spread, medium-range falloff and moderate handling penalties.';
  }
}
