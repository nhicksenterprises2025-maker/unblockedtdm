const BLOCKED_KEYS = new Set([
  'KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight',
  'ShiftLeft','ShiftRight','Space','Tab','KeyR','Digit1','Digit2','F1','F2','F3','F4','F6'
]);

export class Input {
  constructor(target = window) {
    this.down = new Set();
    this.pressed = new Set();
    this.mouseDown = new Set();
    this.mousePressed = new Set();
    this.pointer = { x: innerWidth / 2, y: innerHeight / 2, inside: true };

    this.onKeyDown = (event) => {
      if (BLOCKED_KEYS.has(event.code)) event.preventDefault();
      if (!this.down.has(event.code)) this.pressed.add(event.code);
      this.down.add(event.code);
    };
    this.onKeyUp = (event) => this.down.delete(event.code);

    // Mouse events are intentionally used instead of pointerdown/pointerup here.
    // Pointer Events only emit pointerdown for the first pressed mouse button,
    // which broke RMB (ADS) + LMB (fire) chords in Build 1.13 v1.
    this.onMouseDown = (event) => {
      if (!this.mouseDown.has(event.button)) this.mousePressed.add(event.button);
      this.mouseDown.add(event.button);
      if (event.button === 0 || event.button === 2) event.preventDefault();
    };
    this.onMouseUp = (event) => {
      this.mouseDown.delete(event.button);
      if (event.button === 0 || event.button === 2) event.preventDefault();
    };
    this.onPointerMove = (event) => {
      this.pointer.x = event.clientX;
      this.pointer.y = event.clientY;
      this.pointer.inside = true;
    };
    this.onPointerLeave = () => { this.pointer.inside = false; };
    this.onBlur = () => {
      this.down.clear();
      this.pressed.clear();
      this.mouseDown.clear();
      this.mousePressed.clear();
    };

    target.addEventListener('keydown', this.onKeyDown);
    target.addEventListener('keyup', this.onKeyUp);
    target.addEventListener('mousedown', this.onMouseDown);
    target.addEventListener('mouseup', this.onMouseUp);
    target.addEventListener('pointermove', this.onPointerMove);
    target.addEventListener('pointerleave', this.onPointerLeave);
    target.addEventListener('blur', this.onBlur);
    target.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  isDown(...codes) { return codes.some((code) => this.down.has(code)); }
  wasPressed(code) { return this.pressed.has(code); }
  axis() {
    let x=0,y=0;
    if (this.isDown('KeyA','ArrowLeft')) x-=1;
    if (this.isDown('KeyD','ArrowRight')) x+=1;
    if (this.isDown('KeyW','ArrowUp')) y-=1;
    if (this.isDown('KeyS','ArrowDown')) y+=1;
    if (x && y) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
    return {x,y};
  }
  sprintHeld() { return this.isDown('ShiftLeft','ShiftRight'); }
  dashPressed() { return this.wasPressed('Space'); }
  reloadPressed() { return this.wasPressed('KeyR'); }
  slotPrimaryPressed() { return this.wasPressed('Digit1'); }
  slotSecondaryPressed() { return this.wasPressed('Digit2'); }
  fireHeld() { return this.mouseDown.has(0); }
  firePressed() { return this.mousePressed.has(0); }
  adsHeld() { return this.mouseDown.has(2); }
  pointerPosition() { return { ...this.pointer }; }
  endFrame() { this.pressed.clear(); this.mousePressed.clear(); }
}
