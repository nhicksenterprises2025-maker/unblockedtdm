const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.compressor = null;
    this.enabled = true;
    this.volume = 0.75;
    this.listener = null;
    this.stepTimers = new WeakMap();
  }

  configure(gameplay = {}) {
    this.enabled = gameplay.audioEnabled !== false;
    this.volume = clamp(Number(gameplay.masterVolume ?? 0.75), 0, 1);
    if (this.master) this.master.gain.setTargetAtTime(this.enabled ? this.volume : 0, this.ctx.currentTime, 0.02);
  }

  setListener(player) {
    if (player?.isLocal) this.listener = player;
  }

  ensure() {
    if (!this.enabled) return null;
    const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!this.ctx) {
      this.ctx = new AudioContextClass();
      this.master = this.ctx.createGain();
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -16;
      this.compressor.knee.value = 18;
      this.compressor.ratio.value = 5;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.18;
      this.master.gain.value = this.enabled ? this.volume : 0;
      this.compressor.connect(this.master);
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return this.ctx;
  }

  spatial(source) {
    if (!source || !this.listener || source === this.listener) return { pan: 0, gain: 1 };
    const dx = Number(source.x || 0) - Number(this.listener.x || 0);
    const dy = Number(source.y || 0) - Number(this.listener.y || 0);
    const distanceTiles = Math.hypot(dx, dy) / 64;
    return {
      pan: clamp(dx / (14 * 64), -0.92, 0.92),
      gain: clamp(1 - distanceTiles / 26, 0.08, 1)
    };
  }

  route(source, gainScale = 1) {
    const ctx = this.ensure();
    if (!ctx) return null;
    const spatial = this.spatial(source);
    const gain = ctx.createGain();
    gain.gain.value = clamp(spatial.gain * gainScale, 0, 1.5);
    let output = gain;
    if (ctx.createStereoPanner) {
      const panner = ctx.createStereoPanner();
      panner.pan.value = spatial.pan;
      gain.connect(panner);
      panner.connect(this.compressor);
      output = gain;
    } else {
      gain.connect(this.compressor);
    }
    return { ctx, input: output, gain };
  }

  tone({ source = null, frequency = 180, endFrequency = null, duration = 0.08, gain = 0.12, type = 'square', delay = 0 }) {
    const route = this.route(source, 1);
    if (!route) return;
    const { ctx, input } = route;
    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();
    const start = ctx.currentTime + delay;
    const end = start + duration;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(20, frequency), start);
    if (endFrequency != null) oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), end);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), start + Math.min(0.008, duration * 0.25));
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.connect(envelope);
    envelope.connect(input);
    oscillator.start(start);
    oscillator.stop(end + 0.01);
  }

  noise({ source = null, duration = 0.08, gain = 0.08, delay = 0, highpass = 0, lowpass = 0 }) {
    const route = this.route(source, 1);
    if (!route) return;
    const { ctx, input } = route;
    const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length * 0.35);
    const sourceNode = ctx.createBufferSource();
    sourceNode.buffer = buffer;
    let node = sourceNode;
    if (highpass > 0) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = highpass;
      node.connect(filter);
      node = filter;
    }
    if (lowpass > 0) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = lowpass;
      node.connect(filter);
      node = filter;
    }
    const envelope = ctx.createGain();
    const start = ctx.currentTime + delay;
    envelope.gain.setValueAtTime(Math.max(0.0002, gain), start);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    node.connect(envelope);
    envelope.connect(input);
    sourceNode.start(start);
  }

  playWeapon(owner, weapon) {
    if (!weapon) return;
    const id = weapon.id;
    const profiles = {
      'assault-rifle': [132, 74, 0.075, 0.11],
      smg: [188, 96, 0.052, 0.085],
      sniper: [82, 42, 0.19, 0.22],
      shotgun: [92, 46, 0.15, 0.20],
      lmg: [112, 58, 0.105, 0.15],
      pistol: [238, 116, 0.07, 0.09],
      launcher: [68, 34, 0.16, 0.18],
      melee: [150, 80, 0.09, 0.07]
    };
    const [start, end, duration, level] = profiles[id] || profiles['assault-rifle'];
    const type = ['sniper', 'shotgun', 'launcher', 'lmg'].includes(id) ? 'sawtooth' : 'square';
    this.tone({ source: owner, frequency: start, endFrequency: end, duration, gain: level, type });
    this.noise({ source: owner, duration: duration * 0.85, gain: level * 0.55, highpass: id === 'melee' ? 650 : 900, lowpass: id === 'launcher' ? 1700 : 4200 });
    if (id === 'sniper' || id === 'shotgun') this.tone({ source: owner, frequency: start * 1.8, endFrequency: end, duration: duration * 0.65, gain: level * 0.32, delay: 0.018, type: 'triangle' });
  }

  playDry(owner) {
    this.tone({ source: owner, frequency: 950, endFrequency: 620, duration: 0.035, gain: 0.045, type: 'square' });
  }

  playReloadStart(owner, weapon) {
    const heavy = ['lmg', 'sniper', 'launcher'].includes(weapon?.id);
    this.tone({ source: owner, frequency: heavy ? 210 : 310, endFrequency: heavy ? 150 : 220, duration: 0.09, gain: 0.055, type: 'triangle' });
    this.noise({ source: owner, duration: 0.055, gain: 0.03, highpass: 1200, lowpass: 5000, delay: 0.03 });
  }

  playReloadFinish(owner, weapon) {
    this.tone({ source: owner, frequency: weapon?.id === 'lmg' ? 170 : 260, endFrequency: 390, duration: 0.07, gain: 0.052, type: 'square' });
  }

  playShell(owner) {
    this.tone({ source: owner, frequency: 520, endFrequency: 340, duration: 0.045, gain: 0.045, type: 'triangle' });
  }

  playSwap(owner) {
    this.noise({ source: owner, duration: 0.06, gain: 0.025, highpass: 700, lowpass: 2600 });
    this.tone({ source: owner, frequency: 280, endFrequency: 190, duration: 0.055, gain: 0.035, type: 'triangle' });
  }

  playFootstep(actor, sprinting = false) {
    this.tone({ source: actor, frequency: sprinting ? 78 : 92, endFrequency: 54, duration: sprinting ? 0.055 : 0.045, gain: sprinting ? 0.045 : 0.028, type: 'sine' });
    this.noise({ source: actor, duration: 0.035, gain: sprinting ? 0.025 : 0.015, lowpass: 900 });
  }

  updateFootsteps(actor, dt) {
    if (!actor?.health?.alive) return;
    const speed = actor.speedTilesPerSecond?.() || 0;
    if (speed < 0.35 || actor.dashing) {
      this.stepTimers.set(actor, 0);
      return;
    }
    let timer = (this.stepTimers.get(actor) || 0) - dt;
    if (timer <= 0) {
      const sprinting = Boolean(actor.sprinting);
      this.playFootstep(actor, sprinting);
      timer = sprinting ? 0.27 : 0.42;
    }
    this.stepTimers.set(actor, timer);
  }

  playExplosion(point) {
    this.tone({ source: point, frequency: 72, endFrequency: 28, duration: 0.38, gain: 0.28, type: 'sine' });
    this.noise({ source: point, duration: 0.34, gain: 0.20, lowpass: 2200 });
  }

  playUi(kind = 'click') {
    if (kind === 'hover') this.tone({ frequency: 620, endFrequency: 700, duration: 0.025, gain: 0.018, type: 'sine' });
    else if (kind === 'error') this.tone({ frequency: 180, endFrequency: 115, duration: 0.11, gain: 0.05, type: 'square' });
    else if (kind === 'back') this.tone({ frequency: 360, endFrequency: 240, duration: 0.05, gain: 0.03, type: 'triangle' });
    else this.tone({ frequency: 420, endFrequency: 560, duration: 0.045, gain: 0.032, type: 'triangle' });
  }
}
