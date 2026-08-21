import { GameSettings } from './engine/GameSettings.js';
import { AudioSystem } from './audio/AudioSystem.js';
import { CombatFeedbackRenderer } from './render/CombatFeedbackRenderer.js';
import { TILE_SIZE } from './engine/constants.js';

const settings = new GameSettings();
const audio = new AudioSystem(settings);
let lastWeaponState = '';
let lastFootstepState = '';

function ensureStyles() {
  if (document.querySelector('link[data-skirmish-phase4]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'ui-v40.css';
  link.dataset.skirmishPhase4 = 'true';
  document.head.appendChild(link);
}

function settingsCards() {
  return `
    <div class="setting-card phase4-auto-sprint"><label class="toggle-line"><span>AUTO SPRINT</span><input data-setting="autoSprint" type="checkbox" checked></label><output data-setting-value="autoSprint">ON</output><small>Automatically sprint while moving when stamina and combat state allow it.</small></div>
    <div class="setting-card phase4-audio-toggle"><label class="toggle-line"><span>GAME AUDIO</span><input data-setting="audioEnabled" type="checkbox" checked></label><output data-setting-value="audioEnabled">ON</output><small>Weapon, movement, combat and interface audio.</small></div>
    <div class="setting-card phase4-master-volume"><label>MASTER VOLUME</label><input data-setting="masterVolume" type="range" min="0" max="1" step="0.05" value="0.75"><output data-setting-value="masterVolume">75%</output><small>Overall Skirmish Arena volume.</small></div>`;
}

function injectSettings(panel) {
  if (!panel || panel.querySelector('.phase4-auto-sprint')) return;
  const grid = panel.querySelector('.settings-grid');
  if (!grid) return;
  const displayCard = grid.querySelector('[data-settings-action="fullscreen"]')?.closest('.setting-card');
  const anchor = displayCard || null;
  const holder = document.createElement('div');
  holder.className = 'phase4-settings-holder';
  holder.innerHTML = settingsCards();
  const cards = [...holder.children];
  for (const card of cards) grid.insertBefore(card, anchor);
  const firstAudio = grid.querySelector('.phase4-audio-toggle');
  if (firstAudio && !grid.querySelector('.phase4-audio-tag')) {
    const tag = document.createElement('div');
    tag.className = 'settings-section-tag phase4-audio-tag';
    tag.textContent = 'AUDIO';
    grid.insertBefore(tag, firstAudio);
  }
  syncSettingsOutputs(panel);
}

function syncSettingsOutputs(root = document) {
  const gameplay = settings.gameplay();
  for (const control of root.querySelectorAll('[data-setting="autoSprint"]')) control.checked = Boolean(gameplay.autoSprint);
  for (const control of root.querySelectorAll('[data-setting="audioEnabled"]')) control.checked = Boolean(gameplay.audioEnabled);
  for (const control of root.querySelectorAll('[data-setting="masterVolume"]')) control.value = String(gameplay.masterVolume);
  for (const out of root.querySelectorAll('[data-setting-value="autoSprint"]')) out.textContent = gameplay.autoSprint ? 'ON' : 'OFF';
  for (const out of root.querySelectorAll('[data-setting-value="audioEnabled"]')) out.textContent = gameplay.audioEnabled ? 'ON' : 'OFF';
  for (const out of root.querySelectorAll('[data-setting-value="masterVolume"]')) out.textContent = `${Math.round(gameplay.masterVolume * 100)}%`;
}

function parseListener() {
  const raw = document.getElementById('coords')?.textContent || '';
  const match = raw.match(/(-?\d+(?:\.\d+)?)\D+(-?\d+(?:\.\d+)?)/);
  if (!match) return { x: 0, y: 0, valid: false };
  return { x: Number(match[1]) * TILE_SIZE, y: Number(match[2]) * TILE_SIZE, valid: true };
}

function spatialFrom(point) {
  if (!point) return { pan: 0, distance: 0 };
  const listener = parseListener();
  if (!listener.valid) return { pan: 0, distance: 0 };
  const dx = point.x - listener.x;
  const dy = point.y - listener.y;
  return {
    pan: Math.max(-1, Math.min(1, dx / (10 * TILE_SIZE))),
    distance: Math.hypot(dx, dy)
  };
}

function patchCombatAudio() {
  const proto = CombatFeedbackRenderer.prototype;
  if (proto.__skirmishAudioPatched) return;
  Object.defineProperty(proto, '__skirmishAudioPatched', { value: true });

  const shot = proto.spawnShot;
  proto.spawnShot = function(payload) {
    const result = shot.call(this, payload);
    audio.weapon(payload?.type || 'assault-rifle', spatialFrom(payload?.muzzle));
    return result;
  };

  const launch = proto.spawnLaunch;
  proto.spawnLaunch = function(payload) {
    const result = launch.call(this, payload);
    audio.weapon(payload?.type || 'launcher', spatialFrom(payload?.muzzle));
    return result;
  };

  const melee = proto.spawnMeleeSwing;
  proto.spawnMeleeSwing = function(payload) {
    const result = melee.call(this, payload);
    audio.weapon('melee', spatialFrom(payload?.owner));
    return result;
  };

  const explosion = proto.spawnExplosion;
  proto.spawnExplosion = function(payload) {
    const result = explosion.call(this, payload);
    audio.explosion(spatialFrom(payload?.point));
    return result;
  };
}

function monitorPresentationState() {
  const state = document.getElementById('weaponState')?.textContent?.trim().toUpperCase() || '';
  if (state && state !== lastWeaponState) {
    if (state.includes('RELOAD')) audio.reload(document.getElementById('weaponName')?.textContent?.toUpperCase().includes('SHOTGUN'));
    else if (state.includes('SWAP') || state.includes('SWITCH')) audio.swap();
    else if (state.includes('EMPTY') || state.includes('DRY')) audio.dryFire();
    lastWeaponState = state;
  }

  const movement = document.getElementById('moveState')?.textContent?.trim().toUpperCase() || '';
  if (document.body.classList.contains('match-started')) {
    if (movement.includes('SPRINT')) audio.footstep(true);
    else if (movement.includes('WALK')) audio.footstep(false);
  }
  lastFootstepState = movement;
  requestAnimationFrame(monitorPresentationState);
}

function bindUiAudio() {
  document.addEventListener('pointerover', (event) => {
    if (event.target.closest('button')) audio.ui('hover');
  }, true);
  document.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const text = button.textContent?.toUpperCase() || '';
    if (button.disabled) audio.ui('error');
    else if (text.includes('BACK') || text.includes('QUIT') || text.includes('RETURN')) audio.ui('back');
    else if (text.includes('PLAY') || text.includes('START') || text.includes('SAVE') || text.includes('SELECT') || text.includes('EQUIP')) audio.ui('confirm');
    else audio.ui('click');
  }, true);
}

function boot() {
  ensureStyles();
  document.body.classList.add('ui-v40');
  document.querySelectorAll('.settings-panel').forEach(injectSettings);
  patchCombatAudio();
  bindUiAudio();
  syncSettingsOutputs();
  window.addEventListener('unblockedtdm:settings-change', () => {
    syncSettingsOutputs();
    audio.sync();
  });
  const observer = new MutationObserver(() => document.querySelectorAll('.settings-panel').forEach(injectSettings));
  observer.observe(document.body, { childList: true, subtree: true });
  monitorPresentationState();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
