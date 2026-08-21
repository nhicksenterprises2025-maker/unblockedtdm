const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const WEAPON_PROFILES = Object.freeze({
  'assault-rifle': { freq: 118, crack: 1750, duration: 0.115, gain: 0.32, noise: 0.36 },
  smg: { freq: 154, crack: 2200, duration: 0.075, gain: 0.25, noise: 0.31 },
  sniper: { freq: 72, crack: 2850, duration: 0.29, gain: 0.48, noise: 0.46 },
  shotgun: { freq: 82, crack: 950, duration: 0.22, gain: 0.45, noise: 0.58 },
  lmg: { freq: 92, crack: 1350, duration: 0.15, gain: 0.39, noise: 0.43 },
  pistol: { freq: 188, crack: 2600, duration: 0.095, gain: 0.25, noise: 0.26 },
  launcher: { freq: 56, crack: 420, duration: 0.34, gain: 0.43, noise: 0.48 },
  melee: { freq: 340, crack: 0, duration: 0.16, gain: 0.19, noise: 0.20 }
});

export class AudioSystem {
  constructor(settings) {
    this.settings = settings;
    this.context = null;
    this.master = null;
    this.lastPlayed = new Map();
    this.noiseBuffer = null;
    this.unlocked = false;
    this.sync();
    window.addEventListener('unblockedtdm:settings-change', () => this.sync());
    const unlock = () => this.ensure().catch(() => {});
    window.addEventListener('pointerdown', unlock, { once: true, capture: true });
    window.addEventListener('keydown', unlock, { once: true, capture: true });
  }

  config() {
    return this.settings?.gameplay?.() || { audioEnabled: true, masterVolume: 0.75 };
  }

  async ensure() {
    if (!this.context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return false;
      this.context = new AudioContextClass();
      this.master = this.context.createGain();
      this.master.connect(this.context.destination);
      this.noiseBuffer = this.createNoiseBuffer();
    }
    if (this.context.state === 'suspended') await this.context.resume();
    this.unlocked = true;
    this.sync();
    return true;
  }

  createNoiseBuffer() {
    const length = Math.max(1, Math.floor(this.context.sampleRate * 0.65));
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  sync() {
    if (!this.master || !this.context) return;
    const config = this.config();
    const target = config.audioEnabled ? clamp(Number(config.masterVolume ?? 0.75), 0, 1) : 0;
    this.master.gain.setTargetAtTime(target, this.context.currentTime, 0.02);
  }

  canPlay(key, cooldown = 0) {
    const config = this.config();
    if (!config.audioEnabled) return false;
    const now = performance.now() / 1000;
    const last = this.lastPlayed.get(key) || -Infinity;
    if (now - last < cooldown) return false;
    this.lastPlayed.set(key, now);
    return true;
  }

  spatialNodes({ pan = 0, distance = 0, maxDistance = 1200 } = {}) {
    const gain = this.context.createGain();
    const distanceGain = clamp(1 - Math.max(0, distance) / Math.max(1, maxDistance), 0.08, 1);
    gain.gain.value = distanceGain;
    let tail = gain;
    if (this.context.createStereoPanner) {
      const panner = this.context.createStereoPanner();
      panner.pan.value = clamp(pan, -1, 1);
      gain.connect(panner);
      tail = panner;
    }
    tail.connect(this.master);
    return gain;
  }

  tone({ frequency = 220, endFrequency = null, duration = 0.1, gain = 0.2, type = 'square', pan = 0, distance = 0, maxDistance = 1200, delay = 0 } = {}) {
    if (!this.context || !this.master) return;
    const start = this.context.currentTime + delay;
    const osc = this.context.createOscillator();
    const envelope = this.context.createGain();
    const spatial = this.spatialNodes({ pan, distance, maxDistance });
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, frequency), start);
    if (endFrequency) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), start + Math.min(0.012, duration * 0.2));
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(envelope);
    envelope.connect(spatial);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  noise({ duration = 0.1, gain = 0.18, highpass = 120, lowpass = 9000, pan = 0, distance = 0, maxDistance = 1200, delay = 0 } = {}) {
    if (!this.context || !this.noiseBuffer) return;
    const start = this.context.currentTime + delay;
    const source = this.context.createBufferSource();
    source.buffer = this.noiseBuffer;
    const hp = this.context.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = highpass;
    const lp = this.context.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = lowpass;
    const envelope = this.context.createGain();
    const spatial = this.spatialNodes({ pan, distance, maxDistance });
    envelope.gain.setValueAtTime(Math.max(0.0002, gain), start);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(hp); hp.connect(lp); lp.connect(envelope); envelope.connect(spatial);
    source.start(start, Math.random() * 0.18, duration + 0.02);
  }

  async weapon(id, spatial = {}) {
    const normalized = id === 'shotgun-pellet' ? 'shotgun' : id;
    const profile = WEAPON_PROFILES[normalized] || WEAPON_PROFILES['assault-rifle'];
    const cooldown = normalized === 'shotgun' ? 0.12 : normalized === 'melee' ? 0.22 : 0.025;
    if (!this.canPlay(`weapon:${normalized}`, cooldown) || !(await this.ensure())) return;
    const { pan = 0, distance = 0 } = spatial;
    if (normalized === 'melee') {
      this.noise({ duration: 0.12, gain: 0.18, highpass: 500, lowpass: 5200, pan, distance });
      this.tone({ frequency: 420, endFrequency: 155, duration: 0.13, gain: 0.09, type: 'triangle', pan, distance });
      return;
    }
    this.tone({ frequency: profile.freq, endFrequency: Math.max(35, profile.freq * 0.45), duration: profile.duration, gain: profile.gain, type: normalized === 'sniper' || normalized === 'launcher' ? 'sawtooth' : 'square', pan, distance });
    this.noise({ duration: profile.duration * 0.8, gain: profile.noise, highpass: normalized === 'launcher' ? 45 : 180, lowpass: normalized === 'sniper' ? 11500 : 7600, pan, distance });
    if (profile.crack > 0) this.tone({ frequency: profile.crack, endFrequency: profile.crack * 0.62, duration: Math.min(0.045, profile.duration), gain: profile.gain * 0.42, type: 'square', pan, distance });
  }

  async explosion({ pan = 0, distance = 0 } = {}) {
    if (!this.canPlay('explosion', 0.08) || !(await this.ensure())) return;
    this.tone({ frequency: 62, endFrequency: 28, duration: 0.48, gain: 0.52, type: 'sine', pan, distance, maxDistance: 1600 });
    this.noise({ duration: 0.44, gain: 0.52, highpass: 28, lowpass: 2200, pan, distance, maxDistance: 1600 });
    this.noise({ duration: 0.18, gain: 0.28, highpass: 1400, lowpass: 9800, pan, distance, maxDistance: 1600 });
  }

  async dryFire() {
    if (!this.canPlay('dry', 0.12) || !(await this.ensure())) return;
    this.tone({ frequency: 1100, endFrequency: 480, duration: 0.045, gain: 0.08, type: 'square' });
  }

  async swap() {
    if (!this.canPlay('swap', 0.14) || !(await this.ensure())) return;
    this.noise({ duration: 0.075, gain: 0.07, highpass: 500, lowpass: 2600 });
    this.tone({ frequency: 290, endFrequency: 510, duration: 0.06, gain: 0.05, type: 'triangle', delay: 0.035 });
  }

  async reload(shell = false) {
    if (!this.canPlay(shell ? 'shell' : 'reload', shell ? 0.18 : 0.45) || !(await this.ensure())) return;
    this.tone({ frequency: shell ? 720 : 430, endFrequency: shell ? 410 : 245, duration: 0.07, gain: 0.07, type: 'square' });
    this.tone({ frequency: shell ? 880 : 610, endFrequency: shell ? 620 : 390, duration: 0.06, gain: 0.045, type: 'triangle', delay: 0.08 });
  }

  async footstep(sprint = false) {
    if (!this.canPlay('footstep', sprint ? 0.23 : 0.34) || !(await this.ensure())) return;
    this.noise({ duration: sprint ? 0.075 : 0.06, gain: sprint ? 0.09 : 0.06, highpass: 70, lowpass: 780 });
    this.tone({ frequency: sprint ? 95 : 82, endFrequency: 48, duration: 0.07, gain: sprint ? 0.08 : 0.055, type: 'sine' });
  }

  async ui(kind = 'click') {
    const profiles = {
      hover: [620, 760, 0.035, 0.022],
      click: [480, 290, 0.055, 0.045],
      confirm: [430, 760, 0.09, 0.055],
      back: [520, 280, 0.075, 0.045],
      error: [180, 120, 0.12, 0.065]
    };
    if (!this.canPlay(`ui:${kind}`, kind === 'hover' ? 0.055 : 0.035) || !(await this.ensure())) return;
    const [from, to, duration, gain] = profiles[kind] || profiles.click;
    this.tone({ frequency: from, endFrequency: to, duration, gain, type: 'triangle' });
  }
}
