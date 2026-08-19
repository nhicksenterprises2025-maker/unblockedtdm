import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const plan = JSON.parse(fs.readFileSync(path.join(root, 'release-plan.json'), 'utf8'));
const info = {
  product: plan.product,
  gameVersion: plan.gameVersion,
  build: plan.build,
  sequence: plan.sequence,
  phase: plan.phase,
  tag: plan.tag,
  title: plan.title,
  repository: 'nhicksenterprises2025-maker/unblockedtdm'
};

for (const target of ['game/src/build-info.json', 'launcher/src/build-info.json']) {
  fs.writeFileSync(path.join(root, target), `${JSON.stringify(info, null, 2)}\n`);
}

console.log(`Synced ${plan.title}`);
