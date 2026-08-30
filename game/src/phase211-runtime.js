import {
  CAREER_RANKS,
  CAREER_XP_REWARDS,
  MAX_CAREER_LEVEL,
  MILESTONE_TRACKS,
  PROGRESSION_STORAGE_KEY,
  ProgressionStore,
  TOTAL_CAREER_XP,
  TOTAL_MILESTONE_XP,
  nextRankForLevel,
  rankForLevel,
  totalXpAtLevel
} from './progression/ProgressionStore.js';
import { rankBadgeMarkup } from './progression/RankBadges.js';
import {
  animateProgression,
  careerProgressionState,
  careerTransitionLevels
} from './ui/PostgameProgression.js';

function ensureStyle(href) {
  if ([...document.querySelectorAll('link[rel="stylesheet"]')].some((link) => link.getAttribute('href') === href)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

ensureStyle('ui-2.0.css');
ensureStyle('ui-2.1.1.css');
ensureStyle('ui-2.6.0-progression.css');
ensureStyle('ui-2.6.0-systems.css');
document.body.classList.add('ui-2-0', 'ui-211', 'ui-260-progression');

const progression = new ProgressionStore();
const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const number = (value) => new Intl.NumberFormat('en-US').format(Math.max(0, Math.floor(Number(value) || 0)));
const percent = (value) => `${Math.round(clamp(value) * 100)}%`;

function formatPlayTime(seconds) {
  const totalMinutes = Math.floor(Math.max(0, Number(seconds) || 0) / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${number(hours)}h ${minutes}m` : `${minutes}m`;
}

function levelProgress(profile) {
  if (profile.level >= MAX_CAREER_LEVEL || !profile.levelXpRequired) return 1;
  return clamp(profile.levelXp / profile.levelXpRequired);
}

function rankProgress(profile) {
  const rank = profile.rank || rankForLevel(profile.level);
  if (rank.startLevel >= MAX_CAREER_LEVEL) return 1;
  const nextRank = nextRankForLevel(profile.level);
  if (!nextRank) return 1;
  const startXp = totalXpAtLevel(rank.startLevel);
  const endXp = totalXpAtLevel(nextRank.startLevel);
  return endXp > startXp ? clamp((profile.totalXp - startXp) / (endXp - startXp)) : 1;
}

function recentHtml(profile) {
  const recent = (profile.recent || []).slice(0, 5);
  if (!recent.length) return '<span class="career-empty">COMPLETE A MATCH TO START CAREER HISTORY</span>';
  return recent.map((match) => `<span class="career-result ${match.won ? 'win' : 'loss'}"><b>${match.won ? 'W' : 'L'}</b>${match.kills}/${match.deaths}/${match.assists}<em>+${number(match.xp)} XP</em></span>`).join('');
}

function careerStrip() {
  const home = document.querySelector('#mainMenu [data-menu-view="home"]');
  if (!home) return null;
  let root = home.querySelector('[data-career-strip]');
  if (!root) {
    root = document.createElement('section');
    root.className = 'career-strip career-strip-211';
    root.dataset.careerStrip = '';
    root.dataset.menuAction = 'career';
    root.setAttribute('role', 'button');
    root.setAttribute('tabindex', '0');
    root.setAttribute('aria-label', 'View account career');
    root.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      root.click();
    });
    const featureGrid = home.querySelector('.menu-feature-grid');
    if (featureGrid?.parentNode) featureGrid.insertAdjacentElement('afterend', root);
    else home.appendChild(root);
  }
  return root;
}

function renderCareerStrip() {
  const root = careerStrip();
  if (!root) return;
  const profile = progression.snapshot();
  const nextRank = profile.nextRank;
  root.innerHTML = `
    <div class="career-primary career-primary-211">
      ${rankBadgeMarkup(profile.rank, 'career-strip-badge')}
      <div><span>CAREER</span><strong>LEVEL ${profile.level}</strong><b>${profile.rank.title}</b></div>
    </div>
    <div class="career-stat"><span>RECORD</span><strong>${number(profile.wins)}-${number(profile.losses)}</strong><small>${Math.round(profile.winRate * 100)}% WIN RATE</small></div>
    <div class="career-stat"><span>LIFETIME K/D</span><strong>${profile.kd.toFixed(2)}</strong><small>${number(profile.kills)} KILLS · ${number(profile.matches)} MATCHES</small></div>
    <div class="career-xp">
      <div><span>${profile.level >= MAX_CAREER_LEVEL ? 'CAREER COMPLETE' : `LEVEL ${profile.level} XP`}</span><strong>${profile.level >= MAX_CAREER_LEVEL ? 'MAX' : `${number(profile.levelXp)} / ${number(profile.levelXpRequired)}`}</strong></div>
      <div class="career-xp-track"><i style="width:${percent(levelProgress(profile))}"></i></div>
      <small>${nextRank ? `NEXT RANK · ${nextRank.title} · LEVEL ${nextRank.startLevel}` : 'OMNIPOTENT · CAREER COMPLETE'}</small>
    </div>
    <div class="career-recent"><span>RECENT</span><div>${recentHtml(profile)}</div><b class="career-view-cue">VIEW CAREER →</b></div>`;
}

function ensureCareerView() {
  const content = document.querySelector('#mainMenu .main-content');
  if (!content) return null;
  let view = content.querySelector('[data-menu-view="career"]');
  if (view) return view;
  view = document.createElement('section');
  view.className = 'menu-view career-view';
  view.dataset.menuView = 'career';
  view.innerHTML = `
    <header class="career-page-head">
      <div><span>ACCOUNT CAREER</span><h2>CAREER</h2><p>Permanent account progression from Recruit I to Omnipotent.</p></div>
      <button type="button" data-career-close>BACK TO HOME</button>
    </header>
    <nav class="career-tabs" aria-label="Career sections">
      <button type="button" class="active" data-career-tab="overview">OVERVIEW</button>
      <button type="button" data-career-tab="ranks">RANKS</button>
      <button type="button" data-career-tab="milestones">MILESTONES</button>
    </nav>
    <div class="career-page-body" data-career-page-body></div>`;
  content.appendChild(view);
  view.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-career-tab]');
    if (tab) {
      for (const button of view.querySelectorAll('[data-career-tab]')) button.classList.toggle('active', button === tab);
      renderCareerPage(tab.dataset.careerTab);
      return;
    }
    if (event.target.closest('[data-career-close]')) window.dispatchEvent(new CustomEvent('skirmish:show-menu-home'));
  });
  return view;
}

function overviewHtml(profile) {
  const nextRank = profile.nextRank;
  const completion = profile.totalXp / TOTAL_CAREER_XP;
  const recent = (profile.recent || []).slice(0, 5);
  const recentRows = recent.length
    ? recent.map((match, index) => `<div class="career-overview-result ${match.won ? 'win' : 'loss'}"><b>${match.won ? 'W' : 'L'}</b><span>MATCH ${String(index + 1).padStart(2, '0')}</span><strong>${number(match.kills)} / ${number(match.deaths)} / ${number(match.assists)}</strong><em>+${number(match.xp)} XP</em></div>`).join('')
    : '<div class="career-overview-empty">COMPLETE A MATCH TO BEGIN YOUR CAREER RECORD.</div>';
  return `
    <div class="career-overview-composition">
      <div class="career-overview-hero">
        <div class="career-overview-badge">${rankBadgeMarkup(profile.rank, 'career-badge-hero')}</div>
        <div class="career-overview-identity">
          <span>CURRENT CAREER</span>
          <h1>LEVEL ${profile.level}</h1>
          <h3>${profile.rank.title}</h3>
          <div class="career-level-line"><span>${profile.level >= MAX_CAREER_LEVEL ? 'MAX LEVEL' : `${number(profile.levelXp)} / ${number(profile.levelXpRequired)} XP`}</span><b>${percent(levelProgress(profile))}</b></div>
          <div class="career-xp-track career-xp-track-large"><i style="width:${percent(levelProgress(profile))}"></i></div>
        </div>
      </div>
      <div class="career-account-grid">
        <div><span>TOTAL CAREER XP</span><strong>${number(profile.totalXp)}</strong><small>OF ${number(TOTAL_CAREER_XP)}</small></div>
        <div><span>CAREER COMPLETION</span><strong>${(completion * 100).toFixed(completion >= .1 ? 1 : 2)}%</strong><small>XP-WEIGHTED</small></div>
        <div><span>TIME PLAYED</span><strong>${formatPlayTime(profile.playSeconds)}</strong><small>MATCH TIME</small></div>
        <div><span>MATCHES PLAYED</span><strong>${number(profile.matches)}</strong><small>${number(profile.wins)} WINS</small></div>
        <div><span>LIFETIME K/D</span><strong>${profile.kd.toFixed(2)}</strong><small>${number(profile.kills)} KILLS · ${number(profile.deaths)} DEATHS</small></div>
        <div><span>ROUND RECORD</span><strong>${number(profile.roundWins)}-${number(profile.roundLosses)}</strong><small>WINS · LOSSES</small></div>
      </div>
      <div class="career-overview-support">
        <section class="career-next-rank">
          <div class="career-next-rank-head"><div><span>RANK PROGRESSION</span><strong>${profile.rank.title}</strong></div><b>${nextRank ? `${nextRank.title} · LEVEL ${nextRank.startLevel}` : 'CAREER COMPLETE'}</b></div>
          <div class="career-rank-track"><i style="width:${percent(rankProgress(profile))}"></i></div>
          <div class="career-rank-track-foot"><span>LEVEL ${profile.rank.startLevel}</span><span>${nextRank ? `LEVEL ${nextRank.startLevel}` : 'LEVEL 1000'}</span></div>
        </section>
        <section class="career-overview-recent"><header><span>RECENT FORM</span><strong>${recent.length ? `LAST ${recent.length} MATCH${recent.length === 1 ? '' : 'ES'}` : 'NO MATCHES YET'}</strong></header><div>${recentRows}</div></section>
      </div>
      <section class="career-economy-note"><span>CAREER ECONOMY</span><p>${number(TOTAL_CAREER_XP)} XP to Omnipotent · ${number(TOTAL_MILESTONE_XP)} permanent milestone XP available · no daily or weekly challenges.</p></section>
    </div>`;
}

function ranksHtml(profile) {
  return `<div class="career-rank-grid">${CAREER_RANKS.map((rank) => {
    const current = profile.rank.id === rank.id;
    const earned = profile.level >= rank.startLevel;
    const state = current ? 'current' : earned ? 'earned' : 'locked';
    const range = rank.startLevel === rank.endLevel ? `LEVEL ${rank.startLevel}` : `LEVELS ${rank.startLevel}-${rank.endLevel}`;
    return `<article class="career-rank-card ${state}" data-career-rank="${rank.id}">
      <div class="career-rank-card-badge">${rankBadgeMarkup(rank)}</div>
      <div class="career-rank-card-copy"><span>${range}</span><strong>${rank.title}</strong><small>${rank.material}</small></div>
      <b>${current ? 'CURRENT' : earned ? 'EARNED' : `UNLOCK · ${rank.startLevel}`}</b>
    </article>`;
  }).join('')}</div>`;
}

function milestonesHtml(profile) {
  return `
    <header class="career-section-intro"><span>PERMANENT CAREER MILESTONES</span><h3>PLAY. PROGRESS. COMPLETE.</h3><p>Five automatic lifetime tracks. Only your next target is shown.</p></header>
    <div class="career-milestone-list">${profile.milestones.map((milestone) => {
      const ratio = milestone.complete ? 1 : clamp(milestone.current / milestone.target);
      return `<article class="career-milestone-row ${milestone.complete ? 'complete' : ''}">
        <div class="career-milestone-name"><span>${milestone.label}</span><strong>${milestone.complete ? 'TRACK COMPLETE' : `${milestone.label} ${milestone.tier}`}</strong></div>
        <div class="career-milestone-progress"><div><span>${number(Math.min(milestone.current, milestone.target))} / ${number(milestone.target)}</span><b>${percent(ratio)}</b></div><div class="career-milestone-track"><i style="width:${percent(ratio)}"></i></div></div>
        <div class="career-milestone-reward"><span>REWARD</span><strong>${milestone.complete ? 'COMPLETE' : `+${number(milestone.reward)} XP`}</strong></div>
      </article>`;
    }).join('')}</div>`;
}

function renderCareerPage(tab = null) {
  const view = ensureCareerView();
  const body = view?.querySelector('[data-career-page-body]');
  if (!body) return;
  const activeTab = tab || view.querySelector('[data-career-tab].active')?.dataset.careerTab || 'overview';
  const profile = progression.snapshot();
  if (activeTab === 'ranks') body.innerHTML = ranksHtml(profile);
  else if (activeTab === 'milestones') body.innerHTML = milestonesHtml(profile);
  else body.innerHTML = overviewHtml(profile);
}

function postgameBreakdownRows(result) {
  const rows = [
    ['KILLS', `${result.counts.kills} × ${CAREER_XP_REWARDS.kill}`, result.breakdown.kills],
    ['ASSISTS', `${result.counts.assists} × ${CAREER_XP_REWARDS.assist}`, result.breakdown.assists],
    ['ROUND WINS', `${result.counts.roundWins} × ${CAREER_XP_REWARDS.roundWin}`, result.breakdown.roundWins],
    ['ROUND LOSSES', `${result.counts.roundLosses} × ${CAREER_XP_REWARDS.roundLoss}`, result.breakdown.roundLosses]
  ];
  if (result.breakdown.victory) rows.push(['VICTORY', 'MATCH WIN', result.breakdown.victory]);
  return rows.map(([label, formula, xp]) => `<div><span>${label}</span><small>${formula}</small><strong>+${number(xp)} XP</strong></div>`).join('');
}

function progressionPanel(result) {
  const shell = document.querySelector('#postgameScreen .postgame-shell');
  if (!shell || !result) return Promise.resolve();
  shell.querySelector('[data-progression-result]')?.remove();
  const before = careerProgressionState(result.before.totalXp);
  const after = result.after;
  const milestoneRows = result.milestoneAwards.length
    ? `<div class="career-postgame-milestones"><span>CAREER MILESTONES COMPLETE</span>${result.milestoneAwards.map((award) => `<div><b>${award.label} ${award.tier}</b><small>${number(award.target)} ${award.label}</small><strong>+${number(award.reward)} XP</strong></div>`).join('')}</div>`
    : '';
  const panel = document.createElement('section');
  panel.className = `career-postgame career-postgame-211${result.leveledUp ? ' level-up' : ''}`;
  panel.dataset.progressionResult = '';
  panel.dataset.finalTotalXp = String(after.totalXp);
  panel.innerHTML = `
    <div class="career-postgame-rank"><span data-career-badge>${rankBadgeMarkup(before.rank, 'career-postgame-badge')}</span><div><span data-career-event>CAREER PROGRESS</span><strong data-career-level>LEVEL ${before.level}</strong><b data-career-rank>${before.rank.title}</b></div></div>
    <div class="career-postgame-earned"><span>MATCH XP</span><div class="career-postgame-breakdown">${postgameBreakdownRows(result)}</div><div class="career-match-total"><span>MATCH TOTAL</span><strong>+${number(result.matchXp)} XP</strong></div></div>
    ${milestoneRows}
    <div class="career-postgame-progress"><div><span data-career-total>TOTAL CAREER XP GAINED · ${number(before.totalXp)} TOTAL</span><strong>+${number(result.xpGained)} XP</strong></div><div class="career-xp-track"><i data-career-progress-fill style="width:${percent(before.progress)}"></i></div><small data-career-progress-copy>${before.level >= MAX_CAREER_LEVEL ? 'OMNIPOTENT · CAREER COMPLETE' : `${number(before.levelXp)} / ${number(before.levelXpRequired)} XP · NEXT RANK ${before.nextRank?.title || 'OMNIPOTENT'}`}</small></div>`;
  const summary = shell.querySelector('.postgame-summary');
  if (summary) summary.insertAdjacentElement('afterend', panel);
  else shell.prepend(panel);

  let shownLevel = before.level;
  let shownRankId = before.rank.id;
  const transitions = careerTransitionLevels(result.before.totalXp, after.totalXp);
  const animation = animateProgression({
    from:result.before.totalXp,
    to:after.totalXp,
    duration:Math.min(2200, 900 + transitions.length * 180),
    quantize:(value) => Math.floor(value),
    onFrame:(value) => {
      const state = careerProgressionState(value);
      panel.dataset.currentTotalXp = String(state.totalXp);
      panel.querySelector('[data-career-level]').textContent = `LEVEL ${state.level}`;
      panel.querySelector('[data-career-rank]').textContent = state.rank.title;
      panel.querySelector('[data-career-total]').textContent = `TOTAL CAREER XP GAINED · ${number(state.totalXp)} TOTAL`;
      panel.querySelector('[data-career-progress-fill]').style.width = percent(state.progress);
      panel.querySelector('[data-career-progress-copy]').textContent = state.level >= MAX_CAREER_LEVEL
        ? 'OMNIPOTENT · CAREER COMPLETE'
        : `${number(state.levelXp)} / ${number(state.levelXpRequired)} XP · NEXT RANK ${state.nextRank?.title || 'OMNIPOTENT'}`;
      if (state.rank.id !== shownRankId) {
        shownRankId = state.rank.id;
        panel.querySelector('[data-career-badge]').innerHTML = rankBadgeMarkup(state.rank, 'career-postgame-badge');
      }
      if (state.level !== shownLevel) {
        shownLevel = state.level;
        panel.querySelector('[data-career-event]').textContent = 'LEVEL UP';
        panel.classList.remove('progression-step');
        requestAnimationFrame(() => panel.classList.add('progression-step'));
      }
    }
  });
  return animation.promise;
}

let promotionTimer = null;
function dismissPromotion() {
  const overlay = document.querySelector('[data-rank-promotion]');
  if (!overlay) return;
  overlay.classList.remove('visible');
  window.clearTimeout(promotionTimer);
  promotionTimer = window.setTimeout(() => overlay.remove(), 180);
}

function showRankPromotion(result) {
  if (!result?.rankPromotions?.length) return;
  if (!document.body.classList.contains('postgame-open')) return;
  document.querySelector('[data-rank-promotion]')?.remove();
  const rank = result.rankPromotions[result.rankPromotions.length - 1];
  const overlay = document.createElement('div');
  overlay.className = 'career-rank-promotion';
  overlay.dataset.rankPromotion = '';
  overlay.tabIndex = 0;
  overlay.innerHTML = `<div class="career-promotion-shell"><span>RANK PROMOTION</span>${rankBadgeMarkup(rank, 'career-promotion-badge')}<h2>${rank.title}</h2><b>LEVEL ${rank.startLevel}</b><small>ACCOUNT CAREER RANK ACHIEVED</small></div>`;
  overlay.addEventListener('click', dismissPromotion);
  overlay.addEventListener('keydown', (event) => { if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') dismissPromotion(); });
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('visible'));
  overlay.focus({ preventScroll:true });
  promotionTimer = window.setTimeout(dismissPromotion, 4500);
}

window.addEventListener('unblockedtdm:match-complete', (event) => {
  const snapshot = event.detail || {};
  if (snapshot.__careerAwarded211) return;
  const local = (snapshot.stats || []).find((row) => row.isLocal);
  if (!local) return;
  snapshot.__careerAwarded211 = true;
  const result = progression.recordMatch({
    won: snapshot.matchWinner === local.team,
    local,
    roundHistory: snapshot.roundHistory,
    duration: snapshot.duration,
    durationLabel: snapshot.durationLabel
  });
  snapshot.progression = result;
  const progressionAnimation = progressionPanel(result);
  snapshot.__careerAnimationPromise211 = progressionAnimation;
  renderCareerStrip();
  renderCareerPage();
  Promise.resolve(progressionAnimation).then(() => showRankPromotion(result));
});

window.addEventListener('storage', (event) => {
  if (event.key !== PROGRESSION_STORAGE_KEY) return;
  progression.profile = progression.read();
  renderCareerStrip();
  renderCareerPage();
});
window.addEventListener('skirmish:show-menu-home', renderCareerStrip);
window.addEventListener('skirmish:menu-view-change', (event) => {
  if (event.detail?.view === 'career') {
    ensureCareerView();
    renderCareerPage();
    document.querySelector('#mainMenu .main-content')?.scrollTo?.({ top:0, behavior:'instant' });
  }
});

ensureCareerView();
renderCareerStrip();
renderCareerPage('overview');

window.skirmishCareer = Object.freeze({
  snapshot: () => progression.snapshot(),
  maxLevel: MAX_CAREER_LEVEL,
  totalXp: TOTAL_CAREER_XP,
  ranks: CAREER_RANKS,
  milestones: MILESTONE_TRACKS
});
