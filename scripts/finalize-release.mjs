import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const plan = JSON.parse(fs.readFileSync(path.join(root, 'release-plan.json'), 'utf8'));
const ownerRepo = 'nhicksenterprises2025-maker/unblockedtdm';
const gameAssetName = `UnblockedTDM-${plan.gameVersion}-v${plan.build}.exe`;
const installerAssetName = `UnblockedTDM-Setup-${plan.gameVersion}-v${plan.build}.exe`;
const gamePath = path.join(root, 'dist-release', gameAssetName);
const installerPath = path.join(root, 'dist-release', installerAssetName);

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

const now = new Date().toISOString();
const entry = {
  product: plan.product,
  gameVersion: plan.gameVersion,
  build: plan.build,
  sequence: plan.sequence,
  phase: plan.phase,
  tag: plan.tag,
  title: plan.title,
  gameUrl: `https://github.com/${ownerRepo}/releases/download/${plan.tag}/${gameAssetName}`,
  installerUrl: `https://github.com/${ownerRepo}/releases/download/${plan.tag}/${installerAssetName}`,
  sha256: sha256(gamePath),
  installerSha256: sha256(installerPath),
  publishedAt: now
};

fs.writeFileSync(path.join(root, 'distribution', 'latest.json'), `${JSON.stringify(entry, null, 2)}\n`);

const versionsPath = path.join(root, 'distribution', 'versions.json');
const archive = JSON.parse(fs.readFileSync(versionsPath, 'utf8'));
archive.product = plan.product;
archive.versions = Array.isArray(archive.versions) ? archive.versions : [];
const withoutCurrent = archive.versions.filter((item) => item.tag !== entry.tag);
archive.versions = [entry, ...withoutCurrent].sort((a, b) => Number(b.sequence || b.build) - Number(a.sequence || a.build));
fs.writeFileSync(versionsPath, `${JSON.stringify(archive, null, 2)}\n`);
fs.writeFileSync(path.join(root, 'dist-release', 'release-manifest.json'), `${JSON.stringify(entry, null, 2)}\n`);

console.log(JSON.stringify(entry));
