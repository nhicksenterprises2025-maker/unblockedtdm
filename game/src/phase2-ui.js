(() => {
  const weaponIds = new Map([
    ['Assault Rifle', 'assault-rifle'], ['SMG', 'smg'], ['Sniper Rifle', 'sniper'], ['Shotgun', 'shotgun'],
    ['LMG', 'lmg'], ['Pistol', 'pistol'], ['Launcher', 'launcher'], ['Melee', 'melee']
  ]);

  const icons = {
    play: '<svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z"/></svg>',
    loadouts: '<svg viewBox="0 0 24 24"><path d="M4 6h16v4H4zm0 8h10v4H4zm13 0h3v4h-3z"/></svg>',
    'weapon-info': '<svg viewBox="0 0 24 24"><path d="M3 10h12l4-3 2 2-4 4H3zm4 4h9v3H7z"/></svg>',
    settings: '<svg viewBox="0 0 24 24"><path d="M10 2h4l1 3 3 1 3-1 2 4-2 2v3l2 2-2 4-3-1-3 1-1 3h-4l-1-3-3-1-3 1-2-4 2-2v-3L1 9l2-4 3 1 3-1zm2 7a3 3 0 100 6 3 3 0 000-6z"/></svg>',
    quit: '<svg viewBox="0 0 24 24"><path d="M4 3h9v3H7v12h6v3H4zm10 5l6 4-6 4v-3H9v-2h5z"/></svg>'
  };

  function ensureStyles() {
    if (document.querySelector('link[data-skirmish-phase2]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'ui-v20.css';
    link.dataset.skirmishPhase2 = 'true';
    document.head.appendChild(link);
  }

  function structureNav() {
    const nav = document.querySelector('.main-nav');
    if (!nav) return;
    nav.querySelector('[data-menu-action="home"]')?.remove();
    const order = ['play', 'loadouts', 'weapon-info', 'settings', 'quit'];
    for (const action of order) {
      const button = nav.querySelector(`[data-menu-action="${action}"]`);
      if (!button) continue;
      button.dataset.phase2Order = action;
      if (!button.querySelector('.nav-glyph')) {
        const glyph = document.createElement('span');
        glyph.className = 'nav-glyph';
        glyph.setAttribute('aria-hidden', 'true');
        glyph.innerHTML = icons[action] || '';
        button.prepend(glyph);
      }
      nav.appendChild(button);
    }
  }

  function categorizeSettings(panel) {
    if (!panel || panel.dataset.phase2Categorized) return;
    panel.dataset.phase2Categorized = 'true';
    const grid = panel.querySelector('.settings-grid');
    if (grid) {
      const cards = [...grid.children];
      cards.forEach((card, index) => card.dataset.settingsCategory = index === cards.length - 1 ? 'display' : 'gameplay');
      const gameplay = document.createElement('div');
      gameplay.className = 'settings-section-tag gameplay-tag';
      gameplay.textContent = 'GAMEPLAY';
      grid.prepend(gameplay);
      const displayCard = grid.querySelector('[data-settings-category="display"]');
      if (displayCard) {
        const display = document.createElement('div');
        display.className = 'settings-section-tag display-tag';
        display.textContent = 'DISPLAY';
        grid.insertBefore(display, displayCard);
      }
    }
    const bindings = panel.querySelector('.bindings-card');
    if (bindings && !bindings.querySelector('.controls-tag')) {
      const tag = document.createElement('div');
      tag.className = 'settings-section-tag controls-tag';
      tag.textContent = 'CONTROLS';
      bindings.prepend(tag);
    }
  }

  function modelMarkup(id) {
    return `<div class="weapon-model-stage" data-model="${id}"><span class="model-stock"></span><span class="model-body"></span><span class="model-barrel"></span><span class="model-detail"></span><i>CANONICAL ${id.toUpperCase()} PROFILE</i></div>`;
  }

  function enhanceLoadoutPreview() {
    for (const detail of document.querySelectorAll('.weapon-detail:not([data-phase2-enhanced])')) {
      const name = detail.querySelector('.weapon-detail-title h2')?.textContent?.trim();
      const id = weaponIds.get(name);
      if (!id) continue;
      detail.dataset.phase2Enhanced = 'true';
      const title = detail.querySelector('.weapon-detail-title');
      if (title) title.insertAdjacentHTML('afterend', modelMarkup(id));
    }
  }

  function boot() {
    ensureStyles();
    document.body.classList.add('ui-v20');
    structureNav();
    document.querySelectorAll('.settings-panel').forEach(categorizeSettings);
    enhanceLoadoutPreview();

    const observer = new MutationObserver(() => {
      structureNav();
      document.querySelectorAll('.settings-panel').forEach(categorizeSettings);
      enhanceLoadoutPreview();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
