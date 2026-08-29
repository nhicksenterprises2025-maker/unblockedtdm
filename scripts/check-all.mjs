import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const syntaxRoots = ['launcher/src', 'game/src', 'scripts'];
const testFiles = [
  'scripts/test-phase-1-1.9.3.mjs',
  'scripts/test-phase-2-1.94.1.mjs',
  'scripts/test-phase-3-tactical-hud.mjs',
  'scripts/test-phase-4-interaction.mjs',
  'scripts/test-phase-5-vfx-fullscreen.mjs',
  'scripts/test-phase-6-menu-polish.mjs',
  'scripts/test-phase-7-map-visuals.mjs',
  'scripts/test-phase-8-professional-ui-launcher.mjs',
  'scripts/test-phase-9-rc.mjs',
  'scripts/test-2.0-progression.mjs',
  'scripts/test-2.1.1-career.mjs',
  'scripts/test-2.2.1-ui-controls-shotgun.mjs',
  'scripts/test-2.3.1-ui-catalog.mjs',
  'scripts/test-2.3.1-boot-integrity.mjs',
  'scripts/test-2.4.1-combat-polish.mjs',
  'scripts/test-2.4.1.2-scoreboard-teams.mjs',
  'scripts/test-2.4.2.1-hud-occlusion.mjs',
  'scripts/test-2.4.3.1-arena-phase1.mjs',
  'scripts/test-2.4.3.2-arena-phase2.mjs',
  'scripts/test-2.4.3.3-arena-core.mjs',
  'scripts/test-2.4.3.3-foundry-visuals.mjs',
  'scripts/test-2.4.3.3-render-polish.mjs',
  'scripts/test-2.4.3.3-arena-phase3.mjs',
  'scripts/test-2.5.0-presentation-map-overhaul.mjs',
  'scripts/test-2.01.1-weapon-model-ui.mjs',
  'scripts/test-2.01.2-crosshair-layout.mjs',
  'scripts/test-2.01.3-loadout-onepage.mjs',
  'scripts/test-2.01.4-weapon-info-scroll.mjs',
  'scripts/test-build-1.41.mjs',
  'scripts/test-build-1.5.mjs',
  'scripts/test-build-1.6.mjs',
  'scripts/test-build-1.7.mjs',
  'scripts/test-build-1.8.mjs',
  'scripts/test-build-1.9.mjs',
  'scripts/test-build-1.9.2.mjs'
];

function walk(relativeDir) {
  const absolute = path.join(root, relativeDir);
  const files = [];
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    const relative = path.join(relativeDir, entry.name).replaceAll('\\', '/');
    if (entry.isDirectory()) files.push(...walk(relative));
    else if (/\.(?:js|mjs)$/.test(entry.name)) files.push(relative);
  }
  return files;
}

function runNode(args, label) {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`${label} failed with exit code ${result.status}`);
}

const syntaxFiles = [...new Set(syntaxRoots.flatMap(walk))].sort();
for (const file of syntaxFiles) runNode(['--check', file], `Syntax check: ${file}`);
for (const file of testFiles) runNode([file], `Regression test: ${file}`);

console.log(`Validation passed: ${syntaxFiles.length} syntax checks + ${testFiles.length} regression tests.`);
