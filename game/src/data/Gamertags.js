const PREFIXES = Object.freeze([
  'Aero','Apex','Arc','Astro','Blaze','Blitz','Bolt','Cipher','Clutch','Cobra','Comet','Crux',
  'Drift','Echo','Ember','Fang','Flux','Frost','Ghost','Glitch','Havoc','Hex','Hyper','Ion',
  'Jinx','Kilo','Lunar','Mako','Neon','Nova','Nyx','Onyx','Orbit','Phantom','Pulse','Quake',
  'Razor','Rift','Rogue','Rush','Saber','Shade','Shock','Slate','Solar','Static','Storm','Vex'
]);

const SUFFIXES = Object.freeze([
  'Ace','Byte','Dash','Edge','Fang','Hawk','Jett','King','Knight','Lock','Lynx','Mode','Nox','Peak','Ray','Reign',
  'Rush','Shift','Shot','Snipe','Spark','Spike','Strafe','Surge','Swift','Talon','Trace','Vibe','Volt','Wolf','X','Zen'
]);

export const GAMERTAG_VARIANT_COUNT = PREFIXES.length * SUFFIXES.length;

function hash32(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function tagAt(index) {
  const normalized = ((index % GAMERTAG_VARIANT_COUNT) + GAMERTAG_VARIANT_COUNT) % GAMERTAG_VARIANT_COUNT;
  const prefix = PREFIXES[Math.floor(normalized / SUFFIXES.length)];
  const suffix = SUFFIXES[normalized % SUFFIXES.length];
  return `${prefix}${suffix}`;
}

export function assignBotGamertags(players = [], seed = `${Date.now()}-${Math.random()}`) {
  const bots = players.filter((player) => player && !player.isLocal);
  const used = new Set();
  let cursor = hash32(seed) % GAMERTAG_VARIANT_COUNT;
  const stride = 37;

  for (const bot of bots) {
    let attempts = 0;
    let tag = tagAt(cursor);
    while (used.has(tag) && attempts < GAMERTAG_VARIANT_COUNT) {
      cursor = (cursor + stride) % GAMERTAG_VARIANT_COUNT;
      tag = tagAt(cursor);
      attempts += 1;
    }
    bot.displayName = tag;
    used.add(tag);
    cursor = (cursor + stride + (hash32(bot.id) % 29)) % GAMERTAG_VARIANT_COUNT;
  }

  const local = players.find((player) => player?.isLocal);
  if (local) local.displayName = 'YOU';
  return players;
}
