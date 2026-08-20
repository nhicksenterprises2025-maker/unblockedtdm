import { PostgameScreen } from './ui/PostgameScreen.js';

const style = document.createElement('link');
style.rel = 'stylesheet';
style.href = 'ui-v17.css';
document.head.appendChild(style);

const root = document.createElement('section');
root.id = 'postgameScreen';
root.className = 'postgame-screen';
root.dataset.uiSurface = '';
document.body.appendChild(root);

const damageStats = new Map();
function resetDamageStats() { damageStats.clear(); }
function trackDamage(event) {
  const detail = event.detail || {};
  if (!detail.sourceId || !detail.target || !detail.result?.applied || detail.selfDamage) return;
  if (detail.sourceId === detail.target.id || detail.sourceTeam === detail.target.team) return;
  const current = damageStats.get(detail.sourceId) || { damage: 0, criticals: 0 };
  current.damage += detail.result.amount;
  if (detail.critical) current.criticals += 1;
  damageStats.set(detail.sourceId, current);
}

let allowSyntheticRematch = false;
const screen = new PostgameScreen(root, {
  onRematch: () => {
    screen.hide();
    document.body.classList.remove('postgame-open');
    resetDamageStats();
    allowSyntheticRematch = true;
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', key: 'Enter', bubbles: true }));
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Enter', key: 'Enter', bubbles: true }));
    allowSyntheticRematch = false;
  },
  onMainMenu: () => {
    screen.hide();
    document.body.classList.remove('postgame-open');
    resetDamageStats();
    document.getElementById('pauseMainMenuButton')?.click();
  }
});

window.addEventListener('unblockedtdm:damage-applied', trackDamage);
window.addEventListener('unblockedtdm:match-complete', (event) => {
  document.activeElement?.blur?.();
  document.body.classList.add('postgame-open');
  const snapshot = event.detail || {};
  snapshot.stats = (snapshot.stats || []).map((row) => {
    const tracked = damageStats.get(row.id);
    return tracked ? { ...row, damage: Math.round(tracked.damage), criticals: tracked.criticals } : row;
  });
  screen.show(snapshot);
});

window.addEventListener('keydown', (event) => {
  if (!root.classList.contains('visible') || allowSyntheticRematch) return;
  event.preventDefault();
  event.stopImmediatePropagation();
}, true);
