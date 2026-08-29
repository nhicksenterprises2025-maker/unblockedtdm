export const AI_MULTIPLIERS = Object.freeze({
  Beginner: 0.80,
  Average: 1.00,
  Sweat: 1.35,
  Pro: 1.75
});

export const GAMEPLAY_DEFAULTS = Object.freeze({
  sensitivity: 1,
  aiDifficulty: 'Average',
  minimapMode: 'north-up',
  minimapScale: 1,
  minimapOpacity: 0.92,
  screenShake: true,
  screenShakeStrength: 0.75,
  damageVignette: true,
  damageVignetteIntensity: 0.8,
  autoSprint: true,
  audioEnabled: true,
  masterVolume: 0.75,
  hudScale: 1,
  killFeedScale: 1,
  showFps: false
});

export const DEFAULT_BINDINGS = Object.freeze({
  moveUp: 'KeyW',
  moveDown: 'KeyS',
  moveLeft: 'KeyA',
  moveRight: 'KeyD',
  sprint: 'ShiftLeft',
  dash: 'Space',
  reload: 'KeyR',
  primary: 'Digit1',
  secondary: 'Digit2',
  fire: 'Mouse0',
  ads: 'Mouse2',
  map: 'KeyM',
  scoreboard: 'Tab'
});

export const BINDING_ACTIONS = Object.freeze([
  ['moveUp', 'Move Up'],
  ['moveDown', 'Move Down'],
  ['moveLeft', 'Move Left'],
  ['moveRight', 'Move Right'],
  ['sprint', 'Sprint'],
  ['dash', 'Dash'],
  ['reload', 'Reload'],
  ['primary', 'Primary Weapon'],
  ['secondary', 'Secondary Weapon'],
  ['fire', 'Fire'],
  ['ads', 'ADS'],
  ['map', 'Tactical Map'],
  ['scoreboard', 'Scoreboard']
]);

const RESERVED_CODES = new Set(['Escape', 'F1', 'F11']);
const BINDINGS_KEY = 'unblockedtdm.keybindings';
const ACTIVE_EVENT = 'unblockedtdm:settings-change';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function storageFallback() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

function resolveStorage(storage) {
  if (storage) return storage;
  try {
    if (globalThis.localStorage) return globalThis.localStorage;
  } catch {}
  return storageFallback();
}

function emitChange(detail) {
  try {
    if (globalThis.window?.dispatchEvent && globalThis.CustomEvent) {
      globalThis.window.dispatchEvent(new CustomEvent(ACTIVE_EVENT, { detail }));
    }
  } catch {}
}

export class GameSettings {
  constructor(storage = null) {
    this.storage = resolveStorage(storage);
  }

  readRaw(key, fallback) {
    try {
      const value = this.storage.getItem(`unblockedtdm.${key}`);
      return value === null ? fallback : value;
    } catch {
      return fallback;
    }
  }

  gameplay() {
    const storedDifficulty = this.readRaw('aiDifficulty', GAMEPLAY_DEFAULTS.aiDifficulty);
    const storedVolume = Number(this.readRaw('masterVolume', String(GAMEPLAY_DEFAULTS.masterVolume)));
    const numeric = (key) => Number(this.readRaw(key, String(GAMEPLAY_DEFAULTS[key])));
    const bounded = (key, min, max) => {
      const value = numeric(key);
      return clamp(Number.isFinite(value) ? value : GAMEPLAY_DEFAULTS[key], min, max);
    };
    return {
      sensitivity: clamp(Number(this.readRaw('sensitivity', '1')) || 1, 0.35, 2.5),
      aiDifficulty: AI_MULTIPLIERS[storedDifficulty] ? storedDifficulty : GAMEPLAY_DEFAULTS.aiDifficulty,
      minimapMode: this.readRaw('minimapMode', GAMEPLAY_DEFAULTS.minimapMode) === 'rotate' ? 'rotate' : 'north-up',
      minimapScale: bounded('minimapScale', 0.75, 1.25),
      minimapOpacity: bounded('minimapOpacity', 0.45, 1),
      screenShake: this.readRaw('screenShake', 'true') !== 'false',
      screenShakeStrength: bounded('screenShakeStrength', 0, 1),
      damageVignette: this.readRaw('damageVignette', 'true') !== 'false',
      damageVignetteIntensity: bounded('damageVignetteIntensity', 0, 1),
      autoSprint: this.readRaw('autoSprint', 'true') !== 'false',
      audioEnabled: this.readRaw('audioEnabled', 'true') !== 'false',
      masterVolume: clamp(Number.isFinite(storedVolume) ? storedVolume : GAMEPLAY_DEFAULTS.masterVolume, 0, 1),
      hudScale: bounded('hudScale', 0.8, 1.2),
      killFeedScale: bounded('killFeedScale', 0.8, 1.2),
      showFps: this.readRaw('showFps', 'false') === 'true'
    };
  }

  setGameplay(key, value) {
    if (!(key in GAMEPLAY_DEFAULTS)) return this.gameplay();
    let normalized = value;
    if (key === 'sensitivity') normalized = clamp(Number(value) || 1, 0.35, 2.5).toFixed(2);
    if (['masterVolume', 'minimapOpacity', 'screenShakeStrength', 'damageVignetteIntensity'].includes(key)) {
      const numeric = Number(value);
      normalized = clamp(Number.isFinite(numeric) ? numeric : GAMEPLAY_DEFAULTS[key], 0, 1).toFixed(2);
    }
    if (['minimapScale', 'hudScale', 'killFeedScale'].includes(key)) {
      const numeric = Number(value);
      const lower = key === 'minimapScale' ? 0.75 : 0.8;
      const upper = key === 'minimapScale' ? 1.25 : 1.2;
      normalized = clamp(Number.isFinite(numeric) ? numeric : GAMEPLAY_DEFAULTS[key], lower, upper).toFixed(2);
    }
    if (key === 'aiDifficulty') normalized = AI_MULTIPLIERS[value] ? value : GAMEPLAY_DEFAULTS.aiDifficulty;
    if (key === 'minimapMode') normalized = value === 'rotate' ? 'rotate' : 'north-up';
    if (['screenShake', 'damageVignette', 'autoSprint', 'audioEnabled', 'showFps'].includes(key)) normalized = Boolean(value);
    try { this.storage.setItem(`unblockedtdm.${key}`, String(normalized)); } catch {}
    const gameplay = this.gameplay();
    emitChange({ gameplay, bindings: this.bindings() });
    return gameplay;
  }

  resetGameplay() {
    for (const [key, value] of Object.entries(GAMEPLAY_DEFAULTS)) this.setGameplay(key, value);
    return this.gameplay();
  }

  bindings() {
    let stored = {};
    try {
      const raw = this.storage.getItem(BINDINGS_KEY);
      if (raw) stored = JSON.parse(raw) || {};
    } catch {}
    const next = { ...DEFAULT_BINDINGS };
    for (const action of Object.keys(DEFAULT_BINDINGS)) {
      const code = stored[action];
      if (typeof code === 'string' && code.length > 0 && !RESERVED_CODES.has(code)) next[action] = code;
    }
    return next;
  }

  binding(action) {
    return this.bindings()[action] || DEFAULT_BINDINGS[action] || null;
  }

  setBinding(action, code) {
    if (!(action in DEFAULT_BINDINGS) || typeof code !== 'string' || !code || RESERVED_CODES.has(code)) {
      return { ok: false, reason: 'reserved-or-invalid', bindings: this.bindings() };
    }
    const current = this.bindings();
    const previous = current[action];
    const conflict = Object.entries(current).find(([otherAction, otherCode]) => otherAction !== action && otherCode === code);
    if (conflict) current[conflict[0]] = previous;
    current[action] = code;
    try { this.storage.setItem(BINDINGS_KEY, JSON.stringify(current)); } catch {}
    emitChange({ gameplay: this.gameplay(), bindings: current });
    return { ok: true, swappedAction: conflict?.[0] || null, bindings: current };
  }

  resetBindings() {
    const defaults = { ...DEFAULT_BINDINGS };
    try { this.storage.setItem(BINDINGS_KEY, JSON.stringify(defaults)); } catch {}
    emitChange({ gameplay: this.gameplay(), bindings: defaults });
    return defaults;
  }
}

export function bindingLabel(code) {
  if (!code) return 'UNBOUND';
  if (code.startsWith('Mouse')) {
    const button = Number(code.slice(5));
    if (button === 0) return 'MOUSE 1';
    if (button === 1) return 'MOUSE 3';
    if (button === 2) return 'MOUSE 2';
    return `MOUSE ${button + 1}`;
  }
  if (code === 'Space') return 'SPACE';
  if (code === 'ShiftLeft') return 'L SHIFT';
  if (code === 'ShiftRight') return 'R SHIFT';
  if (code === 'ControlLeft') return 'L CTRL';
  if (code === 'ControlRight') return 'R CTRL';
  if (code === 'AltLeft') return 'L ALT';
  if (code === 'AltRight') return 'R ALT';
  if (code === 'Tab') return 'TAB';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return `NUM ${code.slice(6)}`;
  if (code.startsWith('Arrow')) return code.slice(5).toUpperCase();
  return code.replace(/([a-z])([A-Z])/g, '$1 $2').toUpperCase();
}

export function mouseBindingCode(button) {
  return `Mouse${Math.max(0, Number(button) || 0)}`;
}
