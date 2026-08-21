(() => {
  const BRAND = 'SKIRMISH ARENA';
  const replacements = new Map([
    ['UNBLOCKEDTDM', BRAND],
    ['UnblockedTDM', 'Skirmish Arena'],
    ['UNBLOCKED // TDM', BRAND],
    ['UNBLOCKED', 'SKIRMISH'],
    ['TDM //', 'ARENA //']
  ]);

  function replaceText(root = document.body) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      let value = node.nodeValue;
      for (const [from, to] of replacements) value = value.split(from).join(to);
      if (value !== node.nodeValue) node.nodeValue = value;
    }
  }

  function applyBrand() {
    document.title = 'Skirmish Arena';
    document.documentElement.dataset.product = 'skirmish-arena';
    document.body.classList.add('phase1-skirmish-branding');
    replaceText();

    for (const mark of document.querySelectorAll('.menu-mark, .build-hud .mark')) {
      mark.textContent = 'SA';
      mark.setAttribute('aria-label', 'Skirmish Arena');
    }

    const menuBrand = document.querySelector('.menu-brand strong');
    if (menuBrand) menuBrand.textContent = BRAND;
    const hudBrand = document.querySelector('.build-hud .brand strong');
    if (hudBrand) hudBrand.textContent = BRAND;
    const pauseBrand = document.querySelector('.pause-head p');
    if (pauseBrand) pauseBrand.textContent = BRAND;

    const hero = document.querySelector('.menu-hero');
    const heroTitle = hero?.querySelector('h1');
    if (hero && heroTitle && !hero.querySelector('.sa-wordmark')) {
      const image = document.createElement('img');
      image.className = 'sa-wordmark';
      image.src = 'assets/skirmish-arena-wordmark.svg';
      image.alt = 'Skirmish Arena';
      heroTitle.replaceWith(image);
    } else if (heroTitle) {
      heroTitle.textContent = BRAND;
      heroTitle.classList.add('sa-fallback-title');
    }

    const buildLabel = document.getElementById('mainBuildLabel');
    if (buildLabel) buildLabel.dataset.brandPhase = '1';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyBrand, { once: true });
  else applyBrand();

  const observer = new MutationObserver(() => {
    replaceText();
    const menuBrand = document.querySelector('.menu-brand strong');
    if (menuBrand && menuBrand.textContent !== BRAND) menuBrand.textContent = BRAND;
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
