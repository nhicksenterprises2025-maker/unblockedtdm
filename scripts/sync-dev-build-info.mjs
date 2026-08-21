import fs from 'node:fs';

const planUrl = new URL('../dev-build-plan.json', import.meta.url);
const gameInfoUrl = new URL('../game/src/build-info.json', import.meta.url);
const launcherInfoUrl = new URL('../dev-launcher/src/build-info.json', import.meta.url);

const plan = JSON.parse(fs.readFileSync(planUrl, 'utf8'));
const shared = {
  product: 'Skirmish Arena 2.0 Development',
  testVersion: plan.testVersion || '2.0-dev',
  phase: Number(plan.phase || 0),
  sequence: Number(plan.sequence || 0),
  channel: 'internal-dev',
  branch: 'dev/skirmish-arena-2.0',
  title: plan.title || `Skirmish Arena 2.0 Development Sequence ${plan.sequence}`
};

fs.writeFileSync(gameInfoUrl, `${JSON.stringify({
  ...shared,
  gameVersion: shared.testVersion,
  build: shared.sequence,
  repository: 'nhicksenterprises2025-maker/unblockedtdm'
}, null, 2)}\n`);

fs.writeFileSync(launcherInfoUrl, `${JSON.stringify(shared, null, 2)}\n`);
console.log(`Synced Skirmish Arena 2.0 dev build metadata: phase ${shared.phase}, sequence ${shared.sequence}`);
