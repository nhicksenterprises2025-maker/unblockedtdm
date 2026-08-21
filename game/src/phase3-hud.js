(() => {
  const state = { hud: null, feed: [] };

  function ensureStyles() {
    if (document.querySelector('link[data-skirmish-phase3]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'ui-v30.css';
    link.dataset.skirmishPhase3 = 'true';
    document.head.appendChild(link);
  }

  function playerName(id, isLocal = false) {
    if (isLocal || id === 'local-blue') return 'YOU';
    return String(id || 'UNKNOWN').replace(/-/g, ' ').toUpperCase();
  }

  function createHud() {
    if (document.getElementById('skirmishTacticalHud')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <section id="skirmishTacticalHud" class="skirmish-tactical-hud" aria-label="Tactical HUD">
        <div class="tactical-scorebar">
          <div class="team blue"><span>BLUE</span><strong data-hud="blue-wins">0</strong><small data-hud="blue-kills">0 KILLS</small></div>
          <div class="round"><span data-hud="round">ROUND 1 / 9</span><strong data-hud="timer">1:30</strong></div>
          <div class="team red"><span>RED</span><strong data-hud="red-wins">0</strong><small data-hud="red-kills">0 KILLS</small></div>
        </div>
        <div class="tactical-vitals">
          <div class="hud-meter health"><span>HEALTH</span><strong data-hud="health">150</strong><i><b data-hud-bar="health"></b></i></div>
          <div class="hud-meter stamina"><span>STAMINA</span><strong data-hud="stamina">100</strong><i><b data-hud-bar="stamina"></b></i></div>
          <div class="hud-dash"><span>DASH</span><strong data-hud="dash">4/4</strong></div>
        </div>
        <div class="tactical-weapon">
          <span data-hud="slot">PRIMARY</span><strong data-hud="weapon">ASSAULT RIFLE</strong>
          <div><b data-hud="mag">32</b><i>/</i><span data-hud="reserve">96</span></div>
          <small data-hud="weapon-state">READY</small>
        </div>
        <div class="tactical-controls"><span><kbd>M</kbd> MAP</span><span><kbd>TAB</kbd> SCOREBOARD</span><span><kbd>ESC</kbd> PAUSE</span></div>
        <div id="skirmishKillFeed" class="kill-feed"></div>
      </section>
      <section id="skirmishScoreboard" class="skirmish-scoreboard" aria-hidden="true">
        <div class="scoreboard-shell">
          <div class="scoreboard-head"><div><span>TACTICAL SCOREBOARD</span><h2>TRAINING COMPLEX</h2></div><div><strong data-score="round">ROUND —</strong><span data-score="timer">—</span></div></div>
          <div id="topPerformers" class="top-performers"></div>
          <div class="scoreboard-columns"><span>PLAYER</span><span>K</span><span>D</span><span>A</span><span>K/D</span><span>DMG</span></div>
          <div id="scoreboardRows" class="scoreboard-rows"></div>
          <div class="scoreboard-foot">HOLD TAB TO VIEW · #1 IS CURRENT MVP</div>
        </div>
      </section>
      <section id="skirmishFullMap" class="skirmish-full-map" aria-hidden="true">
        <div class="map-shell"><div class="map-head"><div><span>TACTICAL MAP</span><h2>TRAINING COMPLEX</h2></div><strong>M · CLOSE</strong></div><canvas id="skirmishMapCanvas" width="712" height="712"></canvas><div class="map-legend"><span class="self">LOCAL</span><span class="friendly">TEAM</span><span class="enemy">ENEMY REVEALED</span></div></div>
      </section>`);
  }

  function text(id, fallback = '') {
    return document.getElementById(id)?.textContent?.trim() || fallback;
  }

  function syncMirrors() {
    const root = document.getElementById('skirmishTacticalHud');
    if (!root) return;
    const set = (key, value) => { const el = root.querySelector(`[data-hud="${key}"]`); if (el) el.textContent = value; };
    set('blue-wins', text('blueRoundWins', '0'));
    set('blue-kills', `${text('blueKills', '0')} KILLS`);
    set('red-wins', text('redRoundWins', '0'));
    set('red-kills', `${text('redKills', '0')} KILLS`);
    set('round', text('roundLabel', 'ROUND 1 / 9'));
    set('timer', text('roundTimer', '1:30'));
    set('health', text('healthValue', '150'));
    set('stamina', text('staminaValue', '100'));
    set('dash', text('dashCount', '4/4'));
    set('slot', text('weaponSlot', 'PRIMARY'));
    set('weapon', text('weaponName', 'ASSAULT RIFLE'));
    set('mag', text('ammoMagazine', '—'));
    set('reserve', text('ammoReserve', '—'));
    set('weapon-state', text('weaponState', 'READY'));
    const health = Math.max(0, Math.min(150, Number(text('healthValue', '150')) || 0));
    const stamina = Math.max(0, Math.min(100, Number(text('staminaValue', '100')) || 0));
    const healthBar = root.querySelector('[data-hud-bar="health"]');
    const staminaBar = root.querySelector('[data-hud-bar="stamina"]');
    if (healthBar) healthBar.style.width = `${(health / 150) * 100}%`;
    if (staminaBar) staminaBar.style.width = `${stamina}%`;
    requestAnimationFrame(syncMirrors);
  }

  function renderScoreboard(detail) {
    state.hud = detail;
    const rows = document.getElementById('scoreboardRows');
    const top = document.getElementById('topPerformers');
    if (!rows || !top) return;
    const stats = [...(detail.stats || [])].sort((a, b) => b.kills - a.kills || b.damage - a.damage || b.assists - a.assists || a.deaths - b.deaths);
    top.innerHTML = stats.slice(0, 3).map((item, index) => `<div class="performer rank-${index + 1}"><span>#${index + 1}${index === 0 ? ' · MVP' : ''}</span><strong>${playerName(item.id, item.isLocal)}</strong><small>${item.kills} K · ${item.damage} DMG</small></div>`).join('');
    rows.innerHTML = stats.map((item, index) => `<div class="scoreboard-row ${item.team} ${item.isLocal ? 'local' : ''} ${index === 0 ? 'mvp' : ''}"><span>${playerName(item.id, item.isLocal)}</span><b>${item.kills}</b><b>${item.deaths}</b><b>${item.assists}</b><b>${Number(item.kd || 0).toFixed(2)}</b><b>${item.damage}</b></div>`).join('');
    const round = document.querySelector('[data-score="round"]');
    const timer = document.querySelector('[data-score="timer"]');
    if (round) round.textContent = `ROUND ${detail.round || 1} / 9`;
    if (timer) timer.textContent = detail.timerLabel || '—';
  }

  function renderFeed() {
    const root = document.getElementById('skirmishKillFeed');
    if (!root) return;
    const now = performance.now();
    state.feed = state.feed.filter((item) => now - item.time < 6500).slice(-6);
    root.innerHTML = state.feed.map((item) => `<div class="kill-line ${item.critical ? 'critical' : ''}"><strong>${item.killer}</strong><span>${item.weapon}</span><b>${item.victim}</b>${item.critical ? '<i>CRITICAL</i>' : ''}</div>`).join('');
  }

  function onKill(detail) {
    state.feed.push({
      killer: detail.killerId ? playerName(detail.killerId, detail.killerId === 'local-blue') : 'WORLD',
      victim: playerName(detail.victimId, detail.victimId === 'local-blue'),
      weapon: detail.weapon || 'COMBAT',
      critical: Boolean(detail.critical),
      time: performance.now()
    });
    renderFeed();
    setTimeout(renderFeed, 6600);
  }

  function setScoreboard(open) {
    const board = document.getElementById('skirmishScoreboard');
    if (!board) return;
    board.classList.toggle('visible', open);
    board.setAttribute('aria-hidden', String(!open));
  }

  function toggleMap(force = null) {
    const map = document.getElementById('skirmishFullMap');
    if (!map) return;
    const open = force === null ? !map.classList.contains('visible') : Boolean(force);
    map.classList.toggle('visible', open);
    map.setAttribute('aria-hidden', String(!open));
  }

  function copyMap() {
    const source = document.getElementById('minimapCanvas');
    const target = document.getElementById('skirmishMapCanvas');
    if (source && target) {
      const ctx = target.getContext('2d');
      ctx.clearRect(0, 0, target.width, target.height);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(source, 0, 0, target.width, target.height);
    }
    requestAnimationFrame(copyMap);
  }

  function bindKeys() {
    window.addEventListener('keydown', (event) => {
      if (!document.body.classList.contains('match-started')) return;
      if (event.code === 'Tab') {
        event.preventDefault();
        setScoreboard(true);
      }
      if (event.code === 'KeyM' && !event.repeat) {
        event.preventDefault();
        toggleMap();
      }
      if (event.code === 'Escape') toggleMap(false);
    }, true);
    window.addEventListener('keyup', (event) => {
      if (event.code === 'Tab') {
        event.preventDefault();
        setScoreboard(false);
      }
    }, true);
  }

  function boot() {
    ensureStyles();
    document.body.classList.add('ui-v30');
    createHud();
    bindKeys();
    window.addEventListener('skirmish:hud', (event) => renderScoreboard(event.detail || {}));
    window.addEventListener('skirmish:kill', (event) => onKill(event.detail || {}));
    syncMirrors();
    copyMap();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
