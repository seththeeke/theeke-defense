import {
  ASSET_PATHS,
  getHeroAssetKey,
  getTowerAssetKey,
  getTrackEnemyAssetEntries,
} from './assets.js';

/**
 * Build the list of image assets to attempt loading for a game session.
 */
export function buildAssetManifest(config, selection) {
  const seen = new Set();
  const entries = [];

  const add = (key, path) => {
    if (!key || !path || seen.has(key)) return;
    seen.add(key);
    entries.push({ key, path });
  };

  for (const heroId of Object.keys(config.heroes || {})) {
    add(getHeroAssetKey(heroId), ASSET_PATHS[getHeroAssetKey(heroId)]);
  }

  for (const towerId of Object.keys(config.towers || {})) {
    add(getTowerAssetKey(towerId), ASSET_PATHS[getTowerAssetKey(towerId)]);
  }

  if (selection?.track) {
    for (const entry of getTrackEnemyAssetEntries(config, selection.track)) {
      add(entry.key, entry.path);
    }
  }

  add('projectile', ASSET_PATHS.projectile);

  return entries;
}

/**
 * Returns assets that have a resolved path (bundled images are always available).
 */
export async function resolveAvailableAssets(config, selection) {
  return buildAssetManifest(config, selection).filter((entry) => entry.path);
}

export function hasTexture(scene, key) {
  return Boolean(key && scene?.textures?.exists(key));
}
