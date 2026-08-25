import { MAX_DT } from './constants.js';

export class GameLoop {
  constructor(update, render) {
    this.update = update;
    this.render = render;
    this.running = false;
    this.paused = false;
    this.lastTime = 0;
    this.raf = 0;
    this.frame = this.frame.bind(this);
    this.onVisibilityChange = this.onVisibilityChange.bind(this);
    if (globalThis.document?.addEventListener) document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  onVisibilityChange() {
    this.lastTime = performance.now();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  setPaused(value) {
    this.paused = Boolean(value);
    this.lastTime = performance.now();
  }

  frame(now) {
    if (!this.running) return;
    if (globalThis.document?.hidden) {
      this.lastTime = now;
      this.raf = requestAnimationFrame(this.frame);
      return;
    }
    const dt = Math.min((now - this.lastTime) / 1000, MAX_DT);
    this.lastTime = now;
    if (!this.paused) this.update(dt, now);
    this.render(dt, now, this.paused);
    this.raf = requestAnimationFrame(this.frame);
  }
}
