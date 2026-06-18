import { getTrackPaths } from './pathFollower.js';

/** Must match the track line width drawn in GameScene (base width at playfieldScale 1). */
export const TRACK_WIDTH = 24;
const TRACK_CLEARANCE = 2;

function distPointToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    return Math.hypot(px - x1, py - y1);
  }

  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}

function cellOverlapsTrack(col, row, cellSize, gridOffsetX, gridOffsetY, paths, trackWidth) {
  const x = gridOffsetX + col * cellSize;
  const y = gridOffsetY + row * cellSize;
  const threshold = trackWidth / 2 + TRACK_CLEARANCE;

  const samplePoints = [
    [x + cellSize / 2, y + cellSize / 2],
    [x + 2, y + 2],
    [x + cellSize - 2, y + 2],
    [x + 2, y + cellSize - 2],
    [x + cellSize - 2, y + cellSize - 2],
  ];

  for (const { waypoints } of paths) {
    for (let i = 0; i < waypoints.length - 1; i++) {
      const a = waypoints[i];
      const b = waypoints[i + 1];
      for (const [px, py] of samplePoints) {
        if (distPointToSegment(px, py, a.x, a.y, b.x, b.y) <= threshold) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Builds the set of grid cells where towers/units can be placed:
 * anywhere in the playfield grid that does not overlap the track.
 */
export function computeBuildableGrid(
  track, cellSize, gridOffsetX, gridOffsetY, playfieldWidth, playfieldHeight, trackWidth = TRACK_WIDTH
) {
  const paths = getTrackPaths(track).map((p) => ({
    ...p,
    waypoints: p.waypoints.map((w) => ({
      x: w.x + gridOffsetX,
      y: w.y + gridOffsetY,
    })),
  }));

  const cols = Math.max(1, Math.floor((playfieldWidth - gridOffsetX) / cellSize));
  const rows = Math.max(1, Math.floor((playfieldHeight - gridOffsetY) / cellSize));
  const buildable = new Set();

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (!cellOverlapsTrack(col, row, cellSize, gridOffsetX, gridOffsetY, paths, trackWidth)) {
        buildable.add(`${col},${row}`);
      }
    }
  }

  return { buildable, cols, rows };
}

export function getBuildableCells(buildable) {
  return [...buildable].map((key) => {
    const [col, row] = key.split(',').map(Number);
    return { col, row };
  });
}
