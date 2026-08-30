function ensureStyle(href) {
  if ([...document.querySelectorAll('link[rel="stylesheet"]')].some((link) => link.getAttribute('href') === href)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

function installPhase6Menu() {
  const root = document.getElementById('mainMenu');
  if (!root) return;

  root.dataset.phase6Layout = 'command-menu';
  const nav = root.querySelector('.main-nav');
  const order = ['play', 'loadouts', 'weapon-info', 'settings', 'quit'];
  order.forEach((action, index) => {
    const button = nav?.querySelector(`[data-menu-action="${action}"]`);
    if (!button) return;
    button.removeAttribute('data-phase6-index');
    button.setAttribute('aria-posinset', String(index + 1));
    button.setAttribute('aria-setsize', String(order.length));
    button.setAttribute('aria-label', button.querySelector('.phase2-button-copy strong')?.textContent || action);
  });

  const home = root.querySelector('[data-menu-view="home"]');
  if (home) home.dataset.phase6Home = '';
}

ensureStyle('ui-phase6.css');
document.body.classList.add('ui-phase6');
installPhase6Menu();
