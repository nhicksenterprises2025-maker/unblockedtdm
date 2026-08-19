import { DEATH_PARTICLE_COUNT } from '../engine/constants.js';

const TEAM_COLOR = {
  blue: '#55cfff',
  red: '#ff6278'
};

export class DamageFeedbackRenderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.particles = [];
  }

  spawnDeathBurst(player) {
    const color = TEAM_COLOR[player.team] || TEAM_COLOR.blue;
    for (let index = 0; index < DEATH_PARTICLE_COUNT; index += 1) {
      const angle = (index / DEATH_PARTICLE_COUNT) * Math.PI * 2 + Math.random() * 0.32;
      const speed = 85 + Math.random() * 165;
      this.particles.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.42 + Math.random() * 0.38,
        maxLife: 0.8,
        size: 2.5 + Math.random() * 4.5,
        color
      });
    }
  }

  update(dt) {
    for (const particle of this.particles) {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= Math.exp(-4.2 * dt);
      particle.vy *= Math.exp(-4.2 * dt);
      particle.vy += 34 * dt;
    }
    this.particles = this.particles.filter((particle) => particle.life > 0);
  }

  drawPlayerFeedback(player) {
    if (!player.health?.alive) return;
    const ctx = this.ctx;
    const flash = player.health.hitFlashPercent();
    if (flash > 0) {
      ctx.save();
      ctx.globalAlpha = flash * 0.48;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(player.x - 2, player.y, 18, 14, player.visualAimAngle, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(
        player.x + Math.cos(player.visualAimAngle) * 9,
        player.y + Math.sin(player.visualAimAngle) * 9,
        10.5,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();
    }

    const opacity = player.health.healthBarOpacity();
    if (opacity > 0) {
      const width = 42;
      const height = 4;
      const x = player.x - width / 2;
      const y = player.y - 38;
      const ratio = player.health.healthPercent();

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.fillStyle = 'rgba(5,15,21,.78)';
      ctx.fillRect(x - 1, y - 1, width + 2, height + 2);
      ctx.fillStyle = ratio > 0.5 ? '#79e89f' : ratio > 0.25 ? '#f0c85a' : '#ff6676';
      ctx.fillRect(x, y, width * ratio, height);
      ctx.restore();
    }
  }

  drawWorld() {
    const ctx = this.ctx;
    ctx.save();
    for (const particle of this.particles) {
      const alpha = Math.max(0, Math.min(1, particle.life / particle.maxLife));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * (0.55 + alpha * 0.45), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawScreen(player, width, height) {
    const health = player.health;
    if (!health) return;

    const recentHit = health.vignettePercent();
    const lowHealth = health.alive ? Math.max(0, (0.5 - health.healthPercent()) / 0.5) : 0;
    const intensity = Math.min(0.55, recentHit * 0.28 + lowHealth * 0.24);

    if (intensity > 0.002) {
      const ctx = this.ctx;
      const gradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.24,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.72
      );
      gradient.addColorStop(0, 'rgba(140,0,16,0)');
      gradient.addColorStop(0.64, `rgba(150,0,18,${intensity * 0.14})`);
      gradient.addColorStop(1, `rgba(135,0,14,${intensity})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    const indicator = health.indicatorPercent();
    if (indicator > 0 && health.alive) {
      const ctx = this.ctx;
      const angle = health.damageIndicatorAngle;
      const radius = Math.min(112, Math.min(width, height) * 0.14);
      const cx = width / 2 + Math.cos(angle) * radius;
      const cy = height / 2 + Math.sin(angle) * radius;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle + Math.PI / 2);
      ctx.globalAlpha = indicator * 0.9;
      ctx.fillStyle = '#ff6474';
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(7, 6);
      ctx.lineTo(0, 3);
      ctx.lineTo(-7, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
}
