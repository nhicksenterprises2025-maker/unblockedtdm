import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ARENA_RANKS } from '../game/src/arena/ArenaStore.js';
import { CAREER_RANKS } from '../game/src/progression/ProgressionStore.js';

const read = (relative) => fs.readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8');
const arenaRuntime = read('game/src/phase2431-runtime.js');
const careerRuntime = read('game/src/phase211-runtime.js');
const progressionCss = read('game/src/ui-2.6.0-progression.css');
const phase6Runtime = read('game/src/phase6-runtime.js');
const phase6Css = read('game/src/ui-phase6.css');
const logoRuntime = read('game/src/phase231-runtime.js');
const emblem = read('game/src/assets/skirmish-arena-emblem.svg');
const wordmark = read('game/src/assets/skirmish-arena-main-logo.svg');

// The persisted Arena ladder remains exact while presentation-only material
// subtitles are absent from every rank card.
assert.equal(ARENA_RANKS.length, 14);
assert.deepEqual(ARENA_RANKS.map((rank) => rank.title), [
  'PROSPECT', 'ROOKIE I', 'ROOKIE II', 'BRONZE TIER I', 'BRONZE TIER II',
  'BRONZE TIER III', 'SILVER TIER I', 'SILVER TIER II', 'GOLD', 'PLATINUM',
  'DIAMOND', 'PINK DIAMOND', 'DARK OPAL', 'OMNIPOTENT'
]);
assert.deepEqual(ARENA_RANKS.map((rank) => rank.threshold), [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3200, 3600, 3900, 4200]);
assert.equal(arenaRuntime.includes('rank.material'), false, 'Arena material/color subtitles must not be rendered.');
for (const token of ['arena-rank-threshold', 'CURRENT RANK', 'THRESHOLD REACHED', 'AP TO UNLOCK', 'arena-history-summary']) {
  assert.ok(arenaRuntime.includes(token), `Arena progression presentation is missing ${token}.`);
}

// Career remains the complete permanent ladder and uses real saved profile data
// to compose its overview instead of stretching empty panels.
assert.equal(CAREER_RANKS.length, 26);
for (const token of [
  "ensureStyle('ui-2.6.0-progression.css')",
  'career-overview-composition',
  'career-overview-support',
  'career-overview-recent',
  '(profile.recent || []).slice(0, 5)',
  'career-milestone-row'
]) assert.ok(careerRuntime.includes(token), `Career progression presentation is missing ${token}.`);
for (const token of [
  '.career-overview-identity h1',
  'font-size:clamp(58px,5vw,82px)',
  '.career-account-grid strong',
  'font-size:28px',
  '.career-rank-grid{grid-template-columns:repeat(3',
  '.career-milestone-row',
  'min-height:104px',
  '.arena-rank-copy strong',
  'font-size:21px',
  '.arena-history-row strong'
]) assert.ok(progressionCss.includes(token), `Readable progression scale is missing ${token}.`);

// The small and large marks consume one authored core emblem family.
for (const source of [emblem, wordmark]) assert.ok(source.includes('data-brand-system="sa-command-mark-v2"'));
assert.ok(emblem.includes('data-monogram-letter="s"'));
assert.ok(emblem.includes('data-monogram-letter="a"'));
const monogramPath = (source, letter) => source.match(new RegExp(`data-monogram-letter="${letter}"[^>]*d="([^"]+)"`))?.[1];
assert.equal(monogramPath(wordmark, 's'), monogramPath(emblem, 's'), 'Large and small marks must share the exact authored S geometry.');
assert.equal(monogramPath(wordmark, 'a'), monogramPath(emblem, 'a'), 'Large and small marks must share the exact authored A geometry.');
assert.ok(wordmark.includes('data-brand-source="skirmish-arena-emblem.svg"'));
assert.equal(wordmark.includes('<image href="skirmish-arena-emblem.svg"'), false, 'Electron-safe Home branding must not rely on a blocked nested SVG image.');
assert.ok(wordmark.includes('>SKIRMISH</text>') && wordmark.includes('>ARENA</text>'));
assert.ok(progressionCss.includes('background-image:url("assets/skirmish-arena-emblem.svg")'));
assert.ok(progressionCss.includes('#mainMenu .menu-brand .menu-mark'));
assert.ok(progressionCss.includes('.menu-brand .menu-mark>img{display:none!important}'), 'The legacy nested mark must not cover the shared 2.6 emblem.');
assert.ok(logoRuntime.includes("logo.dataset.brandSystem = 'sa-command-mark-v2'"));

// Home command ordering stays accessible without rendering decorative 01–05 indices.
assert.ok(phase6Runtime.includes("removeAttribute('data-phase6-index')"));
assert.ok(phase6Runtime.includes("setAttribute('aria-posinset'"));
assert.ok(phase6Runtime.includes("setAttribute('aria-setsize'"));
assert.equal(phase6Css.includes('content:attr(data-phase6-index)'), false);
assert.ok(progressionCss.includes('content:none!important'));

console.log('Skirmish Arena 2.6 progression/brand checks passed: full rank data, subtitle cleanup, readable dense pages, one SA emblem family, and counter-free Home tiles.');
