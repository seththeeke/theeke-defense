import { hasTexture } from '../../assets/assetLoader.js';

/**
 * Create a game object sprite, using a loaded texture when available or a shape fallback.
 */
export function createUnitSprite(scene, options) {
  const {
    x,
    y,
    width,
    height,
    textureKey,
    fallbackColor,
    fallbackStroke,
    fallbackStrokeWidth = 2,
    fallbackAlpha = 1,
    circleRadius,
  } = options;

  if (textureKey && hasTexture(scene, textureKey)) {
    const sprite = scene.add.image(x, y, textureKey);
    sprite.setDisplaySize(width, height);
    return { sprite, isImage: true };
  }

  if (circleRadius != null) {
    const sprite = scene.add.circle(x, y, circleRadius, fallbackColor, fallbackAlpha);
    if (fallbackStroke != null) {
      sprite.setStrokeStyle(fallbackStrokeWidth, fallbackStroke, 0.5);
    }
    return { sprite, isImage: false };
  }

  const sprite = scene.add.rectangle(x, y, width, height, fallbackColor, fallbackAlpha);
  if (fallbackStroke != null) {
    sprite.setStrokeStyle(fallbackStrokeWidth, fallbackStroke);
  }
  return { sprite, isImage: false };
}

export function setUnitDisplaySize(sprite, isImage, width, height, circleRadius) {
  if (isImage) {
    sprite.setDisplaySize(width, height);
    return;
  }
  if (circleRadius != null && sprite.setRadius) {
    sprite.setRadius(circleRadius);
    return;
  }
  sprite.setSize(width, height);
}

export function setUnitPosition(sprite, x, y) {
  sprite.setPosition(x, y);
}
