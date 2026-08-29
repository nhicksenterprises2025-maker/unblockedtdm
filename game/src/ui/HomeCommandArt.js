export const HOME_COMMAND_ICON_VERSION = '2.5';

function commandIcon(kind, label, geometry) {
  const prefix = `sa25-${kind}`;
  return `<span class="ui221-nav-art ui250-command-art ui250-${kind}-art" aria-hidden="true" data-home-command-icon="${kind}" data-home-icon-family="command-metal" data-home-icon-version="${HOME_COMMAND_ICON_VERSION}">
    <svg viewBox="0 0 120 120" focusable="false" role="img" aria-label="${label}">
      <defs>
        <linearGradient id="${prefix}-steel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".2" stop-color="#c6cfd5"/><stop offset=".48" stop-color="#69757e"/><stop offset=".7" stop-color="#e9eef1"/><stop offset="1" stop-color="#7d8991"/></linearGradient>
        <linearGradient id="${prefix}-edge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f9fcfd"/><stop offset="1" stop-color="#738089"/></linearGradient>
        <linearGradient id="${prefix}-dark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#24313a"/><stop offset="1" stop-color="#071016"/></linearGradient>
        <filter id="${prefix}-shadow" x="-25%" y="-25%" width="150%" height="165%"><feDropShadow dx="0" dy="5" stdDeviation="3.2" flood-color="#00060a" flood-opacity=".56"/></filter>
      </defs>
      <g filter="url(#${prefix}-shadow)">${geometry(prefix)}</g>
    </svg>
  </span>`;
}

export function weaponInfoCommandIcon() {
  return commandIcon('weapon-info', 'Weapon information', (prefix) => `
    <path d="M20 24h70l12 12v58H30L18 82V26Z" fill="url(#${prefix}-steel)" stroke="url(#${prefix}-edge)" stroke-width="3" stroke-linejoin="round"/>
    <path d="M27 32h58l9 9v45H34l-8-8V33Z" fill="url(#${prefix}-dark)" stroke="#3d4c55" stroke-width="2"/>
    <path d="M86 32v11h10" fill="none" stroke="#f1f6f8" stroke-width="2" opacity=".72"/>
    <path d="M36 57h12l5-6h23l7 5h12v8H82l-7 7H57l-4-7H36Z" fill="#202d35" stroke="#dfe7eb" stroke-width="3" stroke-linejoin="round"/>
    <path d="M57 70v9h10l6-9M43 47h30" fill="none" stroke="#4dcbed" stroke-width="2.5" stroke-linecap="square"/>
    <path d="M33 89h53" stroke="#5bcff0" stroke-width="3"/>
  `);
}

export function settingsCommandIcon() {
  return commandIcon('settings', 'Settings', (prefix) => `
    <path d="M60 10 101 34v52l-41 24-41-24V34Z" fill="url(#${prefix}-steel)" stroke="url(#${prefix}-edge)" stroke-width="3" stroke-linejoin="round"/>
    <path d="M60 19 93 39v42L60 101 27 81V39Z" fill="url(#${prefix}-dark)" stroke="#394952" stroke-width="2"/>
    <path d="M39 43h42M39 60h42M39 77h42" stroke="#dce5e9" stroke-width="4" stroke-linecap="square"/>
    <path d="M53 37h10v12H53ZM68 54h10v12H68ZM45 71h10v12H45Z" fill="url(#${prefix}-steel)" stroke="#ffffff" stroke-width="1.5"/>
    <path d="M31 91 60 108l29-17" fill="none" stroke="#4cc9eb" stroke-width="3"/>
  `);
}

export function quitCommandIcon() {
  return commandIcon('quit', 'Quit game', (prefix) => `
    <path d="M24 18h48l12 11v62L72 102H24Z" fill="url(#${prefix}-steel)" stroke="url(#${prefix}-edge)" stroke-width="3" stroke-linejoin="round"/>
    <path d="M33 29h34l8 7v55H33Z" fill="url(#${prefix}-dark)" stroke="#43515a" stroke-width="2"/>
    <path d="M58 60h44" stroke="#e8eef1" stroke-width="8" stroke-linecap="square"/>
    <path d="m87 43 18 17-18 17" fill="none" stroke="url(#${prefix}-steel)" stroke-width="9" stroke-linecap="square" stroke-linejoin="miter"/>
    <path d="M60 60h41" stroke="#4dcbed" stroke-width="2"/>
    <circle cx="43" cy="60" r="3" fill="#4dcbed"/>
  `);
}
