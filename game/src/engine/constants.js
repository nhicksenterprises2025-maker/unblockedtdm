export const TILE_SIZE = 64;
export const MAP_COLS = 32;
export const MAP_ROWS = 22;
export const WORLD_WIDTH = MAP_COLS * TILE_SIZE;
export const WORLD_HEIGHT = MAP_ROWS * TILE_SIZE;

export const CAMERA_LERP = 10;
export const DEFAULT_ZOOM = 1.18;
export const AIM_CAMERA_LEAD_TILES = 0.9;

export const PLAYER_SPEED_TILES = 5;
export const PLAYER_RADIUS_TILES = 0.34;

export const SPRINT_SPEED_MULTIPLIER = 1.35;
export const SPRINT_STAMINA_MAX = 100;
export const SPRINT_FULL_DURATION = 5;
export const SPRINT_DRAIN_PER_SECOND = SPRINT_STAMINA_MAX / SPRINT_FULL_DURATION;
export const SPRINT_REGEN_DELAY = 2.8;
export const SPRINT_REGEN_FULL_TIME = 3.2;
export const SPRINT_REGEN_PER_SECOND = SPRINT_STAMINA_MAX / SPRINT_REGEN_FULL_TIME;

export const DASH_CHARGES_MAX = 4;
export const DASH_DISTANCE_TILES = 3;
export const DASH_STAMINA_COST = 0;
export const DASH_COOLDOWN = 0.3;
export const DASH_INVULNERABILITY = 0.5;
export const DASH_DURATION = 0.18;
export const DASH_SPEED_TILES = DASH_DISTANCE_TILES / DASH_DURATION;
export const DASH_SWEEP_STEP_PIXELS = 6;

export const PLAYER_MAX_HEALTH = 150;
export const HEALTH_REGEN_DELAY = 7;
export const HEALTH_REGEN_CAP = 75;
export const HEALTH_REGEN_PER_SECOND = 15;
export const HEALTH_BAR_HOLD_TIME = 2.5;
export const HEALTH_BAR_FADE_TIME = 0.5;
export const HIT_FLASH_DURATION = 0.12;
export const DAMAGE_VIGNETTE_DURATION = 0.45;
export const DAMAGE_INDICATOR_DURATION = 0.75;
export const RESPAWN_DELAY = 3;
export const SPAWN_PROTECTION_DURATION = 1;
export const DAMAGE_HISTORY_TTL = 10;
export const DEATH_PARTICLE_COUNT = 24;

export const MAX_DT = 1 / 15;
