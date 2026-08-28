import { WEAPON_LIST } from '../data/weapons.js';
import { GameSettings, bindingLabel, mouseBindingCode } from '../engine/GameSettings.js';

const WEAPON_BY_ID = new Map(WEAPON_LIST.map((weapon) => [weapon.id, weapon]));
const FEED_LIFETIME_MS = 6500;

function playerLabel(row = {}) {
  if (row.isLocal || row.id === 'local-blue') return 'YOU';
  if (row.displayName) return String(row.displayName);
  return String(row.id || 'UNKNOWN').replaceAll('-', ' ').toUpperCase();
}

function kdLabel(row = {}) {
  const deaths = Number(row.deaths || 0);
  const kills = Number(row.kills || 0);
  return deaths > 0 ? (kills / deaths).toFixed(2) : kills.toFixed(2);
}

function safe(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function teamClass(team) {
  return team === 'blue' ? 'team-blue' : team === 'red' ? 'team-red' : 'team-world';
}

export class TacticalHUD {
  constructor({ minimapRenderer, players, localPlayer, settings = null } = {}) {
    this.minimapRenderer = minimapRenderer;
    this.players = players || [];
    this.localPlayer = localPlayer || null;
    this.settings = settings || new GameSettings();
    this.active = false;
    this.tabHeld = false;
    this.mapVisible = false;
    this.feed = [];
    this.install();
    this.bindControls();
    this.syncControlCopy();
  }

  install() {
    const root = document.createElement('section');
    root.id = 'phase3TacticalHud';
    root.className = 'phase3-tactical-hud';
    root.innerHTML = `
      <div class="phase3-tactical-legend"><span><b data-map-binding>M</b> TACTICAL MAP</span><span><b data-scoreboard-binding>TAB</b> SCOREBOARD</span></div>
      <aside id="phase3KillFeed" class="phase3-kill-feed" aria-live="polite"></aside>
      <section id="phase3Scoreboard" class="phase3-scoreboard" aria-hidden="true">
        <div class="phase3-scoreboard-shell">
          <header><div><small>SKIRMISH ARENA // LIVE MATCH</small><h2>SCOREBOARD</h2></div><div class="phase3-score-summary"><span class="team-blue">BLUE <b id="phase3BlueScore">0</b></span><em>:</em><span class="team-red"><b id="phase3RedScore">0</b> RED</span></div></header>
          <div class="phase3-top-three" id="phase3TopThree"></div>
          <div class="phase3-score-head"><span>RANK / PLAYER</span><span>K</span><span>D</span><span>A</span><span>K/D</span><span>DMG</span></div>
          <div class="phase3-score-rows" id="phase3ScoreRows"></div>
          <footer>HOLD <b data-scoreboard-binding>TAB</b> TO VIEW · #1 OVERALL = MVP</footer>
        </div>
      </section>
      <section id="phase3Map" class="phase3-map-overlay" aria-hidden="true">
        <div class="phase3-map-shell">
          <header><div><small>TRAINING COMPLEX // LIVE TACTICAL DATA</small><h2>TACTICAL MAP</h2></div><div class="phase3-map-key"><span class="you">YOU</span><span class="friendly">TEAM</span><span class="enemy">REVEALED ENEMY</span></div></header>
          <canvas id="phase3MapCanvas" width="960" height="660"></canvas>
          <footer>PRESS <b data-map-binding>M</b> TO CLOSE · ENEMIES REVEAL FOR 1.5S AFTER FIRING</footer>
        </div>
      </section>`;
    document.body.appendChild(root);
    this.root = root;
    this.killFeedRoot = root.querySelector('#phase3KillFeed');
    this.scoreboardRoot = root.querySelector('#phase3Scoreboard');
    this.scoreRows = root.querySelector('#phase3ScoreRows');
    this.topThree = root.querySelector('#phase3TopThree');
    this.mapRoot = root.querySelector('#phase3Map');
    this.mapCanvas = root.querySelector('#phase3MapCanvas');
  }

  binding(action) {
    return this.settings?.binding?.(action) || null;
  }

  syncControlCopy() {
    const mapLabel = bindingLabel(this.binding('map'));
    const scoreboardLabel = bindingLabel(this.binding('scoreboard'));
    for (const node of this.root.querySelectorAll('[data-map-binding]')) node.textContent = mapLabel;
    for (const node of this.root.querySelectorAll('[data-scoreboard-binding]')) node.textContent = scoreboardLabel;
  }

  handleControlDown(code, repeat = false, event = null) {
    if (!this.active || !code) return;
    if (code === this.binding('scoreboard')) {
      event?.preventDefault?.();
      this.tabHeld = true;
      this.syncVisibility();
    }
    if (code === this.binding('map') && !repeat) {
      event?.preventDefault?.();
      this.mapVisible = !this.mapVisible;
      this.syncVisibility();
    }
  }

  handleControlUp(code, event = null) {
    if (!code || code !== this.binding('scoreboard')) return;
    event?.preventDefault?.();
    this.tabHeld = false;
    this.syncVisibility();
  }

  bindControls() {
    window.addEventListener('keydown', (event) => this.handleControlDown(event.code, event.repeat, event), true);
    window.addEventListener('keyup', (event) => this.handleControlUp(event.code, event), true);
    window.addEventListener('mousedown', (event) => this.handleControlDown(mouseBindingCode(event.button), false, event), true);
    window.addEventListener('mouseup', (event) => this.handleControlUp(mouseBindingCode(event.button), event), true);
    window.addEventListener('blur', () => {
      this.tabHeld = false;
      this.syncVisibility();
    });
    window.addEventListener('unblockedtdm:settings-change', () => {
      this.tabHeld = false;
      this.syncControlCopy();
      this.syncVisibility();
    });
  }

  setActive(value) {
    this.active = Boolean(value);
    this.root.classList.toggle('active', this.active);
    if (!this.active) {
      this.tabHeld = false;
      this.mapVisible = false;
    }
    this.syncVisibility();
  }

  syncVisibility() {
    const scoreboard = this.active && this.tabHeld && !this.mapVisible;
    const map = this.active && this.mapVisible;
    this.scoreboardRoot.classList.toggle('visible', scoreboard);
    this.scoreboardRoot.setAttribute('aria-hidden', String(!scoreboard));
    this.mapRoot.classList.toggle('visible', map);
    this.mapRoot.setAttribute('aria-hidden', String(!map));
  }

  reset() {
    this.feed.length = 0;
    this.killFeedRoot.innerHTML = '';
    this.tabHeld = false;
    this.mapVisible = false;
    this.syncVisibility();
  }

  recordKill(event = {}, meta = {}) {
    const attackerRow = event.attacker || null;
    const victimRow = event.victim || null;
    const attacker = attackerRow ? playerLabel(attackerRow) : 'WORLD';
    const victim = playerLabel(victimRow || {});
    const weapon = WEAPON_BY_ID.get(meta.weaponId);
    const weaponLabel = weapon?.shortName || String(meta.weaponId || '—').toUpperCase();
    this.feed.unshift({
      attacker,
      attackerTeam: attackerRow?.team || null,
      victim,
      victimTeam: victimRow?.team || null,
      weapon: weaponLabel,
      critical: Boolean(meta.critical),
      at: performance.now()
    });
    this.feed = this.feed.slice(0, 6);
    this.renderFeed();
  }

  renderFeed() {
    const now = performance.now();
    this.feed = this.feed.filter((entry) => now - entry.at <= FEED_LIFETIME_MS);
    this.killFeedRoot.innerHTML = this.feed.map((entry) => `
      <div class="phase3-feed-row ${entry.critical ? 'critical' : ''}">
        <strong class="${teamClass(entry.attackerTeam)}">${safe(entry.attacker)}</strong><span>${safe(entry.weapon)}</span><b class="${teamClass(entry.victimTeam)}">${safe(entry.victim)}</b>${entry.critical ? '<em>CRITICAL</em>' : ''}
      </div>`).join('');
  }

  update(snapshot = {}, stats = []) {
    this.renderFeed();
    if (!this.active) return;

    const ranked = [...stats].sort((a, b) =>
      (b.kills - a.kills) || (b.damage - a.damage) || (a.deaths - b.deaths) || String(a.id).localeCompare(String(b.id))
    );
    document.getElementById('phase3BlueScore').textContent = snapshot.kills?.blue ?? 0;
    document.getElementById('phase3RedScore').textContent = snapshot.kills?.red ?? 0;

    this.topThree.innerHTML = ranked.slice(0, 3).map((row, index) => `
      <div class="rank-${index + 1} ${row.isLocal ? 'local' : ''}"><span>#${index + 1}${index === 0 ? ' MVP' : ''}</span><strong class="${teamClass(row.team)}">${safe(playerLabel(row))}</strong><small>${row.kills} K · ${row.damage} DMG</small></div>`).join('');

    this.scoreRows.innerHTML = ranked.map((row, index) => `
      <div class="phase3-score-row ${row.team} ${row.isLocal ? 'local' : ''} ${index < 3 ? `top-${index + 1}` : ''}">
        <span><i>${index + 1}</i><b class="${teamClass(row.team)}">${safe(playerLabel(row))}</b><small>${row.team.toUpperCase()}</small></span>
        <strong>${row.kills}</strong><strong>${row.deaths}</strong><strong>${row.assists}</strong><strong>${kdLabel(row)}</strong><strong>${row.damage}</strong>
      </div>`).join('');

    if (this.mapVisible) this.minimapRenderer?.drawFullMap?.(this.mapCanvas, { players: this.players, localPlayer: this.localPlayer });
  }
}
