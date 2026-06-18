import { PathFollower } from '../utils/pathFollower.js';
import { hexToPhaser, DEPTH } from '../utils/canvasStyle.js';
import { createUnitSprite } from '../utils/spriteFactory.js';
import { getEnemyAssetKey } from '../../assets/assets.js';

let enemyIdCounter = 0;

const BASE_ENEMY_SIZE = 40;
const BASE_BOSS_SIZE = 80;
const BASE_BAR_WIDTH = 24;
const BASE_BOSS_BAR_WIDTH = 48;

export class Enemy {
  constructor(
    scene, config, enemyDef, roundNumber, scalingFactor, pathWaypoints, pathId = 'path', playfieldScale = 1
  ) {
    this.scene = scene;
    this.config = config;
    this.def = enemyDef;
    this.playfieldScale = playfieldScale;
    this.id = ++enemyIdCounter;
    this.pathId = pathId;
    this.pathFollower = new PathFollower(pathWaypoints);

    const multiplier = 1 + roundNumber * scalingFactor;
    this.maxHealth = enemyDef.health * multiplier;
    this.health = this.maxHealth;
    this.speed = enemyDef.speed * multiplier * playfieldScale;
    this.speedModifiers = [];

    this.displaySize = (enemyDef.isBoss ? BASE_BOSS_SIZE : BASE_ENEMY_SIZE) * playfieldScale;
    const fill = hexToPhaser(enemyDef.color || '#ef4444');
    const textureKey = getEnemyAssetKey(enemyDef.trackId, enemyDef.profileType);
    const circleRadius = (enemyDef.isBoss ? BASE_BOSS_SIZE / 2 : BASE_ENEMY_SIZE / 2) * playfieldScale;

    const { sprite, isImage } = createUnitSprite(scene, {
      x: 0,
      y: 0,
      width: this.displaySize,
      height: this.displaySize,
      textureKey,
      fallbackColor: fill,
      fallbackStroke: enemyDef.isBoss ? 0xfbbf24 : 0xffffff,
      fallbackStrokeWidth: enemyDef.isBoss ? 4 : 2,
      circleRadius,
    });
    this.sprite = sprite;
    this.spriteIsImage = isImage;
    this.fallbackRadius = circleRadius;
    this.sprite.setDepth(DEPTH.units);

    const barW = (enemyDef.isBoss ? BASE_BOSS_BAR_WIDTH : BASE_BAR_WIDTH) * playfieldScale;
    const barH = Math.max(3, Math.round(3 * playfieldScale));
    this.barW = barW;
    this.healthBarBg = scene.add.rectangle(0, 0, barW, barH, 0x1c2230).setDepth(DEPTH.healthBars);
    this.healthBar = scene.add.rectangle(0, 0, barW, barH, 0x22c55e).setDepth(DEPTH.healthBars);
    this.healthBar.setOrigin(0, 0.5);
    this.healthBarBg.setOrigin(0, 0.5);

    this.alive = true;
    this.reachedEnd = false;
    this.updatePosition();
  }

  getEffectiveSpeed() {
    let speed = this.speed;
    for (const mod of this.speedModifiers) {
      speed *= 1 - mod.magnitude;
    }
    return Math.max(5 * this.playfieldScale, speed);
  }

  applySlow(magnitude, duration, fromTower = false) {
    if (fromTower && this.def.immuneToTowerAbilities) return;
    this.speedModifiers.push({ magnitude, duration, elapsed: 0 });
  }

  update(dt) {
    if (!this.alive) return;

    this.speedModifiers = this.speedModifiers.filter((mod) => {
      mod.elapsed += dt;
      return mod.elapsed < mod.duration;
    });

    if (this.def.healRate > 0 && this.health < this.maxHealth) {
      this.health = Math.min(this.maxHealth, this.health + this.def.healRate * dt);
    }

    const reached = this.pathFollower.advance(this.getEffectiveSpeed() * dt);
    this.updatePosition();
    if (reached) {
      this.reachedEnd = true;
      this.alive = false;
    }
  }

  updatePosition() {
    const pos = this.pathFollower.getPosition();
    const halfSize = this.spriteIsImage
      ? this.sprite.displayHeight / 2
      : this.fallbackRadius;
    const barOffset = halfSize + 8 * this.playfieldScale;

    this.sprite.setPosition(pos.x, pos.y);
    this.healthBarBg.setPosition(pos.x - this.barW / 2, pos.y - barOffset);
    this.healthBar.setPosition(pos.x - this.barW / 2, pos.y - barOffset);
    this.healthBar.width = this.barW * (this.health / this.maxHealth);
  }

  takeDamage(amount) {
    if (!this.alive) return;
    this.health -= amount;
    if (this.health <= 0) this.alive = false;
    this.updatePosition();
  }

  destroy() {
    this.sprite.destroy();
    this.healthBar.destroy();
    this.healthBarBg.destroy();
  }
}

export function resetEnemyIdCounter() {
  enemyIdCounter = 0;
}
