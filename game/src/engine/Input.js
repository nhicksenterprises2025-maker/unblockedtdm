const BLOCKED_KEYS = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'ShiftLeft', 'ShiftRight', 'Tab', 'F1'
]);

export class Input {
  constructor(target = window) {
    this.down = new Set();
    this.pressed = new Set();
    this.pointer = { x: innerWidth / 2, y: innerHeight / 2, inside: true };

    this.onKeyDown = (event) => {
      if (BLOCKED_KEYS.has(event.code)) event.preventDefault();
      if (!this.down.has(event.code)) this.pressed.add(event.code);
      this.down.add(event.code);
    };
    this.onKeyUp = (event) => this.down.delete(event.code);
    this.onPointerMove = (event) => {
      this.pointer.x = event.clientX;
      this.pointer.y = event.clientY;
      this.pointer.inside = true;
    };
    this.onPointerLeave = () => {
      this.pointer.inside = false;
    };
    this.onBlur = () => {
      this.down.clear();
      this.pressed.clear();
    };

    target.addEventListener('keydown', this.onKeyDown);
    target.addEventListener('keyup', this.onKeyUp);
    target.addEventListener('pointermove', this.onPointerMove);
    target.addEventListener('pointerleave', this.onPointerLeave);
    target.addEventListener('blur', this.onBlur);
  }

  isDown(...codes) {
    return codes.some((code) => this.down.has(code));
  }

  wasPressed(code) {
    return this.pressed.has(code);
  }

  axis() {
    let x = 0;
    let y = 0;
    if (this.isDown('KeyA', 'ArrowLeft')) x -= 1;
    if (this.isDown('KeyD', 'ArrowRight')) x += 1;
    if (this.isDown('KeyW', 'ArrowUp')) y -= 1;
    if (this.isDown('KeyS', 'ArrowDown')) y += 1;
    if (x && y) {
      const inv = Math.SQRT1_2;
      x *= inv;
      y *= inv;
    }
    return { x, y };
  }

  sprintHeld() {
    return this.isDown('ShiftLeft', 'ShiftRight');
  }

  pointerPosition() {
    return { ...this.pointer };
  }

  endFrame() {
    this.pressed.clear();
  }
}
