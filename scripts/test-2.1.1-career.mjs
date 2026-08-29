import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
  CAREER_RANKS,
  CAREER_XP_REWARDS,
  MILESTONE_TIERS,
  MILESTONE_TRACKS,
  ProgressionStore,
  TOTAL_CAREER_XP,
  TOTAL_MILESTONE_XP,
  careerLevelFromXp,
  rankForLevel,
  totalXpAtLevel,
  xpRequiredForLevel
} from '../game/src/progression/ProgressionStore.js';

class MemoryStorage {
  constructor(entries = []) { this.values = new Map(entries); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
}

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const runtime = read('game/src/phase211-runtime.js');
const bridge = read('game/src/phase10-runtime.js');
const css = read('game/src/ui-2.1.1.css');
const badges = read('game/src/assets/ranks/rank-badges.svg');
const badgeHelper = read('game/src/progression/RankBadges.js');
const menu = read('game/src/ui/MainMenu.js');
const index = read('game/src/index.html');
const weapons = read('game/src/data/weapons.js');
const constants = read('game/src/engine/constants.js');
const match = read('game/src/match/MatchManager.js');

assert.equal(TOTAL_CAREER_XP, 4_137_375);
assert.equal(TOTAL_MILESTONE_XP, 880_000);
assert.equal(CAREER_RANKS.length, 26);
assert.deepEqual(CAREER_XP_REWARDS, { kill:8, assist:4, roundWin:16, roundLoss:4, matchWin:100 });

const rankBoundaryExpectations = [
  [1,'RECRUIT I',25],[6,'RECRUIT II',50],[11,'RECRUIT III',75],[16,'FIGHTER I',125],[26,'FIGHTER II',175],[36,'FIGHTER III',225],
  [46,'SPECIALIST I',300],[61,'SPECIALIST II',375],[76,'SPECIALIST III',450],[91,'COLONEL I',550],[111,'COLONEL II',650],
  [131,'VETERAN I',800],[156,'VETERAN II',950],[181,'ELITE I',1150],[211,'ELITE II',1350],[241,'MASTER I',1600],
  [276,'MASTER II',1850],[311,'GRANDMASTER I',2150],[351,'GRANDMASTER II',2500],[401,'LEGEND',3000],[501,'TRANSCENDENT',4000],
  [601,'IMMORTAL',5000],[701,'DEMIGOD',6500],[801,'DIVINE',8000],[901,'CELESTIAL',10000],[1000,'OMNIPOTENT',0]
];
for (const [level,title,xp] of rankBoundaryExpectations) {
  assert.equal(rankForLevel(level).title, title);
  assert.equal(xpRequiredForLevel(level), xp);
}
assert.equal(totalXpAtLevel(1000), TOTAL_CAREER_XP);
assert.deepEqual(careerLevelFromXp(TOTAL_CAREER_XP), { level:1000, levelXp:0, levelXpRequired:0 });

assert.equal(MILESTONE_TRACKS.length, 5);
assert.deepEqual(MILESTONE_TRACKS.map((track) => track.id), ['kills','assists','roundWins','wins','matches']);
assert.equal(MILESTONE_TIERS.length, 10);
assert.equal(MILESTONE_TIERS[0].kills, 1000);
assert.equal(MILESTONE_TIERS[9].kills, 200000);
assert.equal(MILESTONE_TIERS.reduce((sum,tier) => sum + tier.reward, 0), 176000);

const legacy = JSON.stringify({ totalXp:999999, matches:7, wins:4, losses:3, kills:117, deaths:92, assists:40, damage:9000, criticals:13, bestStreak:7 });
const migratedStorage = new MemoryStorage([['unblockedtdm.progression.v1', legacy]]);
const migrated = new ProgressionStore(migratedStorage).snapshot();
assert.equal(migrated.totalXp, 0);
assert.equal(migrated.level, 1);
assert.equal(migrated.kills, 117);
assert.equal(migrated.matches, 7);
assert.equal(migrated.migratedFromPrototype, true);

const storage = new MemoryStorage();
const store = new ProgressionStore(storage);
const sample = store.recordMatch({
  won:true,duration:540,durationLabel:'9:00',
  local:{ team:'blue', kills:20, deaths:10, assists:6, damage:2500, criticals:1, bestStreak:6 },
  roundHistory:[{winner:'blue'},{winner:'red'},{winner:'blue'},{winner:'blue'},{winner:'red'},{winner:'blue'},{winner:'blue'}]
});
assert.deepEqual(sample.breakdown, { kills:160, assists:24, roundWins:80, roundLosses:8, victory:100 });
assert.equal(sample.matchXp, 372);
assert.equal(sample.milestoneXp, 0);
assert.equal(sample.after.level, 10);

const milestoneProfile = JSON.parse(storage.getItem('skirmisharena.career.v2'));
milestoneProfile.kills = 999;
milestoneProfile.totalXp = 0;
milestoneProfile.claimedMilestones.kills = 0;
storage.setItem('skirmisharena.career.v2', JSON.stringify(milestoneProfile));
const milestoneStore = new ProgressionStore(storage);
const award = milestoneStore.recordMatch({ won:false, duration:60, local:{ team:'blue', kills:5001, deaths:1, assists:0 }, roundHistory:[{winner:'red'}] });
assert.equal(award.milestoneAwards.filter((item) => item.trackId === 'kills').length, 3);
assert.equal(award.milestoneAwards.filter((item) => item.trackId === 'kills').reduce((sum,item) => sum + item.reward, 0), 1750);
assert.equal(new ProgressionStore(storage).snapshot().claimedMilestones.kills, 3);

for (const rank of CAREER_RANKS) assert.ok(badges.includes(`id="rank-${rank.id}"`), `Missing authored emblem symbol for ${rank.title}.`);
assert.equal((badges.match(/<symbol id="rank-/g) || []).length, 26);
for (const token of ['career-service-shield','career-angular-shield','career-command-star','career-round-medal','career-diamond-shield','career-prism','career-gold']) assert.ok(badges.includes(token));
for (const forbidden of ['singularity','obsidian','galaxy','deepGlow']) assert.equal(badges.includes(forbidden), false, `2.5 authored rank system must not restore overworked ${forbidden} effects.`);
assert.ok(badgeHelper.includes('assets/ranks/rank-badges.svg'));
assert.equal(badgeHelper.toLowerCase().includes('placeholder'), false);
for (const token of ["view.dataset.menuView = 'career'",'OVERVIEW','RANKS','MILESTONES','RANK PROMOTION','TOTAL CAREER XP GAINED','VIEW CAREER']) assert.ok(runtime.includes(token));
for (const token of ['career-overview-hero','career-rank-grid','career-milestone-row','career-rank-promotion']) assert.ok(css.includes(token));
assert.ok(menu.includes("'career'"));
assert.equal(index.includes('data-menu-nav="career"'), false);
assert.ok(bridge.includes("import('./phase211-runtime.js')"));
assert.equal(bridge.includes('recordMatch'), false);
for (const forbidden of ['dailyChallenges','weeklyChallenges','challengeReroll','rerollChallenge']) assert.equal(runtime.includes(forbidden), false);

for (const id of ['assault-rifle','smg','sniper','shotgun','lmg','pistol','launcher','melee']) assert.ok(weapons.includes(`id: '${id}'`), `Career compatibility lost weapon ${id}.`);
for (const field of ['damage:', 'critChance:', 'fireInterval:', 'magazineSize:']) assert.ok(weapons.includes(field), `Weapon schema missing ${field}`);
for (const token of ['PLAYER_SPEED_TILES = 5','SPRINT_SPEED_MULTIPLIER = 1.35','DASH_CHARGES_MAX = 4','DASH_DISTANCE_TILES = 3']) assert.ok(constants.includes(token));
for (const token of ['const ROUND_DURATION = 90;','const ROUND_KILL_TARGET = 12;','const ROUND_WINS_TO_MATCH = 5;']) assert.ok(match.includes(token));

console.log('Skirmish Arena 2.1.1 checks passed: 1000 levels, 26 authored ranks, XP/milestone economy, migration, Career UI, and balance-ready weapon schema.');
