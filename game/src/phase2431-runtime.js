import { MatchManager } from './match/MatchManager.js';
import {
  ARENA_AP_REWARDS,
  ARENA_RANKS,
  ARENA_STORAGE_KEY,
  ArenaStore,
  arenaNextRankForPoints,
  arenaRankForPoints,
  arenaRankIndex
} from './arena/ArenaStore.js';
import { arenaBadgeMarkup } from './arena/ArenaBadges.js';
import { arenaOpponentTeam, refreshTeamWipeLatch, resolveTeamWipe } from './arena/ArenaTelemetry.js';

function ensureStyle(href) {
  if ([...document.querySelectorAll('link[rel="stylesheet"]')].some((link) => link.getAttribute('href') === href)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

ensureStyle('ui-2.4.3.1.css');
document.body.classList.add('ui-2431');

const arena = new ArenaStore();
const LOCAL_ID = 'local-blue';
const fmt = new Intl.NumberFormat('en-US', { maximumFractionDigits:1 });
const ap = (value) => fmt.format(Math.round((Number(value) || 0) * 2) / 2);
const pct = (value) => `${Math.max(0, Math.min(100, Math.round((Number(value) || 0) * 100)))}%`;
const safe = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));

function randomMatchId() {
  try { return `arena-${crypto.randomUUID()}`; } catch { return `arena-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`; }
}

function resetDateLabel(timestamp) {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', { month:'short', day:'numeric' }).format(date).toUpperCase();
}

function rankRows(rows = []) {
  return [...rows].sort((a, b) =>
    (Number(b.kills || 0) - Number(a.kills || 0)) ||
    (Number(b.damage || 0) - Number(a.damage || 0)) ||
    (Number(a.deaths || 0) - Number(b.deaths || 0)) ||
    String(a.id).localeCompare(String(b.id))
  );
}

function comebackFromHistory(history = [], team = 'blue') {
  let blue = 0;
  let red = 0;
  let downThree = false;
  for (const round of history) {
    if (round?.winner === 'blue') blue += 1;
    if (round?.winner === 'red') red += 1;
    const own = team === 'blue' ? blue : red;
    const other = team === 'blue' ? red : blue;
    if (other - own >= 3) downThree = true;
  }
  return downThree;
}

function roundRecord(history = [], team = 'blue') {
  let wins = 0;
  let losses = 0;
  for (const round of history) {
    if (round?.winner === team) wins += 1;
    else if (round?.winner) losses += 1;
  }
  return { wins, losses };
}

// Add event seams around the proven MatchManager instead of rewriting its rules.
if (!MatchManager.prototype.__arena2431Bridge) {
  MatchManager.prototype.__arena2431Bridge = true;

  const originalStartMatch = MatchManager.prototype.startMatch;
  MatchManager.prototype.startMatch = function startMatch2431(...args) {
    const result = originalStartMatch.apply(this, args);
    const mode = window.__SKIRMISH_MATCH_MODE__ === 'arena' ? 'arena' : 'casual';
    window.dispatchEvent(new CustomEvent('skirmish:match-started', {
      detail: { mode, round:this.round, team:'blue' }
    }));
    return result;
  };

  const originalRecordElimination = MatchManager.prototype.recordElimination;
  MatchManager.prototype.recordElimination = function recordElimination2431(attacker, victim, result = {}) {
    const live = this.isLive() && victim;
    const stateBefore = this.state;
    const roundBefore = this.round;
    const credited = live ? this.resolveCreditedKiller(attacker, victim, result) : null;
    if (live) {
      const aliveByTeam = {
        blue:this.players.filter((player) => player.team === 'blue' && player.health?.alive).map((player) => player.id),
        red:this.players.filter((player) => player.team === 'red' && player.health?.alive).map((player) => player.id)
      };
      const localTeam = this.players.find((player) => player.isLocal || player.id === LOCAL_ID)?.team || 'blue';
      window.dispatchEvent(new CustomEvent('skirmish:arena-elimination-pre', {
        detail: {
          attackerId:credited?.id || null,
          attackerTeam:credited?.team || null,
          victimId:victim.id,
          victimTeam:victim.team,
          critical:Boolean(result?.critical),
          stateBefore,
          round:roundBefore,
          localTeam,
          aliveByTeam
        }
      }));
    }
    const outcome = originalRecordElimination.call(this, attacker, victim, result);
    if (live) {
      window.dispatchEvent(new CustomEvent('skirmish:arena-elimination-post', {
        detail: {
          round:roundBefore,
          attackerId:credited?.id || null,
          attackerTeam:credited?.team || null,
          victimId:victim.id,
          victimTeam:victim.team,
          aliveByTeam:{
            blue:this.players.filter((player) => player.team === 'blue' && player.health?.alive).map((player) => player.id),
            red:this.players.filter((player) => player.team === 'red' && player.health?.alive).map((player) => player.id)
          },
          stats:this.statsSnapshot()
        }
      }));
    }
    return outcome;
  };

  const originalFinishRound = MatchManager.prototype.finishRound;
  MatchManager.prototype.finishRound = function finishRound2431(winner) {
    const before = this.roundHistory.length;
    const result = originalFinishRound.call(this, winner);
    if (this.roundHistory.length > before) {
      window.dispatchEvent(new CustomEvent('skirmish:arena-round-end', {
        detail: {
          winner,
          round:this.roundHistory.at(-1),
          history:this.roundHistory.map((entry) => ({ ...entry, kills:{ ...entry.kills } })),
          stats:this.statsSnapshot(),
          duration:this.matchElapsed
        }
      }));
    }
    return result;
  };
}

window.__SKIRMISH_MATCH_MODE__ = window.__SKIRMISH_MATCH_MODE__ === 'arena' ? 'arena' : 'casual';
document.body.dataset.matchMode = window.__SKIRMISH_MATCH_MODE__;

let telemetry = {
  active:false,
  matchId:null,
  round:1,
  criticalKills:0,
  teamWipes:0,
  suddenDeathClutches:0,
  teamWipeLatched:false
};

function resetTelemetry() {
  telemetry = { active:false, matchId:null, round:1, criticalKills:0, teamWipes:0, suddenDeathClutches:0, teamWipeLatched:false };
}

function beginArenaMatch() {
  const matchId = randomMatchId();
  telemetry = { active:true, matchId, round:1, criticalKills:0, teamWipes:0, suddenDeathClutches:0, teamWipeLatched:false };
  arena.beginMatch({ id:matchId, team:'blue', startedAt:Date.now() });
  return matchId;
}

function activeTelemetryPatch(local = null, extra = {}) {
  if (!telemetry.active) return;
  arena.updateActiveMatch({
    ...(local ? {
      kills:local.kills,
      deaths:local.deaths,
      assists:local.assists,
      bestStreak:local.bestStreak
    } : {}),
    criticalKills:telemetry.criticalKills,
    teamWipes:telemetry.teamWipes,
    suddenDeathClutches:telemetry.suddenDeathClutches,
    ...extra
  });
}

window.addEventListener('skirmish:match-started', (event) => {
  const mode = event.detail?.mode === 'arena' ? 'arena' : 'casual';
  if (mode !== 'arena') {
    resetTelemetry();
    return;
  }
  beginArenaMatch();
});

window.addEventListener('skirmish:arena-elimination-pre', (event) => {
  if (!telemetry.active) return;
  const detail = event.detail || {};
  const round = Number(detail.round || 1);
  if (round !== telemetry.round) {
    telemetry.round = round;
    telemetry.teamWipeLatched = false;
  }
  const localTeam = detail.localTeam === 'red' ? 'red' : 'blue';
  const opponentTeam = arenaOpponentTeam(localTeam);
  telemetry.teamWipeLatched = refreshTeamWipeLatch(telemetry.teamWipeLatched, detail.aliveByTeam?.[opponentTeam]?.length || 0);
  if (detail.attackerId !== LOCAL_ID) return;
  if (detail.critical) telemetry.criticalKills += 1;
  if (detail.stateBefore === 'sudden-death') telemetry.suddenDeathClutches += 1;
  activeTelemetryPatch();
});

window.addEventListener('skirmish:arena-elimination-post', (event) => {
  if (!telemetry.active) return;
  const detail = event.detail || {};
  const local = (detail.stats || []).find((row) => row.isLocal || row.id === LOCAL_ID);
  if (local) {
    const opponentTeam = arenaOpponentTeam(local.team);
    const opponentsAlive = detail.aliveByTeam?.[opponentTeam]?.length ?? 1;
    const wipe = resolveTeamWipe({
      latched:telemetry.teamWipeLatched,
      attackerTeam:detail.attackerTeam,
      localTeam:local.team,
      opponentsAliveAfter:opponentsAlive
    });
    telemetry.teamWipeLatched = wipe.latched;
    if (wipe.awarded) {
      telemetry.teamWipes += 1;
    }
  }
  activeTelemetryPatch(local);
});

window.addEventListener('skirmish:arena-round-end', (event) => {
  if (!telemetry.active) return;
  telemetry.teamWipeLatched = false;
  const history = event.detail?.history || [];
  const local = (event.detail?.stats || []).find((row) => row.isLocal || row.id === LOCAL_ID);
  const rounds = roundRecord(history, local?.team || 'blue');
  activeTelemetryPatch(local, { roundWins:rounds.wins, roundLosses:rounds.losses, playSeconds:event.detail?.duration || 0 });
});

function recentArenaHtml(profile) {
  const recent = (profile.recent || []).slice(0, 5);
  if (!recent.length) return '<span class="career-empty">PLAY ARENA TO START SEASON HISTORY</span>';
  return recent.map((match) => {
    const delta = Number(match.apDelta || 0);
    const sign = delta > 0 ? '+' : '';
    return `<span class="career-result ${match.won ? 'win' : 'loss'}"><b>${match.forfeit ? 'F' : match.won ? 'W' : 'L'}</b>${match.kills}/${match.deaths}/${match.assists}<em>${sign}${ap(delta)} AP</em></span>`;
  }).join('');
}

function arenaStrip() {
  const home = document.querySelector('#mainMenu [data-menu-view="home"]');
  const career = home?.querySelector('[data-career-strip]');
  if (!home || !career) return null;
  let root = home.querySelector('[data-arena-strip]');
  if (!root) {
    root = document.createElement('section');
    root.className = 'career-strip career-strip-211 arena-strip';
    root.dataset.arenaStrip = '';
    root.setAttribute('role', 'button');
    root.setAttribute('tabindex', '0');
    root.setAttribute('aria-label', 'View Arena ranked progress');
    root.addEventListener('click', openArenaPage);
    root.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      openArenaPage();
    });
    career.insertAdjacentElement('afterend', root);
  }
  return root;
}

function renderArenaStrip() {
  const root = arenaStrip();
  if (!root) return;
  const profile = arena.snapshot();
  const next = profile.nextRank;
  const target = next?.threshold ?? profile.ap;
  root.innerHTML = `
    <div class="career-primary career-primary-211">
      ${arenaBadgeMarkup(profile.rank, 'arena-strip-badge')}
      <div><span>ARENA</span><strong>${safe(profile.rank.title)}</strong><b>${safe(profile.seasonLabel)}</b></div>
    </div>
    <div class="career-stat"><span>RECORD</span><strong>${profile.wins}-${profile.losses}</strong><small>${Math.round(profile.winRate * 100)}% WIN RATE</small></div>
    <div class="career-stat"><span>SEASON K/D</span><strong>${profile.kd.toFixed(2)}</strong><small>${profile.kills} KILLS · ${profile.matches} MATCHES</small></div>
    <div class="career-xp">
      <div><span>ARENA POINTS</span><strong>${next ? `${ap(profile.ap)} / ${ap(target)}` : `${ap(profile.ap)} AP`}</strong></div>
      <div class="career-xp-track arena-ap-track"><i style="width:${pct(profile.rankProgress)}"></i></div>
      <small class="arena-season-copy">${next ? `NEXT RANK · ${safe(next.title)}` : 'OMNIPOTENT · MAX RANK'} · RESET ${resetDateLabel(profile.resetAt)}</small>
    </div>
    <div class="career-recent"><span>RECENT</span><div>${recentArenaHtml(profile)}</div><b class="career-view-cue arena-view-cue">VIEW ARENA →</b></div>`;
}

function ensureArenaView() {
  const content = document.querySelector('#mainMenu .main-content');
  if (!content) return null;
  let view = content.querySelector('[data-menu-view="arena"]');
  if (view) return view;
  view = document.createElement('section');
  view.className = 'menu-view arena-view';
  view.dataset.menuView = 'arena';
  view.innerHTML = `
    <header class="arena-page-head">
      <div><span>MONTHLY COMPETITIVE // ARENA</span><h2>ARENA</h2><p>Seasonal competitive rank. Arena Points reset at 12:00 AM on the first day of every month.</p></div>
      <button type="button" data-arena-close>BACK TO HOME</button>
    </header>
    <nav class="arena-tabs" aria-label="Arena sections">
      <button type="button" class="active" data-arena-tab="overview">OVERVIEW</button>
      <button type="button" data-arena-tab="ranks">RANKS</button>
      <button type="button" data-arena-tab="history">HISTORY</button>
    </nav>
    <div class="arena-page-body" data-arena-page-body></div>`;
  content.appendChild(view);
  view.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-arena-tab]');
    if (tab) {
      for (const button of view.querySelectorAll('[data-arena-tab]')) button.classList.toggle('active', button === tab);
      renderArenaPage(tab.dataset.arenaTab);
      return;
    }
    if (event.target.closest('[data-arena-close]')) window.dispatchEvent(new CustomEvent('skirmish:show-menu-home'));
  });
  return view;
}

function arenaOverviewHtml(profile) {
  const next = profile.nextRank;
  return `
    <section class="arena-overview-hero">
      <div class="arena-overview-badge">${arenaBadgeMarkup(profile.rank)}</div>
      <div class="arena-overview-copy">
        <span>CURRENT ARENA RANK · ${safe(profile.seasonLabel)}</span>
        <h1>${safe(profile.rank.title)}</h1>
        <h3>${ap(profile.ap)} ARENA POINTS</h3>
        <div class="arena-ap-line"><span>${next ? `${ap(profile.ap)} / ${ap(next.threshold)} AP` : `${ap(profile.ap)} AP · MAX RANK`}</span><b>${pct(profile.rankProgress)}</b></div>
        <div class="arena-ap-track"><i style="width:${pct(profile.rankProgress)}"></i></div>
      </div>
    </section>
    <div class="arena-stat-grid">
      <div><span>SEASON RECORD</span><strong>${profile.wins}-${profile.losses}</strong><small>${Math.round(profile.winRate * 100)}% WIN RATE</small></div>
      <div><span>SEASON K/D</span><strong>${profile.kd.toFixed(2)}</strong><small>${profile.kills} K · ${profile.deaths} D</small></div>
      <div><span>MVP AWARDS</span><strong>${profile.mvps}</strong><small>${profile.fiveZeroWins} PERFECT WINS</small></div>
      <div><span>PEAK AP</span><strong>${ap(profile.peakAp)}</strong><small>${safe(arenaRankForPoints(profile.peakAp).title)}</small></div>
      <div><span>CRITICAL KILLS</span><strong>${profile.criticalKills}</strong><small>2 AP EACH</small></div>
      <div><span>TEAM WIPES</span><strong>${profile.teamWipes}</strong><small>+2.5 AP EACH</small></div>
      <div><span>COMEBACK WINS</span><strong>${profile.comebackWins}</strong><small>3+ ROUNDS DOWN</small></div>
      <div><span>SEASON RESET</span><strong>${resetDateLabel(profile.resetAt)}</strong><small>12:00 AM LOCAL TIME</small></div>
    </div>
    <section class="arena-economy"><span class="arena-section-label">ARENA POINT ECONOMY</span><p>Kill +1 · Critical Kill +2 total · Assist +0.5 · Round Win +2.5 · Match Win +10 · MVP +5 · 5-streak +2 · 10-streak +5 · 5–0 +10 · 3-round comeback +8 · Team Wipe +2.5 · Sudden Death Clutch +2 · Negative K/D −10 · Match Loss −8.</p></section>`;
}

function arenaRanksHtml(profile) {
  const currentIndex = arenaRankIndex(profile.rank);
  return `<div class="arena-rank-grid">${ARENA_RANKS.map((rank, index) => {
    const state = index === currentIndex ? 'current' : index < currentIndex ? 'earned' : 'locked';
    return `<article class="arena-rank-card ${state}" data-rank="${safe(rank.id)}">
      ${arenaBadgeMarkup(rank)}
      <div><span>${ap(rank.threshold)} AP</span><strong>${safe(rank.title)}</strong><span>${safe(rank.material)}</span></div>
      <b>${state === 'current' ? 'CURRENT' : state === 'earned' ? 'PASSED' : `+${ap(Math.max(0, rank.threshold - profile.ap))} AP`}</b>
    </article>`;
  }).join('')}</div>`;
}

function arenaHistoryHtml(profile) {
  if (!profile.history.length) return '<div class="arena-history-empty">NO COMPLETED ARENA SEASONS YET<br>YOUR FIRST MONTHLY SEASON WILL BE ARCHIVED HERE.</div>';
  return `<div class="arena-history-list">${profile.history.map((season) => {
    const kd = season.deaths > 0 ? season.kills / season.deaths : season.kills;
    return `<article class="arena-history-row">
      <div><span>SEASON</span><strong>${safe(season.seasonId)}</strong></div>
      <div><span>PEAK RANK</span><strong>${safe(season.peakRankTitle || arenaRankForPoints(season.peakAp).title)}</strong></div>
      <div><span>FINAL AP</span><strong>${ap(season.ap)}</strong></div>
      <div><span>RECORD</span><strong>${season.wins}-${season.losses}</strong></div>
      <div><span>K/D</span><strong>${kd.toFixed(2)}</strong></div>
    </article>`;
  }).join('')}</div>`;
}

function renderArenaPage(tab = null) {
  const view = ensureArenaView();
  const body = view?.querySelector('[data-arena-page-body]');
  if (!body) return;
  const activeTab = tab || view.querySelector('[data-arena-tab].active')?.dataset.arenaTab || 'overview';
  const profile = arena.snapshot();
  if (activeTab === 'ranks') body.innerHTML = arenaRanksHtml(profile);
  else if (activeTab === 'history') body.innerHTML = arenaHistoryHtml(profile);
  else body.innerHTML = arenaOverviewHtml(profile);
}

function openArenaPage() {
  const menu = document.getElementById('mainMenu');
  const view = ensureArenaView();
  if (!menu || !view) return;
  menu.classList.add('visible');
  for (const panel of menu.querySelectorAll('[data-menu-view]')) panel.classList.toggle('active', panel === view);
  for (const button of menu.querySelectorAll('[data-menu-nav]')) button.classList.remove('active');
  renderArenaPage();
  window.dispatchEvent(new CustomEvent('skirmish:menu-view-change', { detail:{ view:'arena' } }));
  menu.querySelector('.main-content')?.scrollTo?.({ top:0, behavior:'instant' });
}

let modeOverlay = null;
let allowPlayPass = false;

function ensureModeOverlay() {
  if (modeOverlay) return modeOverlay;
  modeOverlay = document.createElement('section');
  modeOverlay.className = 'arena-mode-select';
  modeOverlay.dataset.arenaModeSelect = '';
  modeOverlay.setAttribute('aria-hidden', 'true');
  modeOverlay.innerHTML = '<div class="arena-mode-shell" data-arena-mode-shell></div>';
  document.body.appendChild(modeOverlay);
  modeOverlay.addEventListener('click', (event) => {
    const modeButton = event.target.closest('[data-arena-select-mode]');
    if (modeButton) chooseMode(modeButton.dataset.arenaSelectMode);
    if (event.target.closest('[data-arena-mode-close]')) hideModeSelector();
  });
  return modeOverlay;
}

function renderModeOverlay() {
  const root = ensureModeOverlay();
  const shell = root.querySelector('[data-arena-mode-shell]');
  const profile = arena.snapshot();
  shell.innerHTML = `
    <header class="arena-mode-head"><div><span>PLAY // SELECT MODE</span><h2>CHOOSE YOUR MATCH</h2></div><button type="button" data-arena-mode-close>BACK</button></header>
    <div class="arena-mode-grid">
      <button type="button" class="arena-mode-card casual" data-arena-select-mode="casual">
        <small>STANDARD PLAY</small><h3>CASUAL</h3><p>Standard Skirmish Arena. Career progression remains active; Arena Points and seasonal rank are not affected.</p>
        <footer><span>3V3 TDM</span><strong>NO RANKED AP</strong></footer>
      </button>
      <button type="button" class="arena-mode-card arena" data-arena-select-mode="arena">
        <small>MONTHLY COMPETITIVE</small><h3>ARENA</h3><p>Ranked 3v3 competition with Arena Points, performance bonuses, loss penalties, promotions and demotions.</p>
        <footer><span class="arena-mode-rank">${arenaBadgeMarkup(profile.rank)}<b>${safe(profile.rank.title)}</b></span><strong>${ap(profile.ap)} AP</strong></footer>
      </button>
    </div>`;
}

function showModeSelector() {
  renderModeOverlay();
  modeOverlay.classList.add('visible');
  modeOverlay.setAttribute('aria-hidden', 'false');
  modeOverlay.querySelector('[data-arena-select-mode="arena"]')?.focus({ preventScroll:true });
}

function hideModeSelector() {
  modeOverlay?.classList.remove('visible');
  modeOverlay?.setAttribute('aria-hidden', 'true');
}

function syncLoadoutMode(mode) {
  const head = document.querySelector('#loadoutScreen .loadout-head');
  if (!head) return;
  let pill = head.querySelector('[data-arena-loadout-mode]');
  if (!pill) {
    pill = document.createElement('span');
    pill.dataset.arenaLoadoutMode = '';
    pill.className = 'loadout-mode-pill';
    head.appendChild(pill);
  }
  if (mode === 'arena') {
    const profile = arena.snapshot();
    pill.textContent = `ARENA · ${profile.rank.title} · ${ap(profile.ap)} AP`;
    pill.classList.add('arena');
  } else {
    pill.textContent = 'CASUAL';
    pill.classList.remove('arena');
  }
}

function chooseMode(value) {
  const mode = value === 'arena' ? 'arena' : 'casual';
  window.__SKIRMISH_MATCH_MODE__ = mode;
  document.body.dataset.matchMode = mode;
  syncLoadoutMode(mode);
  hideModeSelector();
  const play = document.querySelector('#mainMenu [data-menu-action="play"]');
  if (!play) return;
  allowPlayPass = true;
  play.click();
  allowPlayPass = false;
}

function resetModeState() {
  window.__SKIRMISH_MATCH_MODE__ = 'casual';
  document.body.dataset.matchMode = 'casual';
  try { localStorage.removeItem('skirmisharena.lastMode'); } catch {}
  syncLoadoutMode('casual');
}

const menu = document.getElementById('mainMenu');
menu?.addEventListener('click', (event) => {
  const play = event.target.closest('[data-menu-action="play"]');
  if (!play || allowPlayPass) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  showModeSelector();
}, true);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && modeOverlay?.classList.contains('visible')) {
    event.preventDefault();
    event.stopImmediatePropagation();
    hideModeSelector();
  }
}, true);

function breakdownRows(result) {
  const entries = [
    ['KILLS / CRITICALS', result.breakdown.kills],
    ['ASSISTS', result.breakdown.assists],
    ['ROUND WINS', result.breakdown.roundWins],
    ['MATCH WIN', result.breakdown.victory],
    ['5 KILL STREAK', result.breakdown.streak5],
    ['10 KILL STREAK', result.breakdown.streak10],
    ['5–0 BONUS', result.breakdown.sweep],
    ['MVP', result.breakdown.mvp],
    ['COMEBACK', result.breakdown.comeback],
    ['TEAM WIPE', result.breakdown.teamWipes],
    ['SUDDEN DEATH', result.breakdown.suddenDeathClutches],
    ['NEGATIVE K/D', result.breakdown.negativeKd],
    ['MATCH LOSS', result.breakdown.loss]
  ].filter(([, value]) => Number(value) !== 0);
  return entries.map(([label, value]) => {
    const numeric = Number(value);
    return `<div><span>${label}</span><b class="${numeric < 0 ? 'negative' : ''}">${numeric > 0 ? '+' : ''}${ap(numeric)} AP</b></div>`;
  }).join('');
}

function arenaPostgamePanel(result) {
  const shell = document.querySelector('#postgameScreen .postgame-shell');
  if (!shell || !result || result.duplicate) return;
  shell.querySelector('[data-arena-result]')?.remove();
  const panel = document.createElement('section');
  panel.className = 'arena-postgame';
  panel.dataset.arenaResult = '';
  const next = result.after.nextRank;
  panel.innerHTML = `
    <div class="arena-postgame-head">
      <div class="arena-postgame-rank">${arenaBadgeMarkup(result.rankAfter)}<div><span>ARENA RESULTS</span><strong>${safe(result.rankAfter.title)}</strong></div></div>
      <div class="arena-postgame-total"><span>ARENA POINTS</span><strong class="${result.apDelta < 0 ? 'negative' : 'positive'}">${result.apDelta > 0 ? '+' : ''}${ap(result.apDelta)} AP</strong></div>
    </div>
    <div class="arena-postgame-breakdown">${breakdownRows(result)}</div>
    <div class="arena-postgame-progress"><div><span>${ap(result.apBefore)} → ${ap(result.apAfter)} AP</span><strong>${next ? `NEXT · ${safe(next.title)} · ${ap(next.threshold)} AP` : 'OMNIPOTENT · MAX RANK'}</strong></div><div class="arena-ap-track"><i style="width:${pct(result.after.rankProgress)}"></i></div></div>`;
  const career = shell.querySelector('[data-progression-result]');
  if (career) career.insertAdjacentElement('afterend', panel);
  else shell.querySelector('.postgame-summary')?.insertAdjacentElement('afterend', panel);
}

let rankChangeTimer = null;
let rankChangeDelayTimer = null;

function cancelArenaRankChange() {
  clearTimeout(rankChangeTimer);
  clearTimeout(rankChangeDelayTimer);
  rankChangeTimer = null;
  rankChangeDelayTimer = null;
  document.querySelector('[data-arena-rank-change]')?.remove();
}

function showArenaRankChange(result) {
  if (!result?.promoted && !result?.demoted) return;
  const show = () => {
    rankChangeDelayTimer = null;
    if (!document.body.classList.contains('postgame-open')) return;
    cancelArenaRankChange();
    const overlay = document.createElement('section');
    overlay.className = 'arena-rank-change';
    overlay.dataset.arenaRankChange = '';
    overlay.innerHTML = `<div class="arena-rank-change-shell"><span>${result.promoted ? 'ARENA PROMOTION' : 'ARENA DEMOTION'}</span>${arenaBadgeMarkup(result.rankAfter)}<h2>${safe(result.rankAfter.title)}</h2><b>${safe(result.rankBefore.title)} → ${safe(result.rankAfter.title)}</b><small>${ap(result.apAfter)} ARENA POINTS</small></div>`;
    const dismiss = () => { clearTimeout(rankChangeTimer); rankChangeTimer = null; overlay.remove(); };
    overlay.addEventListener('click', dismiss);
    document.body.appendChild(overlay);
    rankChangeTimer = setTimeout(dismiss, 3600);
  };
  if (document.querySelector('[data-rank-promotion]')) rankChangeDelayTimer = setTimeout(show, 4700);
  else show();
}

window.addEventListener('unblockedtdm:match-complete', (event) => {
  if (!telemetry.active || window.__SKIRMISH_MATCH_MODE__ !== 'arena') return;
  const snapshot = event.detail || {};
  const stats = snapshot.stats || [];
  const local = stats.find((row) => row.isLocal || row.id === LOCAL_ID);
  if (!local) return;
  const ranked = rankRows(stats);
  const rounds = roundRecord(snapshot.roundHistory || [], local.team);
  const won = snapshot.matchWinner === local.team;
  const result = arena.recordMatch({
    matchId:telemetry.matchId,
    won,
    kills:local.kills,
    deaths:local.deaths,
    assists:local.assists,
    roundWins:rounds.wins,
    roundLosses:rounds.losses,
    criticalKills:telemetry.criticalKills,
    teamWipes:telemetry.teamWipes,
    suddenDeathClutches:telemetry.suddenDeathClutches,
    bestStreak:local.bestStreak,
    mvp:ranked[0]?.id === local.id,
    comeback:won && comebackFromHistory(snapshot.roundHistory || [], local.team),
    playSeconds:snapshot.duration || 0
  });
  snapshot.arena = result;
  resetTelemetry();
  renderArenaStrip();
  renderArenaPage();
  arenaPostgamePanel(result);
  showArenaRankChange(result);
});

function settleLiveForfeit() {
  if (!telemetry.active) return null;
  const result = arena.forfeitActive({
    criticalKills:telemetry.criticalKills,
    teamWipes:telemetry.teamWipes,
    suddenDeathClutches:telemetry.suddenDeathClutches
  });
  resetTelemetry();
  renderArenaStrip();
  renderArenaPage();
  return result;
}

document.addEventListener('click', (event) => {
  if (event.target.closest('#pauseMainMenuButton') && telemetry.active) settleLiveForfeit();
}, true);

window.addEventListener('beforeunload', () => {
  if (telemetry.active) settleLiveForfeit();
});

window.addEventListener('storage', (event) => {
  if (event.key !== ARENA_STORAGE_KEY) return;
  arena.profile = arena.read();
  arena.ensureCurrentSeason();
  renderArenaStrip();
  renderArenaPage();
  renderModeOverlay();
});

window.addEventListener('skirmish:show-menu-home', () => {
  cancelArenaRankChange();
  resetModeState();
  renderArenaStrip();
  hideModeSelector();
});
window.addEventListener('skirmish:menu-view-change', (event) => {
  if (event.detail?.view === 'arena') renderArenaPage();
  if (event.detail?.view === 'home') {
    cancelArenaRankChange();
    resetModeState();
    hideModeSelector();
    renderArenaStrip();
  }
});

let seasonTimer = 0;
function scheduleSeasonBoundary() {
  clearTimeout(seasonTimer);
  const snapshot = arena.snapshot();
  const wait = Math.max(1000, snapshot.resetAt - Date.now() + 200);
  seasonTimer = window.setTimeout(() => {
    if (Date.now() >= arena.snapshot().resetAt - 250) arena.ensureCurrentSeason();
    renderArenaStrip();
    renderArenaPage();
    renderModeOverlay();
    scheduleSeasonBoundary();
  }, Math.min(wait, 2_000_000_000));
}

ensureArenaView();
ensureModeOverlay();
renderArenaStrip();
renderArenaPage('overview');
scheduleSeasonBoundary();
document.body.dataset.arenaReady = 'true';

window.addEventListener('skirmish:match-started', cancelArenaRankChange);
window.addEventListener('beforeunload', cancelArenaRankChange, { once:true });

window.skirmishArena = Object.freeze({
  snapshot:() => arena.snapshot(),
  ranks:ARENA_RANKS,
  rewards:ARENA_AP_REWARDS,
  rankForPoints:arenaRankForPoints,
  nextRankForPoints:arenaNextRankForPoints,
  open:openArenaPage,
  selectMode:chooseMode
});
