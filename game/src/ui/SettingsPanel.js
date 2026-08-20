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

    this.renderBindings();
    this.bindEvents();
    this.sync();
    window.addEventListener('unblockedtdm:settings-change', () => this.sync());
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
      if (!control || control.dataset.setting !== 'sensitivity') return;
      this.settings.setGameplay('sensitivity', control.value);
    });

    this.root.addEventListener('change', (event) => {
      const control = event.target.closest('[data-setting]');
      if (!control) return;
      const key = control.dataset.setting;
      const value = control.type === 'checkbox' ? control.checked : control.value;
      this.settings.setGameplay(key, value);
    });

    this.root.addEventListener('click', (event) => {
      const bindingButton = event.target.closest('[data-bind-action]');
      if (bindingButton) {
        this.startCapture(bindingButton.dataset.bindAction, bindingButton);
        return;
      }

      const action = event.target.closest('[data-settings-action]')?.dataset.settingsAction;
      if (!action) return;
      if (action === 'reset-gameplay') this.settings.resetGameplay();
      if (action === 'reset-bindings') this.settings.resetBindings();
      if (action === 'reset-all') {
        this.settings.resetGameplay();
        this.settings.resetBindings();
      }
      if (action === 'fullscreen') this.onFullscreen?.();
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

    for (const button of this.root.querySelectorAll('[data-bind-action]')) {
      if (button === this.captureButton) continue;
      button.textContent = bindingLabel(this.settings.binding(button.dataset.bindAction));
    }
  }
}
