import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const gameMain = read('game/src/main.js');
const gameBranding = read('game/src/phase1-branding.js');
const gameBrandingCss = read('game/src/phase1-branding.css');
const debugTuning = read('game/src/debug-tuning.js');
const gameBuilder = read('game/electron-builder.yml');
const launcherMain = read('launcher/src/main.js');
const launcherHtml = read('launcher/src/index.html');
const launcherBuilder = read('launcher/electron-builder.yml');
const gameMark = read('game/src/assets/skirmish-arena-mark.svg');
const gameWordmark = read('game/src/assets/skirmish-arena-wordmark.svg');

for (const token of ['Skirmish Arena', 'phase1-skirmish-branding', 'skirmish-arena-wordmark.svg']) {
  assert.ok(`${gameMain}\n${gameBranding}\n${gameBrandingCss}`.includes(token), `Missing game Phase 1 branding token: ${token}`);
}
assert.ok(debugTuning.includes("import('./phase1-branding.js')"), 'Phase 1 branding must load through the normal game startup chain.');
assert.ok(gameBuilder.includes('productName: Skirmish Arena'), 'Game package must use the Skirmish Arena product name.');
assert.ok(gameBuilder.includes('artifactName: SkirmishArena.exe'), 'Game package must emit SkirmishArena.exe.');
assert.ok(launcherBuilder.includes('productName: Skirmish Arena Launcher'), 'Launcher package must use the Skirmish Arena product name.');
assert.ok(launcherBuilder.includes('artifactName: SkirmishArena-Setup.exe'), 'Launcher package must emit the Skirmish Arena installer name.');
assert.ok(launcherHtml.includes('assets/skirmish-arena-mark.svg'), 'Launcher must use the SA mark.');
assert.ok(launcherHtml.includes('assets/skirmish-arena-wordmark.svg'), 'Launcher must use the Skirmish Arena wordmark.');
assert.ok(launcherMain.includes("'UnblockedTDM Launcher'"), 'Launcher must preserve the legacy userData location for migration compatibility.');
assert.ok(gameMain.includes("'UnblockedTDM'"), 'Game must preserve the legacy userData location for settings/loadout migration compatibility.');
assert.ok(launcherMain.includes('LEGACY_GAME_EXE'), 'Launcher must retain compatibility with archived 1.x executables.');
assert.ok(gameMark.includes('aria-label="Skirmish Arena SA mark"'), 'SA mark asset is missing or invalid.');
assert.ok(gameWordmark.includes('SKIRMISH') && gameWordmark.includes('ARENA'), 'Wordmark asset must contain the Skirmish Arena identity.');
assert.equal(/[\u3040-\u30ff\u3400-\u9fff]/.test(`${gameMark}\n${gameWordmark}\n${launcherHtml}`), false, 'Japanese/CJK lettering is not allowed in the selected Phase 1 identity.');

console.log('Phase 1 rebrand checks passed: Skirmish Arena identity, packaging names, source-native startup, and 1.9.2 migration compatibility are present.');
