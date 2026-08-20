import { DEFAULT_LOADOUT, PRIMARY_WEAPONS, SECONDARY_WEAPONS, formatWeaponStats } from '../data/weapons.js';

export class LoadoutScreen {
  constructor(root, onDeploy, initial = DEFAULT_LOADOUT) {
    this.root = root;
    this.onDeploy = onDeploy;
    this.selection = { primary: initial.primary, secondary: initial.secondary };
    this.activeSlot = 'primary';
    this.previewWeapon = this.selection.primary;
    this.message = '';
    this.render();
  }

  weaponsFor(slot) { return slot === 'primary' ? PRIMARY_WEAPONS : SECONDARY_WEAPONS; }
  setSlot(slot) { this.activeSlot = slot; this.previewWeapon = this.selection[slot] || this.weaponsFor(slot)[0]; this.message = ''; this.render(); }
  preview(weapon) { this.previewWeapon = weapon; this.message = ''; this.render(); }
  select(weapon) {
    const otherSlot = this.activeSlot === 'primary' ? 'secondary' : 'primary';
    if (this.selection[otherSlot]?.id === weapon.id) { this.message = 'The exact same weapon cannot occupy both slots.'; this.render(); return; }
    this.selection[this.activeSlot] = weapon; this.previewWeapon = weapon; this.message = `${weapon.name} selected as ${this.activeSlot}.`; this.render();
  }
  deploy() { if (!this.selection.primary || !this.selection.secondary) return; this.root.classList.add('hidden'); this.onDeploy?.({ ...this.selection }); }

  render() {
    const weapon = this.previewWeapon, stats = formatWeaponStats(weapon), list = this.weaponsFor(this.activeSlot);
    this.root.innerHTML = `
      <div class="loadout-shell">
        <div class="loadout-head">
          <div><span class="eyebrow">UNBLOCKEDTDM</span><h1>CHOOSE YOUR LOADOUT</h1><p>Select a primary and secondary before entering the arena.</p></div>
          <div class="selected-summary"><span>PRIMARY <b>${this.selection.primary?.shortName || '—'}</b></span><span>SECONDARY <b>${this.selection.secondary?.shortName || '—'}</b></span></div>
        </div>
        <div class="slot-tabs"><button data-slot="primary" class="${this.activeSlot === 'primary' ? 'active' : ''}">PRIMARY</button><button data-slot="secondary" class="${this.activeSlot === 'secondary' ? 'active' : ''}">SECONDARY</button></div>
        <div class="loadout-body">
          <div class="weapon-list">${list.map((item) => { const selected=this.selection[this.activeSlot]?.id===item.id,blocked=this.selection[this.activeSlot==='primary'?'secondary':'primary']?.id===item.id; return `<button class="weapon-card ${selected?'selected':''} ${blocked?'blocked':''}" data-weapon="${item.id}"><span class="weapon-class">${item.kind.toUpperCase()}</span><strong>${item.name}</strong><small>${item.fireMode.toUpperCase()} · SWAP T${item.swapTier}</small>${selected?'<i>SELECTED</i>':''}</button>`; }).join('')}</div>
          <div class="weapon-detail"><div class="weapon-detail-title"><div><span>${this.activeSlot.toUpperCase()} WEAPON</span><h2>${weapon.name}</h2></div><b>${weapon.shortName}</b></div><div class="stat-grid">${stats.map(([label,value])=>`<div><span>${label}</span><strong>${value}</strong></div>`).join('')}</div><div class="weapon-rule">${this.description(weapon)}</div><button id="selectWeapon" class="select-weapon">SELECT ${weapon.name.toUpperCase()}</button><div class="loadout-message">${this.message}</div></div>
        </div>
        <div class="loadout-foot"><div><span>LOADOUT</span><strong>${this.selection.primary?.name || '—'} + ${this.selection.secondary?.name || '—'}</strong></div><button id="deployButton" class="deploy-button">START MATCH</button></div>
      </div>`;
    for (const button of this.root.querySelectorAll('[data-slot]')) button.addEventListener('click',()=>this.setSlot(button.dataset.slot));
    for (const button of this.root.querySelectorAll('[data-weapon]')) button.addEventListener('click',()=>{const item=list.find((entry)=>entry.id===button.dataset.weapon);if(item)this.preview(item);});
    this.root.querySelector('#selectWeapon')?.addEventListener('click',()=>this.select(weapon));
    this.root.querySelector('#deployButton')?.addEventListener('click',()=>this.deploy());
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
