import { ARENA_RANKS } from './ArenaStore.js';

const safe = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));

const FRAME = `
  <path d="M48 3 86 17v37c0 25-15 45-38 57C25 99 10 79 10 54V17Z" fill="#02070b" stroke="#02070b" stroke-width="6"/>
  <path d="M48 4 84 18v35c0 24-14 43-36 55C26 96 12 77 12 53V18Z" fill="#081219" stroke="currentColor" stroke-width="3"/>
  <path d="M48 10 77 21v32c0 19-10 35-29 46-19-11-29-27-29-46V21Z" fill="currentColor" opacity=".075" stroke="currentColor" stroke-width="1.4"/>
  <path d="M17 25 8 31v17M79 25l9 6v17M21 88l-9-4M75 88l9-4" fill="none" stroke="currentColor" stroke-width="2.4" opacity=".56"/>
  <path d="M26 17 48 9l22 8M25 91c7 7 14 12 23 17 9-5 16-10 23-17" fill="none" stroke="#f4fbff" stroke-width="1.2" opacity=".28"/>
  <g fill="#dff7ff" opacity=".7"><circle cx="20" cy="28" r="1.5"/><circle cx="76" cy="28" r="1.5"/><circle cx="22" cy="76" r="1.5"/><circle cx="74" cy="76" r="1.5"/></g>`;

const BACKPLATES = Object.freeze({
  prospect:'<path d="m48 18 22 12-6 10H32l-6-10Z" fill="currentColor" opacity=".12"/>',
  rookie:'<path d="M20 54 8 61l12 7M76 54l12 7-12 7" fill="none" stroke="currentColor" stroke-width="4" opacity=".65"/>',
  bronze:'<path d="M19 38 7 48l10 9M77 38l12 10-10 9" fill="currentColor" opacity=".32" stroke="currentColor" stroke-width="2"/>',
  silver:'<path d="m22 37-16 8 11 9-13 9 24 6M74 37l16 8-11 9 13 9-24 6" fill="currentColor" opacity=".2" stroke="currentColor" stroke-width="2"/>',
  prestige:'<path d="m25 31 8-13 15 9 15-9 8 13" fill="none" stroke="currentColor" stroke-width="3" opacity=".72"/>',
  crystal:'<path d="m48 13 8 12 14-3-4 13 12 7-13 5M48 13 40 25l-14-3 4 13-12 7 13 5" fill="currentColor" opacity=".18" stroke="currentColor" stroke-width="1.8"/>',
  apex:'<path d="M7 56h13M76 56h13M48 8v13M48 91v14M16 27l10 9M80 27l-10 9" fill="none" stroke="currentColor" stroke-width="3" opacity=".78"/>'
});

function familyFor(index) {
  if (index === 0) return 'prospect';
  if (index <= 2) return 'rookie';
  if (index <= 5) return 'bronze';
  if (index <= 7) return 'silver';
  if (index <= 9) return 'prestige';
  if (index <= 11) return 'crystal';
  return 'apex';
}

function tierMarks(index) {
  const count = index <= 2 ? index : index >= 3 && index <= 5 ? index - 2 : index >= 6 && index <= 7 ? index - 5 : 0;
  if (!count) return '';
  const width = count * 8 - 2;
  const start = 48 - width / 2;
  return `<g fill="currentColor" opacity=".82">${Array.from({ length:count }, (_, mark) => `<path d="M${start + mark * 8} 92h6l-1 5h-4Z"/>`).join('')}</g>`;
}

const ART = Object.freeze({
  prospect: `
    <path d="M30 67 48 31l18 36-18 14Z" fill="none" stroke="currentColor" stroke-width="4"/>
    <path d="M39 63h18M43 53h10" stroke="currentColor" stroke-width="3" opacity=".62"/>`,
  'rookie-i': `
    <path d="M28 69 48 29l20 40-20 14Z" fill="currentColor" opacity=".14" stroke="currentColor" stroke-width="3"/>
    <path d="M32 70 48 78l16-8" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>`,
  'rookie-ii': `
    <path d="M28 67 48 29l20 38-20 16Z" fill="currentColor" opacity=".16" stroke="currentColor" stroke-width="3"/>
    <path d="M31 64 48 72l17-8M34 73l14 7 14-7" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>`,
  'bronze-i': `
    <path d="M25 64 48 27l23 37-23 20Z" fill="#4c2e1f" stroke="currentColor" stroke-width="3"/>
    <path d="M48 39v31M39 48h18" stroke="currentColor" stroke-width="5" stroke-linecap="square"/>`,
  'bronze-ii': `
    <path d="M24 63 48 26l24 37-24 22Z" fill="#50301f" stroke="currentColor" stroke-width="3"/>
    <path d="m34 47 14-9 14 9-5 24H39Z" fill="none" stroke="currentColor" stroke-width="4"/>
    <path d="M42 49h12M42 59h12" stroke="currentColor" stroke-width="3"/>`,
  'bronze-iii': `
    <path d="M22 62 48 24l26 38-26 24Z" fill="#55301c" stroke="currentColor" stroke-width="3"/>
    <path d="m30 52 18-17 18 17-6 24-12 7-12-7Z" fill="none" stroke="currentColor" stroke-width="4"/>
    <path d="M39 57h18M37 66h22M41 75h14" stroke="currentColor" stroke-width="3"/>`,
  'silver-i': `
    <path d="M48 34 58 49l-10 21-10-21Z" fill="currentColor" opacity=".22" stroke="currentColor" stroke-width="3"/>
    <path d="M38 48 24 39l5 16-10 5 19 8M58 48l14-9-5 16 10 5-19 8" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M35 79h26" stroke="currentColor" stroke-width="4"/>`,
  'silver-ii': `
    <path d="M48 29 60 48 48 72 36 48Z" fill="currentColor" opacity=".24" stroke="currentColor" stroke-width="3"/>
    <path d="M36 45 20 34l6 18-11 7 21 8M60 45l16-11-6 18 11 7-21 8" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
    <path d="m40 80 8-5 8 5-8 7Z" fill="currentColor"/>`,
  gold: `
    <path d="m24 47 9-15 15 10 15-10 9 15-8 25H32Z" fill="#4b3c16" stroke="currentColor" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M31 72h34M37 80h22" stroke="currentColor" stroke-width="4"/>
    <circle cx="48" cy="56" r="8" fill="currentColor" opacity=".9"/>`,
  platinum: `
    <path d="m48 24 24 17v29L48 87 24 70V41Z" fill="currentColor" opacity=".12" stroke="currentColor" stroke-width="3.5"/>
    <path d="m48 34 14 10-5 17-9 13-9-13-5-17Z" fill="none" stroke="currentColor" stroke-width="4"/>
    <path d="M25 48h14M57 48h14M30 72l10-8M66 72l-10-8" stroke="currentColor" stroke-width="3"/>`,
  diamond: `
    <path d="m48 25 23 20-23 40-23-40Z" fill="#123d57" stroke="currentColor" stroke-width="3.5"/>
    <path d="m25 45 23 13 23-13M48 25v60M35 34l13 24 13-24" fill="none" stroke="currentColor" stroke-width="2.4" opacity=".9"/>
    <path d="m19 55 8 4-8 4-4 8-4-8-8-4 8-4 4-8Z" fill="currentColor" opacity=".65"/>`,
  'pink-diamond': `
    <path d="m48 22 26 21-26 44-26-44Z" fill="#5a1749" stroke="currentColor" stroke-width="3.5"/>
    <path d="m22 43 26 15 26-15M48 22v65M33 34l15 24 15-24" fill="none" stroke="currentColor" stroke-width="2.5"/>
    <path d="m78 28 4 7 8 2-6 6 1 8-7-4-7 4 1-8-6-6 8-2Z" fill="currentColor" opacity=".78"/>`,
  'dark-opal': `
    <path d="M48 20 73 35 78 63 59 86H37L18 63l5-28Z" fill="#130f20" stroke="currentColor" stroke-width="4"/>
    <path d="m48 30 7 15 16 2-12 11 4 16-15-8-15 8 4-16-12-11 16-2Z" fill="currentColor" opacity=".54"/>
    <circle cx="48" cy="55" r="9" fill="#05080c" stroke="currentColor" stroke-width="2.5"/>
    <path d="M22 70 12 82M74 70l10 12M31 29 22 18M65 29l9-11" stroke="currentColor" stroke-width="3"/>`,
  omnipotent: `
    <path d="m18 44 10-18 20 12 20-12 10 18-8 38H26Z" fill="#060b10" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
    <path d="M28 26 20 15M68 26l8-11M48 36V16" stroke="currentColor" stroke-width="3.5"/>
    <circle cx="48" cy="58" r="18" fill="#020609" stroke="currentColor" stroke-width="3"/>
    <circle cx="48" cy="58" r="10" fill="currentColor" opacity=".2"/>
    <circle cx="48" cy="58" r="4" fill="#f4feff"/>
    <path d="M48 32v8M48 76v8M22 58h8M66 58h8M30 40l6 6M60 70l6 6M66 40l-6 6M36 70l-6 6" stroke="currentColor" stroke-width="2.7"/>
    <path d="M27 84h42L62 94H34Z" fill="currentColor" opacity=".7"/>`
});

export function arenaBadgeMarkup(rank, className = '') {
  const resolved = ARENA_RANKS.find((entry) => entry.id === rank?.id) || ARENA_RANKS[0];
  const index = ARENA_RANKS.findIndex((entry) => entry.id === resolved.id);
  const family = familyFor(index);
  const art = ART[resolved.id] || ART.prospect;
  return `<span class="arena-rank-badge arena-rank-${safe(family)} ${safe(className)}" data-arena-rank-badge="${safe(resolved.id)}" data-arena-emblem="authored" data-arena-family="${safe(family)}" data-arena-index="${index}" style="--arena-rank-tone:${safe(resolved.tone)}" title="${safe(resolved.title)}">
    <svg viewBox="0 0 96 112" aria-hidden="true"><g class="arena-emblem-frame">${FRAME}</g><g class="arena-emblem-backplate">${BACKPLATES[family] || ''}</g><g class="arena-emblem-art">${art}</g>${tierMarks(index)}</svg>
  </span>`;
}

export const ARENA_EMBLEM_IDS = Object.freeze(Object.keys(ART));
