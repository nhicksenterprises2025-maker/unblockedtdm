import { PRIMARY_WEAPONS, SECONDARY_WEAPONS } from '../data/weapons.js';
import { weaponModelSvg } from './WeaponPresentation.js';

export class LoadoutScreen {
  constructor(root, store, onComplete) {
    this.root = root;
    this.store = store;
    this.onComplete = onComplete;
    this.mode = 'play';
    this.loadFromStore();
    this.root.classList.add('hidden');
    window.addEventListener('keydown', (event) => {
      if (event.code === 'Escape' && !event.repeat && !this.root.classList.contains('hidden')) {
        event.preventDefault();
        this.back();
      }
    });
    this.render();
  }

  loadFromStore() {
    const active = this.store.get();
    this.selectedIndex = active.index;
    this.selection = { primary: active.primary, secondary: active.secondary };
    this.activeSlot = 'primary';
    this.previewWeapon = this.selection.primary;
    this.message = 'Choose a saved slot, then click a weapon to equip it.';
  }

  open(mode = 'play') {
    this.mode = mode === 'manage' ? 'manage' : 'play';
    this.loadFromStore();
    this.message = this.mode === 'play'
      ? 'Choose your saved loadout, then start the match.'
      : 'Edit your primary and secondary weapons or create another loadout slot.';
    this.root.classList.remove('hidden');
    this.render();
  }

  close() { this.root.classList.add('hidden'); }
  back() { this.close(); this.onComplete?.({ mode: 'manage' }); }
  weaponsFor(slot) { return slot === 'primary' ? PRIMARY_WEAPONS : SECONDARY_WEAPONS; }

  loadSavedSlot(index) {
    const saved = this.store.setActive(index);
    this.selectedIndex = saved.index;
    this.selection = { primary: saved.primary, secondary: saved.secondary };
    this.previewWeapon = this.selection[this.activeSlot];
    this.message = `${saved.name} selected.`;
    this.render();
  }

  addSavedSlot() {
    const created = this.store.addSlot();
    if (!created) {
      this.message = `Maximum of ${this.store.capacity()} loadout slots reached.`;
      this.render();
      return;
    }
    const saved = this.store.setActive(created.index);
    this.selectedIndex = saved.index;
    this.selection = { primary: saved.primary, secondary: saved.secondary };
    this.previewWeapon = this.selection[this.activeSlot];
    this.message = `${saved.name} created.`;
    this.render();
  }

  setSlot(slot) {
    this.activeSlot = slot;
    this.previewWeapon = this.selection[slot] || this.weaponsFor(slot)[0];
    this.message = `${slot.toUpperCase()} slot active.`;
    this.render();
  }

  persistSelection() {
    const current = this.store.get(this.selectedIndex);
    return this.store.save(this.selectedIndex, { name: current.name, primary: this.selection.primary, secondary: this.selection.secondary });
  }

  select(weapon) {
    const otherSlot = this.activeSlot === 'primary' ? 'secondary' : 'primary';
    if (this.selection[otherSlot]?.id === weapon.id) {
      this.message = 'That weapon is already equipped in the other slot.';
      this.render();
      return false;
    }
    this.selection[this.activeSlot] = weapon;
    this.previewWeapon = weapon;
    const saved = this.persistSelection();
    this.message = `${weapon.name} equipped as ${this.activeSlot.toUpperCase()}.`;
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

  complete() {
    if (!this.selection.primary || !this.selection.secondary) return;
    const saved = this.persistSelection();
    this.close();
    this.onComplete?.({ mode: this.mode, primary: saved.primary, secondary: saved.secondary, slotIndex: saved.index, name: saved.name });
  }

  render() {
    const weapon = this.previewWeapon;
    const list = this.weaponsFor(this.activeSlot);
    const otherSlot = this.activeSlot === 'primary' ? 'secondary' : 'primary';
    const selectedHere = this.selection[this.activeSlot]?.id === weapon.id;
    const blockedPreview = this.selection[otherSlot]?.id === weapon.id;
    const savedSlots = this.store.all();
    const current = savedSlots.find((slot) => slot.index === this.selectedIndex) || this.store.get(this.selectedIndex);
    const esc = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    const addSlot = this.store.canAddSlot()
      ? `<button type="button" id="addLoadoutSlot" class="loadout-preset loadout-add-slot"><b>+</b><span>ADD SLOT</span><small>${this.store.count()} / ${this.store.capacity()} CREATED</small></button>`
      : `<div class="loadout-preset loadout-add-slot maxed"><b>25</b><span>MAX SLOTS</span><small>CAPACITY REACHED</small></div>`;

    this.root.innerHTML = `<div class="loadout-shell loadout-shell-v16 ui233-loadout-shell" data-ui-surface>
      <div class="loadout-head"><div><span class="eyebrow">SKIRMISH ARENA · LOADOUT CLIENT</span><h1>${this.mode === 'play' ? 'CHOOSE YOUR LOADOUT' : 'LOADOUTS'}</h1><p>${this.mode === 'play' ? 'Choose a saved setup before deployment.' : 'Build and save your primary + secondary combinations.'}</p></div><div class="selected-summary"><span>PRIMARY <b>${this.selection.primary?.name || '—'}</b></span><span>SECONDARY <b>${this.selection.secondary?.name || '—'}</b></span></div></div>
      <div class="loadout-presets">${savedSlots.map((slot) => `<button type="button" data-loadout-index="${slot.index}" class="loadout-preset ${slot.index === this.selectedIndex ? 'active' : ''}"><b>${String(slot.index + 1).padStart(2, '0')}</b><span>${slot.name}</span><small>${slot.primary.shortName} + ${slot.secondary.shortName}</small></button>`).join('')}${addSlot}</div>
      <div class="loadout-name-row"><label>ACTIVE SLOT <strong>${String(this.selectedIndex + 1).padStart(2, '0')}</strong></label><input id="loadoutName" maxlength="24" value="${esc(current.name)}"><button type="button" id="saveLoadoutName">SAVE NAME</button><button type="button" id="resetLoadoutSlot" class="muted">RESET SLOT</button></div>
      <div class="slot-tabs"><button type="button" data-slot="primary" class="${this.activeSlot === 'primary' ? 'active' : ''}">1 · PRIMARY</button><button type="button" data-slot="secondary" class="${this.activeSlot === 'secondary' ? 'active' : ''}">2 · SECONDARY</button></div>
      <div class="loadout-body"><div class="weapon-list">${list.map((item) => { const selected = this.selection[this.activeSlot]?.id === item.id; const blocked = this.selection[otherSlot]?.id === item.id; return `<button type="button" class="weapon-card ui233-weapon-card ${selected ? 'selected' : ''} ${blocked ? 'blocked' : ''}" data-weapon="${item.id}" ${blocked ? 'disabled' : ''}><span class="phase2-card-model">${weaponModelSvg(item)}</span><strong>${item.name}</strong>${selected ? '<i>EQUIPPED</i>' : '<i>CLICK TO EQUIP</i>'}</button>`; }).join('')}</div>
      <div class="weapon-detail ui233-weapon-detail"><div class="weapon-detail-title"><div><span>${this.activeSlot.toUpperCase()} WEAPON</span><h2>${weapon.name}</h2></div></div><div class="phase2-weapon-stage">${weaponModelSvg(weapon)}</div><button type="button" id="selectWeapon" class="select-weapon" ${blockedPreview ? 'disabled' : ''}>${selectedHere ? `EQUIPPED AS ${this.activeSlot.toUpperCase()}` : `EQUIP ${weapon.name.toUpperCase()}`}</button><div class="loadout-message">${this.message}</div></div></div>
      <div class="loadout-foot"><div><span>ACTIVE LOADOUT · SLOT ${String(this.selectedIndex + 1).padStart(2, '0')}</span><strong>${current.name} · ${this.selection.primary?.name || '—'} + ${this.selection.secondary?.name || '—'}</strong></div><div class="loadout-foot-actions"><button type="button" id="loadoutBackButton" class="select-weapon">BACK TO MAIN MENU</button><button type="button" id="deployButton" class="deploy-button">${this.mode === 'play' ? 'START MATCH' : 'SAVE & BACK'}</button></div></div>
    </div>`;

    for (const button of this.root.querySelectorAll('[data-loadout-index]')) button.addEventListener('click', () => this.loadSavedSlot(Number(button.dataset.loadoutIndex)));
    for (const button of this.root.querySelectorAll('[data-slot]')) button.addEventListener('click', () => this.setSlot(button.dataset.slot));
    for (const button of this.root.querySelectorAll('[data-weapon]')) button.addEventListener('click', () => { const item = list.find((entry) => entry.id === button.dataset.weapon); if (item) this.select(item); });
    this.root.querySelector('#addLoadoutSlot')?.addEventListener('click', () => this.addSavedSlot());
    this.root.querySelector('#selectWeapon')?.addEventListener('click', () => this.select(weapon));
    this.root.querySelector('#saveLoadoutName')?.addEventListener('click', () => this.renameCurrent(this.root.querySelector('#loadoutName')?.value));
    this.root.querySelector('#loadoutName')?.addEventListener('keydown', (event) => { if (event.key === 'Enter') this.renameCurrent(event.currentTarget.value); });
    this.root.querySelector('#resetLoadoutSlot')?.addEventListener('click', () => this.resetCurrent());
    this.root.querySelector('#loadoutBackButton')?.addEventListener('click', () => this.back());
    this.root.querySelector('#deployButton')?.addEventListener('click', () => this.complete());
  }
}
