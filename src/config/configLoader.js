import defaultConfigJson from './defaultConfig.json';
import { generateDefaultWaves } from './waveGenerator.js';

export const CONFIG_STORAGE_KEY = 'home-defense-config';

function ensureWaves(config) {
  if (!config.waves || Array.isArray(config.waves)) {
    const trackIds = Object.keys(config.tracks || {});
    config.waves = generateDefaultWaves(trackIds.length ? trackIds : undefined);
  }
}

function ensureEnemySchema(config) {
  const bundled = defaultConfigJson;
  if (!config.enemyProfiles || !config.trackEnemies) {
    config.enemyProfiles = structuredClone(bundled.enemyProfiles);
    config.trackEnemies = structuredClone(bundled.trackEnemies);
    ensureWaves(config);
  }
  if (config.gameConstants && !config.gameConstants.totalRounds) {
    config.gameConstants.totalRounds = bundled.gameConstants.totalRounds;
  }
  if (config.gameConstants && config.gameConstants.playfieldScale == null) {
    config.gameConstants.playfieldScale = bundled.gameConstants.playfieldScale ?? 1;
  }
}

function migrateTrackNames(config) {
  const broadway = config.tracks?.broadway;
  if (broadway?.name === 'Broadway (Nashville)') {
    broadway.name = 'Broadway';
  }
}

function migrateNoliAbilities(config) {
  const noli = config.heroes?.noli;
  if (!noli?.abilities) return;
  noli.abilities = noli.abilities.filter((a) => a.id !== 'relocate');
}

function migrateTheekeHouseTrack(config) {
  const track = config.tracks?.['theeke-house'];
  if (!track) return;
  const path = track.path;
  if (!path || path.length > 6) return;

  track.description = 'Winding path with extra turns across the house';
  track.path = [
    { x: 0, y: 340 },
    { x: 160, y: 340 },
    { x: 160, y: 110 },
    { x: 380, y: 110 },
    { x: 380, y: 390 },
    { x: 600, y: 390 },
    { x: 600, y: 90 },
    { x: 860, y: 90 },
    { x: 860, y: 340 },
    { x: 1100, y: 340 },
  ];
  track.endPoints = [{ pathIndex: 9 }];
}

function migrateBroadwayTrack(config) {
  const track = config.tracks?.broadway;
  if (!track?.path || track.path.length !== 2) return;
  const y = track.path[0]?.y;
  if (y === 200 && track.playfieldHeight === 400) return;

  track.description = 'Straight road through the center — tower space on both sides';
  track.playfieldHeight = 400;
  track.path = [
    { x: 0, y: 200 },
    { x: 800, y: 200 },
  ];
}

/**
 * Loads game config: localStorage override first, then bundled default.
 */
export function loadConfig() {
  const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
  let config;

  if (stored) {
    try {
      config = JSON.parse(stored);
    } catch {
      config = structuredClone(defaultConfigJson);
    }
  } else {
    config = structuredClone(defaultConfigJson);
  }

  ensureEnemySchema(config);
  ensureWaves(config);
  migrateTrackNames(config);
  migrateNoliAbilities(config);
  migrateTheekeHouseTrack(config);
  migrateBroadwayTrack(config);
  return config;
}

export function saveConfigToStorage(config) {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
}

export function clearConfigStorage() {
  localStorage.removeItem(CONFIG_STORAGE_KEY);
}

export function getBundledDefaultConfig() {
  const config = structuredClone(defaultConfigJson);
  ensureEnemySchema(config);
  ensureWaves(config);
  migrateTrackNames(config);
  migrateNoliAbilities(config);
  migrateTheekeHouseTrack(config);
  migrateBroadwayTrack(config);
  return config;
}
