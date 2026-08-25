/* Skirmish Arena 2.01.3 — restore normal menu scrolling and keep Loadouts on one page. */
function ensureStyle(href) {
  if ([...document.querySelectorAll('link[rel="stylesheet"]')].some((link) => link.getAttribute('href') === href)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

ensureStyle('ui-2.01.3.css');
document.body.classList.add('ui-2013');
