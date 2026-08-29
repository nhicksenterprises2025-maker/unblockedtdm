import { Player } from './actors/Player.js';
import { ProjectileSystem } from './combat/ProjectileSystem.js';
import { WeaponManager } from './combat/WeaponManager.js';
import { GameSettings } from './engine/GameSettings.js';
import { AudioSystem } from './audio/AudioSystem.js';

const settings = new GameSettings();
const audio = new AudioSystem();
audio.configure(settings.gameplay());

function ensureStyle(href) {
  if ([...document.querySelectorAll('link[rel="stylesheet"]')].some((link) => link.getAttribute('href') === href)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

function phase4Cards() {
  return `
    <div class="setting-card phase4-setting-card" data-phase4-settings>
      <label class="toggle-line"><span>AUTO SPRINT</span><input data-phase4-setting="autoSprint" type="checkbox"></label>
      <output data-phase4-value="autoSprint">ON</output>
      <small>Enabled by default. Movement automatically sprints when stamina and ADS rules allow it.</small>
    </div>
    <div class="setting-card phase4-setting-card" data-phase4-settings>
      <label class="toggle-line"><span>GAME AUDIO</span><input data-phase4-setting="audioEnabled" type="checkbox"></label>
      <output data-phase4-value="audioEnabled">ON</output>
      <small>Weapon, reload, footsteps, explosion and interface audio.</small>
    </div>
    <div class="setting-card phase4-setting-card" data-phase4-settings>
      <label>MASTER VOLUME</label>
      <input data-phase4-setting="masterVolume" type="range" min="0" max="1" step="0.05" value="0.75">
      <output data-phase4-value="masterVolume">75%</output>
      <small>Global Phase 4 audio output level.</small>
    </div>`;
}

function syncPhase4Controls() {
  const gameplay = settings.gameplay();
  for (const control of document.querySelectorAll('[data-phase4-setting]')) {
    const key = control.dataset.phase4Setting;
    if (control.type === 'checkbox') control.checked = Boolean(gameplay[key]);
    else control.value = String(gameplay[key]);
  }
  for (const output of document.querySelectorAll('[data-phase4-value]')) {
    const key = output.dataset.phase4Value;
    if (key === 'masterVolume') output.textContent = `${Math.round(gameplay.masterVolume * 100)}%`;
    else output.textContent = gameplay[key] ? 'ON' : 'OFF';
  }
  audio.configure(gameplay);
}

function installPhase4Settings() {
  for (const grid of document.querySelectorAll('.settings-panel .settings-grid')) {
    if (grid.closest('[data-settings-version="2.5"]')) continue;
    if (grid.querySelector('[data-phase4-settings]')) continue;
    grid.insertAdjacentHTML('beforeend', phase4Cards());
  }
  syncPhase4Controls();
}

function phase4ControlChange(event) {
  const control = event.target.closest?.('[data-phase4-setting]');
  if (!control) return;
  const key = control.dataset.phase4Setting;
  const value = control.type === 'checkbox' ? control.checked : control.value;
  settings.setGameplay(key, value);
}

document.addEventListener('change', phase4ControlChange);
document.addEventListener('input', (event) => {
  const control = event.target.closest?.('[data-phase4-setting="masterVolume"]');
  if (!control) return;
  settings.setGameplay('masterVolume', control.value);
});
window.addEventListener('unblockedtdm:settings-change', syncPhase4Controls);

function installAutoSprint() {
  if (Player.prototype.__phase4AutoSprint) return;
  const originalLocomotion = Player.prototype.updateLocomotion;
  Player.prototype.updateLocomotion = function phase4Locomotion(dt, input, map, axis, blockers) {
    const autoSprint = this.isLocal && settings.gameplay().autoSprint;
    if (!autoSprint) return originalLocomotion.call(this, dt, input, map, axis, blockers);
    const automaticInput = Object.create(input);
    automaticInput.sprintHeld = () => true;
    return originalLocomotion.call(this, dt, automaticInput, map, axis, blockers);
  };
  Object.defineProperty(Player.prototype, '__phase4AutoSprint', { value: true });
}

function installFootsteps() {
  if (Player.prototype.__phase4Footsteps) return;
  const originalUpdate = Player.prototype.update;
  Player.prototype.update = function phase4PlayerUpdate(dt, ...args) {
    const result = originalUpdate.call(this, dt, ...args);
    if (this.isLocal) audio.setListener(this);
    audio.updateFootsteps(this, dt);
    return result;
  };
  Object.defineProperty(Player.prototype, '__phase4Footsteps', { value: true });
}

function installWeaponAudio() {
  if (WeaponManager.prototype.__phase4Audio) return;

  const originalTryFire = WeaponManager.prototype.tryFire;
  WeaponManager.prototype.tryFire = function phase4TryFire(...args) {
    const beforeDry = this.dryFireTimer;
    const weapon = this.currentWeapon();
    const result = originalTryFire.apply(this, args);
    if (result !== false) audio.playWeapon(this.owner, weapon);
    else if (this.dryFireTimer > beforeDry) audio.playDry(this.owner);
    return result;
  };

  const originalStartReload = WeaponManager.prototype.startReload;
  WeaponManager.prototype.startReload = function phase4StartReload(...args) {
    const wasReloading = this.isReloading();
    const weapon = this.currentWeapon();
    const result = originalStartReload.apply(this, args);
    if (!wasReloading && this.isReloading()) audio.playReloadStart(this.owner, weapon);
    return result;
  };

  const originalInsertShell = WeaponManager.prototype.insertShell;
  WeaponManager.prototype.insertShell = function phase4InsertShell(...args) {
    const before = this.currentAmmo()?.magazine ?? 0;
    const result = originalInsertShell.apply(this, args);
    const after = this.currentAmmo()?.magazine ?? 0;
    if (after > before) audio.playShell(this.owner);
    return result;
  };

  const originalMagazineFinish = WeaponManager.prototype.finishMagazineReload;
  WeaponManager.prototype.finishMagazineReload = function phase4FinishMagazineReload(...args) {
    const weapon = this.currentWeapon();
    const result = originalMagazineFinish.apply(this, args);
    audio.playReloadFinish(this.owner, weapon);
    return result;
  };

  const originalShellFinish = WeaponManager.prototype.finishShellReload;
  WeaponManager.prototype.finishShellReload = function phase4FinishShellReload(...args) {
    const weapon = this.currentWeapon();
    const result = originalShellFinish.apply(this, args);
    audio.playReloadFinish(this.owner, weapon);
    return result;
  };

  const originalRequestSwitch = WeaponManager.prototype.requestSwitch;
  WeaponManager.prototype.requestSwitch = function phase4RequestSwitch(...args) {
    const beforePending = this.pendingSlot;
    const beforeTimer = this.switchTimer;
    const result = originalRequestSwitch.apply(this, args);
    if (this.pendingSlot !== beforePending || (beforeTimer <= 0 && this.switchTimer > 0)) audio.playSwap(this.owner);
    return result;
  };

  Object.defineProperty(WeaponManager.prototype, '__phase4Audio', { value: true });
}

function installExplosionAudio() {
  if (ProjectileSystem.prototype.__phase4Audio) return;
  const originalExplode = ProjectileSystem.prototype.explode;
  ProjectileSystem.prototype.explode = function phase4Explode(projectile, map, targets, point) {
    audio.playExplosion(point);
    return originalExplode.call(this, projectile, map, targets, point);
  };
  Object.defineProperty(ProjectileSystem.prototype, '__phase4Audio', { value: true });
}

let lastHover = null;
document.addEventListener('pointerdown', () => audio.ensure(), { once: false });
document.addEventListener('pointerover', (event) => {
  const target = event.target.closest?.('button,select,input');
  if (!target || target === lastHover) return;
  lastHover = target;
  audio.playUi('hover');
});
document.addEventListener('pointerout', (event) => {
  if (event.target.closest?.('button,select,input') === lastHover) lastHover = null;
});
document.addEventListener('click', (event) => {
  const button = event.target.closest?.('button');
  if (!button) return;
  const text = String(button.textContent || '').toUpperCase();
  audio.playUi(text.includes('BACK') || text.includes('RETURN') ? 'back' : 'click');
});

ensureStyle('ui-phase4.css');
document.body.classList.add('ui-phase4');
installPhase4Settings();
installAutoSprint();
installFootsteps();
installWeaponAudio();
installExplosionAudio();
syncPhase4Controls();
