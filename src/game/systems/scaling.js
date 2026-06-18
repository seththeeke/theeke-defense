/**
 * Global round scaling — applied identically to every enemy type.
 * effectiveStat = baseStat * (1 + roundNumber * scalingFactor)
 */
export function getRoundMultiplier(roundNumber, scalingFactor) {
  return 1 + roundNumber * scalingFactor;
}

export function scaleStat(baseStat, roundNumber, scalingFactor) {
  return baseStat * getRoundMultiplier(roundNumber, scalingFactor);
}
