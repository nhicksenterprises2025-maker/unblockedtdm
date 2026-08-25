import { ProgressionStore, nextTitleForLevel } from './progression/ProgressionStore.js';

function ensureStyle(href) {
  if ([...document.querySelectorAll('link[rel="stylesheet"]')].some((link) => link.getAttribute('href') === href)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

ensureStyle('ui-2.0.css');
document.body.classList.add('ui-2-0');

const progression = new ProgressionStore();
const percent = (value) => `${Math.max(0, Math.min(100, Math.round(value)))}%`;

function profileProgress(profile) {
  if (profile.level >= 100 || !profile.levelXpRequired) return 100;
  return (profile.levelXp / profile.levelXpRequired) * 100;
}

function recentHtml(profile) {
  const recent = (profile.recent || []).slice(0, 5);
  if (!recent.length) return '<span class="career-empty">COMPLETE A MATCH TO START YOUR CAREER HISTORY</span>';
  return recent.map((match) => `<span class="career-result ${match.won ? 'win' : 'loss'}"><b>${match.won ? 'W' : 'L'}</b>${match.kills}/${match.deaths}/${match.assists}<em>+${match.xp} XP</em></span>`).join('');
}

function careerStrip() {
  const home = document.querySelector('#mainMenu [data-menu-view="home"]');
  if (!home) return null;
  let root = home.querySelector('[data-career-strip]');
  if (!root) {
    root = document.createElement('section');
    root.className = 'career-strip';
    root.dataset.careerStrip = '';
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
  const nextTitle = nextTitleForLevel(profile.level);
  const nextCopy = profile.level >= 100 ? 'MAX CAREER LEVEL' : nextTitle ? `${nextTitle.title} · LEVEL ${nextTitle.level}` : 'MAX CAREER LEVEL';
  root.innerHTML = `
    <div class="career-primary">
      <span>CAREER</span>
      <strong>LEVEL ${profile.level}</strong>
      <b>${profile.title}</b>
    </div>
    <div class="career-stat"><span>RECORD</span><strong>${profile.wins}-${profile.losses}</strong><small>${Math.round(profile.winRate * 100)}% WIN RATE</small></div>
    <div class="career-stat"><span>LIFETIME K/D</span><strong>${profile.kd.toFixed(2)}</strong><small>${profile.kills} KILLS · ${profile.matches} MATCHES</small></div>
    <div class="career-xp">
      <div><span>${profile.level >= 100 ? 'CAREER COMPLETE' : `LEVEL ${profile.level} XP`}</span><strong>${profile.level >= 100 ? 'MAX' : `${profile.levelXp} / ${profile.levelXpRequired}`}</strong></div>
      <div class="career-xp-track"><i style="width:${percent(profileProgress(profile))}"></i></div>
      <small>NEXT TITLE · ${nextCopy}</small>
    </div>
    <div class="career-recent"><span>RECENT</span><div>${recentHtml(profile)}</div></div>`;
}

function progressionPanel(result) {
  const shell = document.querySelector('#postgameScreen .postgame-shell');
  if (!shell || !result) return;
  shell.querySelector('[data-progression-result]')?.remove();
  const after = result.after;
  const nextTitle = nextTitleForLevel(after.level);
  const panel = document.createElement('section');
  panel.className = `career-postgame${result.leveledUp ? ' level-up' : ''}`;
  panel.dataset.progressionResult = '';
  const unlocked = result.unlockedTitles.map((entry) => entry.title).join(' · ');
  panel.innerHTML = `
    <div class="career-postgame-level">
      <span>${result.leveledUp ? 'LEVEL UP' : 'CAREER XP'}</span>
      <strong>LEVEL ${after.level}</strong>
      <b>${after.title}</b>
    </div>
    <div class="career-postgame-earned">
      <span>MATCH XP</span>
      <strong>+${result.xpGained}</strong>
      <small>${result.breakdown.completion} COMPLETE · ${result.breakdown.victory} WIN · ${result.breakdown.kills} KILLS · ${result.breakdown.assists} ASSISTS · ${result.breakdown.damage} DAMAGE · ${result.breakdown.criticals} CRITS · ${result.breakdown.streak} STREAK</small>
    </div>
    <div class="career-postgame-progress">
      <div><span>${after.level >= 100 ? 'MAX LEVEL' : `LEVEL ${after.level} PROGRESS`}</span><strong>${after.level >= 100 ? '100%' : `${Math.round(profileProgress(after))}%`}</strong></div>
      <div class="career-xp-track"><i style="width:${percent(profileProgress(after))}"></i></div>
      <small>${unlocked ? `UNLOCKED · ${unlocked}` : after.level >= 100 ? 'ARENA LEGEND' : nextTitle ? `NEXT TITLE · ${nextTitle.title} AT LEVEL ${nextTitle.level}` : 'CAREER COMPLETE'}</small>
    </div>`;
  const summary = shell.querySelector('.postgame-summary');
  if (summary) summary.insertAdjacentElement('afterend', panel);
  else shell.prepend(panel);
}

window.addEventListener('unblockedtdm:match-complete', (event) => {
  const snapshot = event.detail || {};
  if (snapshot.__careerAwarded) return;
  const local = (snapshot.stats || []).find((row) => row.isLocal);
  if (!local) return;
  snapshot.__careerAwarded = true;
  const result = progression.recordMatch({
    won: snapshot.matchWinner === local.team,
    local,
    durationLabel: snapshot.durationLabel
  });
  snapshot.progression = result;
  progressionPanel(result);
  renderCareerStrip();
});

window.addEventListener('storage', (event) => {
  if (event.key === 'unblockedtdm.progression.v1') renderCareerStrip();
});
window.addEventListener('skirmish:show-menu-home', renderCareerStrip);

renderCareerStrip();
