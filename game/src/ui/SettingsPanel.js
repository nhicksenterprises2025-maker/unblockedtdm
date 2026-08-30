import { AI_MULTIPLIERS, BINDING_ACTIONS, bindingLabel, mouseBindingCode } from '../engine/GameSettings.js';

function boolText(value) {
  return value ? 'ON' : 'OFF';
}

export class SettingsPanel {
  constructor(root, settings, { onFullscreen = null } = {}) {
    this.root = root;
    this.settings = settings;
    this.onFullscreen = onFullscreen;
    this.captureAction = null;
    this.captureButton = null;
    this.captureKeyHandler = (event) => this.captureKeyboard(event);
    this.captureMouseHandler = (event) => this.captureMouse(event);

    this.installLayout();
    this.renderBindings();
    this.bindEvents();
    this.sync();
    window.addEventListener('unblockedtdm:settings-change', () => this.sync());
  }

  installLayout() {
    if (!this.root || this.root.dataset.settingsVersion === '2.6') return;
    const pauseContext = this.root.id === 'pauseSettingsView';
    this.root.dataset.settingsVersion = '2.6';
    this.root.innerHTML = `
      ${pauseContext ? '' : '<div class="settings-title settings-250-title"><span class="menu-eyebrow">CLIENT CONFIGURATION // 2.6</span><h2>SETTINGS</h2><p>Every control below changes a live game system and persists on this device.</p></div>'}
      <div class="settings-250-shell">
        <nav class="settings-250-tabs" aria-label="Settings categories">
          <button type="button" class="active" data-settings-tab="gameplay">GAMEPLAY</button>
          <button type="button" data-settings-tab="controls">CONTROLS</button>
          <button type="button" data-settings-tab="display">DISPLAY</button>
          <button type="button" data-settings-tab="audio">AUDIO</button>
          <button type="button" data-settings-tab="hud">HUD</button>
        </nav>
        <div class="settings-250-body">
          <section class="settings-250-pane active" data-settings-pane="gameplay">
            <header><span>01 // COMBAT RESPONSE</span><h3>Gameplay</h3><p>Aim response, bot pressure, movement assistance and combat feedback.</p></header>
            <div class="settings-grid settings-250-grid">
              <div class="setting-card setting-wide"><label>AIM SENSITIVITY</label><input data-setting="sensitivity" type="range" min="0.35" max="2.50" step="0.05"><output data-setting-value="sensitivity">1.00×</output><small>Scales pointer input without changing weapon spread.</small></div>
              <div class="setting-card"><label>AI DIFFICULTY</label><select data-setting="aiDifficulty"><option>Beginner</option><option>Average</option><option>Sweat</option><option>Pro</option></select><output data-setting-value="aiDifficulty">AVERAGE · 1.00×</output></div>
              <div class="setting-card"><label class="toggle-line"><span>AUTO SPRINT</span><input data-setting="autoSprint" type="checkbox"></label><output data-setting-value="autoSprint">ON</output><small>Automatically sprints while movement and stamina rules permit.</small></div>
              <div class="setting-card"><label class="toggle-line"><span>AUTO RELOAD</span><input data-setting="autoReload" type="checkbox"></label><output data-setting-value="autoReload">OFF</output><small>When an empty ranged weapon has reserve ammunition, reload as soon as combat state permits.</small></div>
              <div class="setting-card"><label class="toggle-line"><span>SCREEN SHAKE</span><input data-setting="screenShake" type="checkbox"></label><output data-setting-value="screenShake">ON</output></div>
              <div class="setting-card"><label>SHAKE STRENGTH</label><input data-setting="screenShakeStrength" type="range" min="0" max="1" step="0.05"><output data-setting-value="screenShakeStrength">75%</output></div>
              <div class="setting-card"><label class="toggle-line"><span>DAMAGE VIGNETTE</span><input data-setting="damageVignette" type="checkbox"></label><output data-setting-value="damageVignette">ON</output></div>
              <div class="setting-card"><label>VIGNETTE INTENSITY</label><input data-setting="damageVignetteIntensity" type="range" min="0" max="1" step="0.05"><output data-setting-value="damageVignetteIntensity">80%</output></div>
            </div>
          </section>
          <section class="settings-250-pane" data-settings-pane="controls">
            <header><span>02 // INPUT MAP</span><h3>Controls</h3><p>Select a binding, then press a key or mouse button. Conflicts swap safely.</p></header>
            <div class="bindings-card settings-250-bindings"><div class="bindings-grid" data-bindings-grid></div><div class="settings-message" data-settings-message></div></div>
          </section>
          <section class="settings-250-pane" data-settings-pane="display">
            <header><span>03 // DISPLAY</span><h3>Display</h3><p>Window mode and readable HUD presentation.</p></header>
            <div class="settings-grid settings-250-grid">
              <div class="setting-card setting-action"><span>WINDOW MODE</span><button type="button" data-settings-action="fullscreen">TOGGLE FULLSCREEN</button><small>F11 remains the fixed fullscreen shortcut.</small></div>
              <div class="setting-card"><label>HUD SCALE</label><input data-setting="hudScale" type="range" min="0.8" max="1.4" step="0.05"><output data-setting-value="hudScale">100%</output><small>Scales match information from 80% to 140% while minimap and kill feed controls remain independent.</small></div>
              <div class="setting-card"><label class="toggle-line"><span>FPS COUNTER</span><input data-setting="showFps" type="checkbox"></label><output data-setting-value="showFps">OFF</output><small>Shows the live renderer frame rate in the lower status rail.</small></div>
            </div>
          </section>
          <section class="settings-250-pane" data-settings-pane="audio">
            <header><span>04 // AUDIO OUTPUT</span><h3>Audio</h3><p>Procedural weapon, movement, impact and interface audio.</p></header>
            <div class="settings-grid settings-250-grid">
              <div class="setting-card"><label class="toggle-line"><span>GAME AUDIO</span><input data-setting="audioEnabled" type="checkbox"></label><output data-setting-value="audioEnabled">ON</output></div>
              <div class="setting-card setting-wide"><label>MASTER VOLUME</label><input data-setting="masterVolume" type="range" min="0" max="1" step="0.05"><output data-setting-value="masterVolume">75%</output><small>Controls the actual Web Audio master gain.</small></div>
            </div>
          </section>
          <section class="settings-250-pane" data-settings-pane="hud">
            <header><span>05 // TACTICAL HUD</span><h3>HUD</h3><p>Scale and orient match information without altering gameplay.</p></header>
            <div class="settings-grid settings-250-grid">
              <div class="setting-card"><label>MINIMAP ORIENTATION</label><select data-setting="minimapMode"><option value="north-up">North Up</option><option value="rotate">Rotate With Aim</option></select><output data-setting-value="minimapMode">NORTH UP</output></div>
              <div class="setting-card"><label>MINIMAP SCALE</label><input data-setting="minimapScale" type="range" min="0.75" max="1.25" step="0.05"><output data-setting-value="minimapScale">100%</output></div>
              <div class="setting-card"><label>MINIMAP OPACITY</label><input data-setting="minimapOpacity" type="range" min="0.45" max="1" step="0.05"><output data-setting-value="minimapOpacity">92%</output></div>
              <div class="setting-card"><label>KILL FEED SCALE</label><input data-setting="killFeedScale" type="range" min="0.8" max="1.2" step="0.05"><output data-setting-value="killFeedScale">100%</output></div>
            </div>
          </section>
        </div>
        <footer class="settings-actions settings-250-actions">
          <button type="button" data-settings-action="reset-gameplay">RESET SETTINGS</button>
          <button type="button" data-settings-action="reset-bindings">RESET KEYBINDS</button>
          <button type="button" data-settings-action="reset-all">RESET ALL</button>
          ${pauseContext ? '<button type="button" id="settingsBackButton">BACK TO MATCH</button>' : ''}
        </footer>
      </div>`;
  }

  renderBindings() {
    const grid = this.root.querySelector('[data-bindings-grid]');
    if (!grid) return;
    grid.innerHTML = BINDING_ACTIONS.map(([action, label]) => `
      <div class="binding-row">
        <span>${label}</span>
        <button type="button" data-bind-action="${action}">${bindingLabel(this.settings.binding(action))}</button>
      </div>`).join('');
  }

  bindEvents() {
    this.root.addEventListener('input', (event) => {
      const control = event.target.closest('[data-setting]');
      if (!control || control.type !== 'range') return;
      this.settings.setGameplay(control.dataset.setting, control.value);
    });

    this.root.addEventListener('change', (event) => {
      const control = event.target.closest('[data-setting]');
      if (!control) return;
      const key = control.dataset.setting;
      const value = control.type === 'checkbox' ? control.checked : control.value;
      this.settings.setGameplay(key, value);
    });

    this.root.addEventListener('click', (event) => {
      const tab = event.target.closest('[data-settings-tab]');
      if (tab) {
        for (const button of this.root.querySelectorAll('[data-settings-tab]')) button.classList.toggle('active', button === tab);
        for (const pane of this.root.querySelectorAll('[data-settings-pane]')) pane.classList.toggle('active', pane.dataset.settingsPane === tab.dataset.settingsTab);
        return;
      }

      const bindingButton = event.target.closest('[data-bind-action]');
      if (bindingButton) {
        this.startCapture(bindingButton.dataset.bindAction, bindingButton);
        return;
      }

      const action = event.target.closest('[data-settings-action]')?.dataset.settingsAction;
      if (!action) return;
      if (action === 'reset-gameplay') this.settings.resetGameplay();
      if (action === 'reset-bindings') this.settings.resetBindings();
      if (action === 'reset-all') this.settings.resetAll();
      if (action === 'fullscreen') this.onFullscreen?.();
      if (action?.startsWith('reset')) this.renderBindings();
      this.sync();
    });
  }

  startCapture(action, button) {
    this.cancelCapture();
    this.captureAction = action;
    this.captureButton = button;
    button.classList.add('listening');
    button.textContent = 'PRESS KEY / MOUSE';
    this.setMessage(`Binding ${BINDING_ACTIONS.find(([id]) => id === action)?.[1] || action}. ESC cancels.`);
    window.addEventListener('keydown', this.captureKeyHandler, true);
    window.addEventListener('mousedown', this.captureMouseHandler, true);
  }

  captureKeyboard(event) {
    if (!this.captureAction) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.code === 'Escape') {
      this.cancelCapture();
      this.setMessage('Binding change cancelled.');
      return;
    }
    this.finishCapture(event.code);
  }

  captureMouse(event) {
    if (!this.captureAction) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    this.finishCapture(mouseBindingCode(event.button));
  }

  finishCapture(code) {
    const action = this.captureAction;
    const result = this.settings.setBinding(action, code);
    this.cancelCapture();
    if (!result.ok) {
      this.setMessage('That key is reserved. ESC, F1 and F11 remain system controls.');
    } else if (result.swappedAction) {
      this.setMessage(`Bound ${bindingLabel(code)}. Conflicting action was swapped automatically.`);
    } else {
      this.setMessage(`Bound ${bindingLabel(code)} successfully.`);
    }
    this.renderBindings();
    this.sync();
  }

  cancelCapture() {
    if (this.captureButton) this.captureButton.classList.remove('listening');
    this.captureAction = null;
    this.captureButton = null;
    window.removeEventListener('keydown', this.captureKeyHandler, true);
    window.removeEventListener('mousedown', this.captureMouseHandler, true);
  }

  setMessage(text) {
    const message = this.root.querySelector('[data-settings-message]');
    if (message) message.textContent = text;
  }

  sync() {
    const gameplay = this.settings.gameplay();
    for (const control of this.root.querySelectorAll('[data-setting]')) {
      const key = control.dataset.setting;
      const value = gameplay[key];
      if (control.type === 'checkbox') control.checked = Boolean(value);
      else control.value = String(value);
    }

    const sensitivity = this.root.querySelector('[data-setting-value="sensitivity"]');
    if (sensitivity) sensitivity.textContent = `${gameplay.sensitivity.toFixed(2)}×`;
    const ai = this.root.querySelector('[data-setting-value="aiDifficulty"]');
    if (ai) ai.textContent = `${gameplay.aiDifficulty.toUpperCase()} · ${AI_MULTIPLIERS[gameplay.aiDifficulty].toFixed(2)}×`;
    const minimap = this.root.querySelector('[data-setting-value="minimapMode"]');
    if (minimap) minimap.textContent = gameplay.minimapMode === 'rotate' ? 'ROTATE WITH AIM' : 'NORTH UP';
    const shake = this.root.querySelector('[data-setting-value="screenShake"]');
    if (shake) shake.textContent = boolText(gameplay.screenShake);
    const vignette = this.root.querySelector('[data-setting-value="damageVignette"]');
    if (vignette) vignette.textContent = boolText(gameplay.damageVignette);
    const autoSprint = this.root.querySelector('[data-setting-value="autoSprint"]');
    if (autoSprint) autoSprint.textContent = boolText(gameplay.autoSprint);
    const autoReload = this.root.querySelector('[data-setting-value="autoReload"]');
    if (autoReload) autoReload.textContent = boolText(gameplay.autoReload);
    const audio = this.root.querySelector('[data-setting-value="audioEnabled"]');
    if (audio) audio.textContent = boolText(gameplay.audioEnabled);
    const fps = this.root.querySelector('[data-setting-value="showFps"]');
    if (fps) fps.textContent = boolText(gameplay.showFps);
    for (const key of ['masterVolume', 'screenShakeStrength', 'damageVignetteIntensity', 'minimapScale', 'minimapOpacity', 'hudScale', 'killFeedScale']) {
      const output = this.root.querySelector(`[data-setting-value="${key}"]`);
      if (output) output.textContent = `${Math.round(gameplay[key] * 100)}%`;
    }

    for (const button of this.root.querySelectorAll('[data-bind-action]')) {
      if (button === this.captureButton) continue;
      button.textContent = bindingLabel(this.settings.binding(button.dataset.bindAction));
    }
  }
}
