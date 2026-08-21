import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const gameBuilder = read('game/electron-builder.yml');
const launcherBuilder = read('launcher/electron-builder.yml');
const launcherMain = read('launcher/src/main.js');
const workflow = read('.github/workflows/publish-windows.yml');
const finalize = read('scripts/finalize-release.mjs');

assert.ok(gameBuilder.includes('artifactName: SkirmishArena.exe'));
assert.ok(launcherBuilder.includes('from: ../dist-game/SkirmishArena.exe'));
assert.ok(launcherBuilder.includes('artifactName: SkirmishArena-Setup.exe'));
assert.ok(launcherMain.includes("const GAME_EXE = 'SkirmishArena.exe'"));
for (const token of [
  'dist-game/SkirmishArena.exe',
  'dist-launcher/SkirmishArena-Setup.exe',
  'SkirmishArena-$($plan.gameVersion)-v$($plan.build).exe',
  'SkirmishArena-Setup-$($plan.gameVersion)-v$($plan.build).exe'
]) assert.ok(workflow.includes(token), `Release workflow mismatch: ${token}`);
assert.ok(finalize.includes('`SkirmishArena-${plan.gameVersion}-v${plan.build}.exe`'));
assert.ok(finalize.includes('`SkirmishArena-Setup-${plan.gameVersion}-v${plan.build}.exe`'));
assert.ok(launcherMain.includes("const LEGACY_GAME_EXE = 'UnblockedTDM.exe'"), 'Old 1.x archived builds must remain launchable after the rename.');
assert.equal(workflow.includes('dist-game/UnblockedTDM.exe'), false, '2.0 workflow must not stage the legacy game filename.');
console.log('Skirmish Arena 2.0 release pipeline contract passed: game, launcher, workflow and manifests agree on artifact names with 1.x archive compatibility.');
