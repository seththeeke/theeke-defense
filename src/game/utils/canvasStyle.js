export const CANVAS = {
  bg: 0x0a0c10,
  track: 0x3d4555,
  trackGlow: 0x525c6e,
  buildable: 0x141a16,
  buildableBorder: 0x1e2a22,
  /** RGB(22, 25, 33) — occupied tower/hero cells */
  placedCell: 0x161921,
  placedCellBorder: 0x2a2e3a,
  previewValid: 0x22c55e,
  previewInvalid: 0xef4444,
  rangeValid: 0x6366f1,
  rangeSelected: 0x818cf8,
  unitFill: 0x1c2230,
  unitStroke: 0x6366f1,
  heroStroke: 0xf59e0b,
  enemyStroke: 0xffffff,
};

/** Phaser display depth — higher values render on top. */
export const DEPTH = {
  track: 1,
  trackFlow: 2,
  buildable: 3,
  unitPads: 9,
  units: 10,
  unitLabels: 11,
  healthBars: 12,
  projectiles: 10,
  rangeSelected: 48,
  range: 49,
  preview: 50,
};

export function hexToPhaser(hex) {
  return parseInt(hex.replace('#', ''), 16);
}

export function getInitial(name) {
  return (name || '?')[0].toUpperCase();
}
