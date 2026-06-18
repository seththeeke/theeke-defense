/**
 * Merges a shared enemy profile with track-specific name/color into a runtime enemy def.
 */
export function resolveEnemyDef(config, trackId, profileType) {
  const profile = config.enemyProfiles?.[profileType];
  const skin = config.trackEnemies?.[trackId]?.[profileType];
  if (!profile || !skin) return null;

  return {
    ...profile,
    profileType,
    trackId,
    name: skin.name,
    color: skin.color,
  };
}

export function getWavesForTrack(config, trackId) {
  if (config.waves?.[trackId]) {
    return config.waves[trackId];
  }
  if (Array.isArray(config.waves)) {
    return config.waves;
  }
  return [];
}

export function getProfileTypes(config) {
  return Object.keys(config.enemyProfiles || {});
}

export function getEnemyDisplayName(config, trackId, profileType) {
  return config.trackEnemies?.[trackId]?.[profileType]?.name || profileType;
}

/** Unique enemy profile types for a track, in order of first wave appearance. */
export function getUniqueProfileTypesForTrack(config, trackId) {
  const waves = getWavesForTrack(config, trackId);
  const order = [];

  for (const wave of waves) {
    for (const entry of wave.entries || []) {
      const { profileType } = entry;
      if (order.includes(profileType)) continue;
      if (resolveEnemyDef(config, trackId, profileType)) {
        order.push(profileType);
      }
    }
  }

  return order;
}
