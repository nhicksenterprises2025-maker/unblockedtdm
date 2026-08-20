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

let allowSyntheticRematch = false;
const screen = new PostgameScreen(root, {
  onRematch: () => {
    screen.hide();
    document.body.classList.remove('postgame-open');
    allowSyntheticRematch = true;
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', key: 'Enter', bubbles: true }));
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Enter', key: 'Enter', bubbles: true }));
    allowSyntheticRematch = false;
  },
  onMainMenu: () => {
    screen.hide();
    document.body.classList.remove('postgame-open');
    document.getElementById('pauseMainMenuButton')?.click();
  }
});

window.addEventListener('unblockedtdm:match-complete', (event) => {
  document.activeElement?.blur?.();
  document.body.classList.add('postgame-open');
  screen.show(event.detail || {});
});

window.addEventListener('keydown', (event) => {
  if (!root.classList.contains('visible') || allowSyntheticRematch) return;
  event.preventDefault();
  event.stopImmediatePropagation();
}, true);
