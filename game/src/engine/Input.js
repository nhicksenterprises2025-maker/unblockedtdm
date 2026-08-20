import { mouseBindingCode } from './GameSettings.js';

const FIXED_BLOCKED_KEYS = new Set(['F1', 'F11']);
const UI_SELECTOR = 'button,input,select,textarea,[contenteditable="true"],[data-ui-surface],.debug-controls,.loadout-screen,.round-loadout-panel,.pause-panel,.main-menu';
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function isUiTarget(target) {
  return Boolean(target?.closest?.(UI_SELECTOR));
}

export class Input {
  constructor(target = window, settings = null) {
    this.target = target;
    this.settings = settings;
    this.down = new Set();
    this.pressed = new Set();
    this.mouseDown = new Set();
    this.mousePressed = new Set();
    this.wheelDirection = 0;
    this.suspended = false;

    const centerX = innerWidth / 2;
    const centerY = innerHeight / 2;
    this.rawPointer = { x: centerX, y: centerY, inside: true };
    this.pointer = { x: centerX, y: centerY, inside: true };
    this.aimVelocity = { x: 0, y: 0 };
    this.lastAimClock = performance.now();
    this.sensitivity = 1;
    try { this.setSensitivity(this.settings?.gameplay?.().sensitivity ?? localStorage.getItem('unblockedtdm.sensitivity') ?? 1); } catch {}

    this.onKeyDown = (event) => {
      if (this.suspended || isUiTarget(event.target)) return;
      if (this.shouldBlockKey(event.code)) event.preventDefault();
      if (!this.down.has(event.code)) this.pressed.add(event.code);
      this.down.add(event.code);
    };

    this.onKeyUp = (event) => {
      this.down.delete(event.code);
    };

    this.onMouseDown = (event) => {
      if (this.suspended || isUiTarget(event.target)) return;
      if (!this.mouseDown.has(event.button)) this.mousePressed.add(event.button);
      this.mouseDown.add(event.button);
      if (event.button === 0 || event.button === 2) event.preventDefault();
    };

    this.onMouseUp = (event) => {
      this.mouseDown.delete(event.button);
      if (!this.suspended && !isUiTarget(event.target) && (event.button === 0 || event.button === 2)) event.preventDefault();
    };

    this.onWheel = (event) => {
      if (this.suspended || isUiTarget(event.target)) return;
      this.wheelDirection = event.deltaY < 0 ? -1 : 1;
      event.preventDefault();
    };

    this.onPointerMove = (event) => {
      this.rawPointer.x = event.clientX;
      this.rawPointer.y = event.clientY;
      this.rawPointer.inside = true;
    };

    this.onPointerLeave = () => {
      this.rawPointer.inside = false;
      this.pointer.inside = false;
    };

    this.onBlur = () => this.clearTransientState();

    target.addEventListener('keydown', this.onKeyDown);
    target.addEventListener('keyup', this.onKeyUp);
    target.addEventListener('mousedown', this.onMouseDown);
    target.addEventListener('mouseup', this.onMouseUp);
    target.addEventListener('wheel', this.onWheel, { passive: false });
    target.addEventListener('pointermove', this.onPointerMove);
    target.addEventListener('pointerleave', this.onPointerLeave);
    target.addEventListener('blur', this.onBlur);
    target.addEventListener('contextmenu', (event) => {
      if (!isUiTarget(event.target)) event.preventDefault();
    });
  }

  clearTransientState() {
    this.down.clear();
    this.pressed.clear();
    this.mouseDown.clear();
    this.mousePressed.clear();
    this.wheelDirection = 0;
    this.aimVelocity.x = 0;
    this.aimVelocity.y = 0;
  }

  setSuspended(value) {
    const next = Boolean(value);
    if (next === this.suspended) return;
    this.suspended = next;
    this.clearTransientState();
  }

  shouldBlockKey(code) {
    if (FIXED_BLOCKED_KEYS.has(code)) return true;
    const bindings = this.settings?.bindings?.() || {};
    return Object.values(bindings).includes(code);
  }

  setSensitivity(value) {
    this.sensitivity = clamp(Number(value) || 1, 0.35, 2.5);
  }

  aimSensitivity() {
    try {
      const stored = this.settings?.gameplay?.().sensitivity ?? Number(localStorage.getItem('unblockedtdm.sensitivity'));
      if (Number.isFinite(stored) && stored > 0) this.setSensitivity(stored);
    } catch {}
    return this.sensitivity;
  }

  updateAimPointer() {
    if (this.suspended) return;
    const now = performance.now();
    const dt = clamp((now - this.lastAimClock) / 1000, 0, 0.05);
    this.lastAimClock = now;
    if (dt <= 0) return;

    const sensitivity = this.aimSensitivity();
    const errorX = this.rawPointer.x - this.pointer.x;
    const errorY = this.rawPointer.y - this.pointer.y;
    const errorDistance = Math.hypot(errorX, errorY);

    const precisionRadius = 18 + sensitivity * 4;
    if (errorDistance <= precisionRadius) {
      const settle = 1 - Math.exp(-(46 + 18 * sensitivity) * dt);
      this.pointer.x += errorX * settle;
      this.pointer.y += errorY * settle;
      const damping = Math.exp(-34 * dt);
      this.aimVelocity.x *= damping;
      this.aimVelocity.y *= damping;
      if (errorDistance < 0.65) {
        this.pointer.x = this.rawPointer.x;
        this.pointer.y = this.rawPointer.y;
        this.aimVelocity.x = 0;
        this.aimVelocity.y = 0;
      }
    } else {
      const response = 24 + 18 * sensitivity;
      const maxSpeed = 1400 + 2200 * sensitivity;
      let desiredVX = errorX * response;
      let desiredVY = errorY * response;
      const desiredSpeed = Math.hypot(desiredVX, desiredVY);
      if (desiredSpeed > maxSpeed) {
        const scale = maxSpeed / desiredSpeed;
        desiredVX *= scale;
        desiredVY *= scale;
      }
      const velocityBlend = 1 - Math.exp(-(24 + 10 * sensitivity) * dt);
      this.aimVelocity.x += (desiredVX - this.aimVelocity.x) * velocityBlend;
      this.aimVelocity.y += (desiredVY - this.aimVelocity.y) * velocityBlend;

      const previousErrorX = errorX;
      const previousErrorY = errorY;
      this.pointer.x = clamp(this.pointer.x + this.aimVelocity.x * dt, 0, innerWidth);
      this.pointer.y = clamp(this.pointer.y + this.aimVelocity.y * dt, 0, innerHeight);
      const nextErrorX = this.rawPointer.x - this.pointer.x;
      const nextErrorY = this.rawPointer.y - this.pointer.y;
      if (previousErrorX * nextErrorX + previousErrorY * nextErrorY < 0) {
        this.pointer.x = this.rawPointer.x;
        this.pointer.y = this.rawPointer.y;
        this.aimVelocity.x = 0;
        this.aimVelocity.y = 0;
      }
    }

    this.pointer.inside = this.rawPointer.inside;
  }

  binding(action) {
    return this.settings?.binding?.(action) || null;
  }

  controlDown(code) {
    if (!code) return false;
    if (code.startsWith('Mouse')) return this.mouseDown.has(Number(code.slice(5)));
    return this.down.has(code);
  }

  controlPressed(code) {
    if (!code) return false;
    if (code.startsWith('Mouse')) return this.mousePressed.has(Number(code.slice(5)));
    return this.pressed.has(code);
  }

  actionDown(action) {
    return this.controlDown(this.binding(action));
  }

  actionPressed(action) {
    return this.controlPressed(this.binding(action));
  }

  isDown(...codes) { return codes.some((code) => this.down.has(code)); }
  wasPressed(...codes) { return codes.some((code) => this.pressed.has(code)); }

  axis() {
    let x = 0;
    let y = 0;
    if (this.actionDown('moveLeft') || this.isDown('ArrowLeft')) x -= 1;
    if (this.actionDown('moveRight') || this.isDown('ArrowRight')) x += 1;
    if (this.actionDown('moveUp') || this.isDown('ArrowUp')) y -= 1;
    if (this.actionDown('moveDown') || this.isDown('ArrowDown')) y += 1;
    if (x && y) {
      x *= Math.SQRT1_2;
      y *= Math.SQRT1_2;
    }
    return { x, y };
  }

  sprintHeld() { return this.actionDown('sprint'); }
  dashPressed() { return this.actionPressed('dash'); }
  reloadPressed() { return this.actionPressed('reload'); }
  slotPrimaryPressed() { return this.actionPressed('primary') || this.wheelDirection < 0; }
  slotSecondaryPressed() { return this.actionPressed('secondary') || this.wheelDirection > 0; }
  fireHeld() { return this.actionDown('fire'); }
  firePressed() { return this.actionPressed('fire'); }
  adsHeld() { return this.actionDown('ads'); }

  pointerPosition() {
    return { ...this.pointer };
  }

  endFrame() {
    this.pressed.clear();
    this.mousePressed.clear();
    this.wheelDirection = 0;
  }
}

export { isUiTarget, mouseBindingCode };
