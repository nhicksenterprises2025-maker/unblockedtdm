const STYLE_ID = 'phase9-rc-style';
const BACKUP_KEY = 'unblockedtdm.pre2.backup.v1';
const CURRENT_KEY = 'unblockedtdm.pre2.current.v1';
const SCHEMA_KEY = 'unblockedtdm.pre2.schema';
const SNAPSHOT_KEYS = [
  'unblockedtdm.loadouts.v1',
  'unblockedtdm.activeLoadout',
  'unblockedtdm.createdLoadoutCount',
  'unblockedtdm.keybindings',
  'unblockedtdm.sensitivity',
  'unblockedtdm.aiDifficulty',
  'unblockedtdm.minimapMode',
  'unblockedtdm.screenShake',
  'unblockedtdm.damageVignette',
  'unblockedtdm.autoSprint',
  'unblockedtdm.audioEnabled',
  'unblockedtdm.masterVolume'
];

function ensureStyle(href) {
  if (document.getElementById(STYLE_ID)) return;
  const link = document.createElement('link');
  link.id = STYLE_ID;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

function readSnapshot() {
  const values = {};
  for (const key of SNAPSHOT_KEYS) {
    try {
      const value = localStorage.getItem(key);
      if (value !== null) values[key] = value;
    } catch {}
  }
  return {
    schema: 1,
    product: 'Skirmish Arena',
    capturedAt: new Date().toISOString(),
    values
  };
}

function writeMigrationSnapshots() {
  try {
    const snapshot = readSnapshot();
    if (!localStorage.getItem(BACKUP_KEY)) localStorage.setItem(BACKUP_KEY, JSON.stringify(snapshot));
    localStorage.setItem(CURRENT_KEY, JSON.stringify(snapshot));
    localStorage.setItem(SCHEMA_KEY, '1');
  } catch {}
}

function pauseForFocusLoss() {
  if (!document.body.classList.contains('match-started')) return;
  if (document.body.classList.contains('postgame-open')) return;
  const pausePanel = document.getElementById('pausePanel');
  if (pausePanel?.classList.contains('visible')) return;
  window.dispatchEvent(new KeyboardEvent('keydown', {
    code: 'Escape',
    key: 'Escape',
    bubbles: true
  }));
}

function onVisibilityChange() {
  if (document.hidden) pauseForFocusLoss();
}

ensureStyle('ui-phase9.css');
document.body.classList.add('ui-phase9');
writeMigrationSnapshots();

window.addEventListener('unblockedtdm:settings-change', writeMigrationSnapshots);
window.addEventListener('pagehide', writeMigrationSnapshots);
window.addEventListener('blur', pauseForFocusLoss);
document.addEventListener('visibilitychange', onVisibilityChange);
