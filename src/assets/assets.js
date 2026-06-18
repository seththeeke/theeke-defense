/**
 * Central asset registry.
 *
 * Image files live in src/assets/ (bundled by Vite).
 * Filename → entity mapping is defined below.
 */

const bundledImages = import.meta.glob('./*.png', { eager: true, import: 'default' });

function resolveImage(filename) {
  if (!filename) return null;
  return bundledImages[`./${filename}`] ?? null;
}

/** Hero id → image filename */
const HERO_FILES = {
  seth: 'seth.png',
  lexie: 'lexie.png',
  noli: 'noli.png',
  mikey: 'mikey.png',
};

/** Hero id → selected-state image for setup screen only */
const HERO_SELECTED_FILES = {
  seth: 'seth-selected.png',
  lexie: 'lexie-selected.png',
  noli: 'noli-selected.png',
  mikey: 'mikey-selected.png',
};

/** Tower id → image filename */
const TOWER_FILES = {
  will: 'will.png',
  danielle: 'danielle.png',
  trevor: 'trevor.png',
  alex: 'alex.png',
  julie: 'julie.png',
  liam: 'liam.png',
  haillee: 'hailee.png',
};

/**
 * Track id → profile type → image filename
 *
 * Amazon Office:  Meeting, Boss Ping, Slack Ping, WBR Bridge, Project Blocker, VP Escalation, PIP
 * Broadway:       Vomit, Bridesmaid, Jello Shot, Homeless, One more Drink, Ms Kellies, Hangover
 * Theeke House:   Dog Poop, Fence, Yappy Dog, Laundry (Surprise Chore), Angry Dad, Single Parenting, In-Laws
 */
const TRACK_ENEMY_FILES = {
  'amazon-office': {
    basic: 'meeting.png',
    'slow-powerhouse': 'boss-ping.png',
    'speedy-weakling': 'slack-ping.png',
    healing: 'wbr-bridge.png',
    'strong-speed': 'project-blocker.png',
    'ability-immune': 'vp-escalation.png',
    boss: 'pip-boss.png',
  },
  broadway: {
    basic: 'vomit.png',
    'slow-powerhouse': 'bridemaid.png',
    'speedy-weakling': 'jello-shot.png',
    healing: 'homeless.png',
    'strong-speed': 'one-more-drink.png',
    'ability-immune': 'ms-kellies.png',
    boss: 'hangover-boss.png',
  },
  'theeke-house': {
    basic: 'dog-poop.png',
    'slow-powerhouse': 'fence.png',
    'speedy-weakling': 'yappy-dog.png',
    healing: 'laundry.png',
    'strong-speed': 'angry-dad.png',
    'ability-immune': 'single-parenting.png',
    boss: 'in-laws-boss.png',
  },
};

function buildHeroPaths() {
  const paths = {};
  for (const [id, file] of Object.entries(HERO_FILES)) {
    paths[`hero_${id}`] = resolveImage(file);
  }
  return paths;
}

function buildTowerPaths() {
  const paths = {};
  for (const [id, file] of Object.entries(TOWER_FILES)) {
    paths[`tower_${id}`] = resolveImage(file);
  }
  return paths;
}

export const ASSET_PATHS = {
  ...buildHeroPaths(),
  ...buildTowerPaths(),
  projectile: resolveImage(null),
};

export const ASSET_KEYS = Object.fromEntries(
  Object.keys({ ...HERO_FILES, ...TOWER_FILES, projectile: true }).map((id) => {
    if (id === 'projectile') return ['projectile', 'projectile'];
    const prefix = HERO_FILES[id] ? 'hero' : 'tower';
    return [`${prefix}_${id}`, `${prefix}_${id}`];
  })
);

export function getEnemyAssetKey(trackId, profileType) {
  return `enemy_${trackId}_${profileType}`;
}

export function getEnemyAssetPath(trackId, profileType) {
  const file = TRACK_ENEMY_FILES[trackId]?.[profileType];
  return resolveImage(file);
}

export function getTowerAssetKey(towerId) {
  return `tower_${towerId}`;
}

export function getHeroAssetKey(heroId) {
  return `hero_${heroId}`;
}

export function getTowerAssetPath(towerId) {
  return ASSET_PATHS[getTowerAssetKey(towerId)] ?? null;
}

export function getHeroAssetPath(heroId) {
  return ASSET_PATHS[getHeroAssetKey(heroId)] ?? null;
}

export function getHeroSelectedAssetPath(heroId) {
  const file = HERO_SELECTED_FILES[heroId];
  return file ? resolveImage(file) : null;
}

/** Setup-screen hero portrait — uses selected artwork when `selected` is true. */
export function getHeroSetupPortraitHtml({ heroId, color, className, selected = false }) {
  const src = selected
    ? getHeroSelectedAssetPath(heroId) ?? getHeroAssetPath(heroId)
    : getHeroAssetPath(heroId);
  if (src) {
    return `<img class="${className}" src="${src}" alt="" loading="lazy" />`;
  }
  return `<div class="${className} ${className}--fallback" style="background:${color || '#666'}"></div>`;
}

/** HTML for a hero/tower portrait in HTML UI (img or color fallback). */
export function getUnitPortraitHtml({ heroId, towerId, color, className }) {
  const src = heroId ? getHeroAssetPath(heroId) : towerId ? getTowerAssetPath(towerId) : null;
  if (src) {
    return `<img class="${className}" src="${src}" alt="" loading="lazy" />`;
  }
  return `<div class="${className} ${className}--fallback" style="background:${color || '#666'}"></div>`;
}

/** HTML for an enemy portrait in the threats roster. */
export function getEnemyPortraitHtml({ trackId, profileType, color, className }) {
  const src = getEnemyAssetPath(trackId, profileType);
  if (src) {
    return `<img class="${className}" src="${src}" alt="" loading="lazy" />`;
  }
  return `<div class="${className} ${className}--fallback" style="background:${color || '#666'}"></div>`;
}

/** Paths for all enemy skins on a track — used during preload. */
export function getTrackEnemyAssetEntries(config, trackId) {
  const skins = config.trackEnemies?.[trackId];
  if (!skins) return [];
  return Object.keys(skins)
    .map((profileType) => ({
      key: getEnemyAssetKey(trackId, profileType),
      path: getEnemyAssetPath(trackId, profileType),
    }))
    .filter((entry) => entry.path);
}

/** @returns {string[]} filenames bundled in src/assets/ */
export function getBundledImageFilenames() {
  return Object.keys(bundledImages).map((key) => key.replace('./', ''));
}
