const WAVE_TEMPLATE = [
  { round: 1, entries: [{ profileType: 'basic', count: 5 }] },
  { round: 2, entries: [{ profileType: 'basic', count: 8 }] },
  {
    round: 3,
    entries: [
      { profileType: 'basic', count: 4 },
      { profileType: 'slow-powerhouse', count: 2 },
    ],
  },
  {
    round: 4,
    entries: [
      { profileType: 'slow-powerhouse', count: 4 },
      { profileType: 'basic', count: 3 },
    ],
  },
  {
    round: 5,
    entries: [
      { profileType: 'basic', count: 3 },
      { profileType: 'speedy-weakling', count: 5 },
    ],
  },
  {
    round: 6,
    entries: [
      { profileType: 'healing', count: 4 },
      { profileType: 'basic', count: 2 },
    ],
  },
  {
    round: 7,
    entries: [
      { profileType: 'strong-speed', count: 5 },
      { profileType: 'speedy-weakling', count: 3 },
    ],
  },
  {
    round: 8,
    entries: [
      { profileType: 'ability-immune', count: 3 },
      { profileType: 'healing', count: 2 },
      { profileType: 'strong-speed', count: 2 },
    ],
  },
  {
    round: 9,
    entries: [
      { profileType: 'basic', count: 2 },
      { profileType: 'slow-powerhouse', count: 2 },
      { profileType: 'speedy-weakling', count: 3 },
      { profileType: 'healing', count: 2 },
      { profileType: 'strong-speed', count: 2 },
      { profileType: 'ability-immune', count: 2 },
    ],
  },
  {
    round: 10,
    entries: [
      { profileType: 'boss', count: 1 },
      { profileType: 'ability-immune', count: 2 },
      { profileType: 'strong-speed', count: 3 },
      { profileType: 'healing', count: 2 },
      { profileType: 'slow-powerhouse', count: 2 },
    ],
  },
];

export function generateDefaultWaves(trackIds = ['amazon-office', 'broadway', 'theeke-house']) {
  const waves = {};
  for (const trackId of trackIds) {
    waves[trackId] = WAVE_TEMPLATE.map((w) => ({
      round: w.round,
      entries: w.entries.map((e) => ({ ...e })),
    }));
  }
  return waves;
}
