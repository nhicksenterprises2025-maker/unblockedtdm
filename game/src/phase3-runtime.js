import { MatchManager } from './match/MatchManager.js';
import { MinimapRenderer } from './render/MinimapRenderer.js';
import { TacticalHUD } from './ui/TacticalHUD.js';
import { assignBotGamertags } from './data/Gamertags.js';

let matchRef = null;
let tacticalHud = null;
let tacticalMapRenderer = null;
let wasMatchSessionActive = false;
const eliminationMeta = new Map();

function ensureHud(match) {
  if (!match || tacticalHud) return;
  assignBotGamertags(match.players);
  const localPlayer = match.players.find((player) => player.isLocal) || match.players[0] || null;
  tacticalHud = new TacticalHUD({ players: match.players, localPlayer });
  tacticalMapRenderer = new MinimapRenderer(tacticalHud.mapCanvas, match.spawnSystem.map);
  tacticalHud.minimapRenderer = tacticalMapRenderer;
}

function captureMatch(match) {
  if (!match) return;
  matchRef = match;
  ensureHud(match);
}

const originalSnapshot = MatchManager.prototype.snapshot;
MatchManager.prototype.snapshot = function phase3Snapshot(...args) {
  captureMatch(this);
  return originalSnapshot.apply(this, args);
};

const originalRecordElimination = MatchManager.prototype.recordElimination;
MatchManager.prototype.recordElimination = function phase3RecordElimination(attacker, victim, result = {}) {
  captureMatch(this);
  const meta = eliminationMeta.get(victim?.id) || {
    weaponId: result?.sourceType || null,
    critical: Boolean(result?.critical)
  };
  const outcome = originalRecordElimination.call(this, attacker, victim, result);
  tacticalHud?.recordKill({ attacker: outcome?.killer || (outcome?.counted ? attacker : null), victim }, meta);
  if (victim?.id) eliminationMeta.delete(victim.id);
  return outcome;
};

window.addEventListener('unblockedtdm:damage-applied', (event) => {
  const detail = event.detail || {};
  if (detail.target?.id && detail.result?.killed) {
    eliminationMeta.set(detail.target.id, {
      weaponId: detail.sourceType || null,
      critical: Boolean(detail.critical)
    });
  }
  if (matchRef) matchRef.recordDamage(detail);
});

const tacticalHudTimer = window.setInterval(() => {
  if (!matchRef || !tacticalHud) return;
  const matchStarted = document.body.classList.contains('match-started');
  const paused = document.getElementById('pausePanel')?.classList.contains('visible');
  const matchSessionActive = matchStarted && matchRef.state !== 'match-over';
  const visible = matchSessionActive && !paused && !document.hidden;

  if (matchSessionActive && !wasMatchSessionActive) tacticalHud.reset();
  tacticalHud.setActive(visible);
  wasMatchSessionActive = matchSessionActive;

  if (!visible) return;
  const localPlayer = matchRef.players.find((player) => player.isLocal) || matchRef.players[0] || null;
  if (tacticalMapRenderer && localPlayer) {
    tacticalMapRenderer.observeEnemyFire(matchRef.players, localPlayer, performance.now() / 1000);
  }
  tacticalHud.update(matchRef.snapshot(), matchRef.statsSnapshot());
}, 100);
window.addEventListener('beforeunload', () => window.clearInterval(tacticalHudTimer), { once:true });
