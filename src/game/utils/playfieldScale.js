export const BASE_GRID_CELL_SIZE = 48;
export const BASE_GRID_OFFSET = 12;
export const BASE_TRACK_WIDTH = 24;

export function getPlayfieldScale(config) {
  return config.gameConstants?.playfieldScale ?? 1;
}

export function getScaledCellSize(config) {
  const base = config.gameConstants?.gridCellSize ?? BASE_GRID_CELL_SIZE;
  return base * getPlayfieldScale(config);
}

export function getScaledGridOffset(config) {
  return BASE_GRID_OFFSET * getPlayfieldScale(config);
}

export function getScaledTrackWidth(config) {
  return BASE_TRACK_WIDTH * getPlayfieldScale(config);
}

export function scaleUnitPadding(config) {
  return 6 * getPlayfieldScale(config);
}

export function scaleTrack(track, scale = 1) {
  if (!track || scale === 1) return track;
  const scalePath = (path) => path?.map((p) => ({ x: p.x * scale, y: p.y * scale }));
  return {
    ...track,
    path: scalePath(track.path),
    path2: scalePath(track.path2),
  };
}

export function getPlayfieldSize(track, config) {
  const scale = getPlayfieldScale(config);
  const offset = getScaledGridOffset(config);
  const trackWidth = getScaledTrackWidth(config);
  const scaled = scaleTrack(track, scale);

  let maxX = 0;
  let maxY = 0;

  for (const path of [scaled.path, scaled.path2].filter(Boolean)) {
    for (const p of path) {
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
  }

  const padding = offset * 2 + trackWidth;
  const designHeight = track.playfieldHeight;
  const heightFromPath = maxY + padding;
  const heightFromDesign =
    designHeight != null ? Math.ceil(designHeight * scale + padding) : heightFromPath;

  return {
    width: Math.ceil(maxX + padding),
    height: Math.max(heightFromPath, heightFromDesign),
  };
}

export function scaleStat(value, config) {
  return value * getPlayfieldScale(config);
}
