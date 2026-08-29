import { ARENA_RANKS } from './ArenaStore.js';

const safe = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
}[char]));

const FRAMES = Object.freeze({
  entry: `
    <path d="M48 4 82 18v36c0 23-13 41-34 54C27 95 14 77 14 54V18Z" fill="#050b10" stroke="currentColor" stroke-width="3"/>
    <path d="M48 11 75 22v31c0 18-9 33-27 44-18-11-27-26-27-44V22Z" fill="currentColor" opacity=".07" stroke="currentColor" stroke-width="1.5"/>
    <path d="M25 20 48 11l23 9M27 89c7 6 14 11 21 15 7-4 14-9 21-15" fill="none" stroke="#eef8fb" stroke-width="1.1" opacity=".3"/>`,
  tiered: `
    <path d="m48 3 36 21-8 58-28 27-28-27-8-58Z" fill="#050b10" stroke="currentColor" stroke-width="3"/>
    <path d="m48 12 28 16-6 49-22 22-22-22-6-49Z" fill="currentColor" opacity=".08" stroke="currentColor" stroke-width="1.5"/>
    <path d="M19 32 8 40l10 10M77 32l11 8-10 10" fill="none" stroke="currentColor" stroke-width="3" opacity=".55"/>`,
  command: `
    <path d="m48 4 28 13 12 29-12 44-28 19-28-19L8 46l12-29Z" fill="#050b10" stroke="currentColor" stroke-width="3"/>
    <path d="m48 13 22 10 9 24-9 37-22 15-22-15-9-37 9-24Z" fill="currentColor" opacity=".075" stroke="currentColor" stroke-width="1.5"/>
    <path d="M14 48h15M67 48h15M48 9v13M48 89v14" fill="none" stroke="currentColor" stroke-width="2.5" opacity=".6"/>`,
  crystal: `
    <path d="m48 3 35 30-10 54-25 23-25-23-10-54Z" fill="#040910" stroke="currentColor" stroke-width="3.2"/>
    <path d="M48 12 73 35 48 98 23 35Z" fill="currentColor" opacity=".11" stroke="currentColor" stroke-width="1.6"/>
    <path d="M23 35 48 52l25-17M48 12v86M33 25l15 27 15-27" fill="none" stroke="#effbff" stroke-width="1.3" opacity=".32"/>`,
  apex: `
    <path d="m48 3 18 15 20-5-3 21 12 15-14 16 4 24-23 3-14 18-14-18-23-3 4-24L1 49l12-15-3-21 20 5Z" fill="#03070b" stroke="currentColor" stroke-width="3"/>
    <path d="m48 14 14 13 16-4-2 17 10 10-11 12 3 18-18 3-12 15-12-15-18-3 3-18L10 50l10-10-2-17 16 4Z" fill="currentColor" opacity=".075" stroke="currentColor" stroke-width="1.4"/>`
});

function familyFor(index) {
  if (index <= 2) return 'entry';
  if (index <= 7) return 'tiered';
  if (index <= 9) return 'command';
  if (index <= 11) return 'crystal';
  return 'apex';
}

function tierMarks(index) {
  const count = index <= 2 ? index : index <= 5 ? index - 2 : index <= 7 ? index - 5 : 0;
  if (!count) return '';
  const start = 48 - ((count * 10 - 3) / 2);
  return `<g class="arena-emblem-tier" fill="currentColor">${Array.from({ length:count }, (_, mark) =>
    `<path d="M${start + mark * 10} 91h7l-1.5 6h-4Z"/>`).join('')}</g>`;
}

// Each competitive rank has an authored, compact primary mark. Families share
// construction logic, while silhouettes and tier language remain distinct.
const ART = Object.freeze({
  prospect: `
    <path d="M31 68 48 31l17 37-17 13Z" fill="none" stroke="currentColor" stroke-width="4"/>
    <path d="M39 64h18M43 54h10" stroke="currentColor" stroke-width="3"/>`,
  'rookie-i': `
    <path d="M29 67 48 30l19 37-19 16Z" fill="currentColor" opacity=".14" stroke="currentColor" stroke-width="3"/>
    <path d="m34 67 14 8 14-8" fill="none" stroke="currentColor" stroke-width="4"/>`,
  'rookie-ii': `
    <path d="M28 64 48 28l20 36-20 20Z" fill="currentColor" opacity=".15" stroke="currentColor" stroke-width="3"/>
    <path d="m33 61 15 8 15-8M36 72l12 7 12-7" fill="none" stroke="currentColor" stroke-width="4"/>`,
  'bronze-i': `
    <path d="m48 26 22 20-8 31-14 10-14-10-8-31Z" fill="#3c281d" stroke="currentColor" stroke-width="3"/>
    <path d="M48 39v35M39 52h18" stroke="currentColor" stroke-width="4"/>`,
  'bronze-ii': `
    <path d="m48 24 24 21-9 34-15 10-15-10-9-34Z" fill="#3d291d" stroke="currentColor" stroke-width="3"/>
    <path d="m36 49 12-9 12 9-4 25-8 6-8-6Z" fill="none" stroke="currentColor" stroke-width="4"/>
    <path d="M40 55h16" stroke="currentColor" stroke-width="3"/>`,
  'bronze-iii': `
    <path d="m48 22 26 22-10 37-16 11-16-11-10-37Z" fill="#3f291b" stroke="currentColor" stroke-width="3"/>
    <path d="m34 49 14-12 14 12-5 28-9 7-9-7Z" fill="none" stroke="currentColor" stroke-width="4"/>
    <path d="M38 55h20M37 66h22" stroke="currentColor" stroke-width="3"/>`,
  'silver-i': `
    <path d="M48 30 59 48l-11 26-11-26Z" fill="currentColor" opacity=".2" stroke="currentColor" stroke-width="3"/>
    <path d="m36 48-16-10 5 17-10 6 22 8m22-21 16-10-5 17 10 6-22 8" fill="none" stroke="currentColor" stroke-width="4"/>
    <path d="M36 80h24" stroke="currentColor" stroke-width="4"/>`,
  'silver-ii': `
    <path d="M48 26 61 48 48 78 35 48Z" fill="currentColor" opacity=".23" stroke="currentColor" stroke-width="3"/>
    <path d="m35 45-18-12 6 20-11 7 24 9m25-24 18-12-6 20 11 7-24 9" fill="none" stroke="currentColor" stroke-width="4"/>
    <path d="m39 81 9-6 9 6-9 7Z" fill="currentColor"/>`,
  gold: `
    <path d="m25 47 9-17 14 11 14-11 9 17-8 30H33Z" fill="#3f351a" stroke="currentColor" stroke-width="3.5"/>
    <path d="M32 77h32M38 85h20" stroke="currentColor" stroke-width="4"/>
    <circle cx="48" cy="58" r="8" fill="currentColor"/>`,
  platinum: `
    <path d="m48 23 25 20v29L48 90 23 72V43Z" fill="currentColor" opacity=".12" stroke="currentColor" stroke-width="3.5"/>
    <path d="m48 34 14 12-5 18-9 13-9-13-5-18Z" fill="none" stroke="currentColor" stroke-width="4"/>
    <path d="M24 52h14M58 52h14" stroke="currentColor" stroke-width="3"/>`,
  diamond: `
    <path d="m48 22 25 22-25 45-25-45Z" fill="#12384d" stroke="currentColor" stroke-width="3.5"/>
    <path d="m23 44 25 15 25-15M48 22v67M34 34l14 25 14-25" fill="none" stroke="currentColor" stroke-width="2.5"/>`,
  'pink-diamond': `
    <path d="m48 20 27 23-27 48-27-48Z" fill="#4a1a3f" stroke="currentColor" stroke-width="3.5"/>
    <path d="m21 43 27 16 27-16M48 20v71M32 33l16 26 16-26" fill="none" stroke="currentColor" stroke-width="2.5"/>
    <path d="M18 58h10M68 58h10" stroke="currentColor" stroke-width="3"/>`,
  'dark-opal': `
    <path d="M48 18 73 34l7 28-19 25H35L16 62l7-28Z" fill="#110e19" stroke="currentColor" stroke-width="4"/>
    <path d="m48 31 8 16 17 3-13 12 3 17-15-8-15 8 3-17-13-12 17-3Z" fill="currentColor" opacity=".42"/>
    <circle cx="48" cy="58" r="9" fill="#030609" stroke="currentColor" stroke-width="2.5"/>`,
  omnipotent: `
    <path d="m17 43 11-20 20 13 20-13 11 20-9 40H26Z" fill="#050a0e" stroke="currentColor" stroke-width="4"/>
    <path d="M28 23 20 13M68 23l8-10M48 35V13" stroke="currentColor" stroke-width="3.5"/>
    <circle cx="48" cy="58" r="18" fill="#020609" stroke="currentColor" stroke-width="3"/>
    <circle cx="48" cy="58" r="9" fill="currentColor" opacity=".2"/>
    <circle cx="48" cy="58" r="4" fill="#f3fbfd"/>
    <path d="M48 34v8M48 74v8M24 58h8M64 58h8" stroke="currentColor" stroke-width="2.5"/>
    <path d="M27 84h42l-7 10H34Z" fill="currentColor" opacity=".72"/>`
});

export function arenaBadgeMarkup(rank, className = '') {
  const resolved = ARENA_RANKS.find((entry) => entry.id === rank?.id) || ARENA_RANKS[0];
  const index = ARENA_RANKS.findIndex((entry) => entry.id === resolved.id);
  const family = familyFor(index);
  return `<span class="arena-rank-badge arena-rank-${safe(family)} ${safe(className)}" data-arena-rank-badge="${safe(resolved.id)}" data-arena-emblem="authored" data-arena-family="${safe(family)}" data-arena-index="${index}" style="--arena-rank-tone:${safe(resolved.tone)}" title="${safe(resolved.title)}">
    <svg viewBox="0 0 96 112" aria-hidden="true"><g class="arena-emblem-frame">${FRAMES[family]}</g><g class="arena-emblem-art">${ART[resolved.id] || ART.prospect}</g>${tierMarks(index)}</svg>
  </span>`;
}

export const ARENA_EMBLEM_IDS = Object.freeze(Object.keys(ART));
