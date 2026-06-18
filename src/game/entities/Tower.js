import { Projectile } from './Projectile.js';
import { CANVAS, hexToPhaser, getInitial, DEPTH } from '../utils/canvasStyle.js';
import { createUnitSprite } from '../utils/spriteFactory.js';
import { getTowerAssetKey } from '../../assets/assets.js';
import { getPlayfieldScale } from '../utils/playfieldScale.js';
import { TOWER_BLOCK_SIZE } from '../utils/unitFootprint.js';
import { playTowerShoot } from '../audio/soundEffects.js';

export class Tower {
  constructor(scene, config, towerDef, col, row, cellSize, gridOffsetX, gridOffsetY) {
    this.scene = scene;
    this.config = config;
    this.def = towerDef;
    this.col = col;
    this.row = row;
    this.cellSize = cellSize;
    this.gridOffsetX = gridOffsetX;
    this.gridOffsetY = gridOffsetY;
    this.playfieldScale = getPlayfieldScale(config);
    this.unitPadding = 6 * this.playfieldScale;
    this.blockSize = TOWER_BLOCK_SIZE;

    const cx = gridOffsetX + (col + this.blockSize / 2) * cellSize;
    const cy = gridOffsetY + (row + this.blockSize / 2) * cellSize;
    const size = this.blockSize * cellSize - this.unitPadding;
    const accent = hexToPhaser(towerDef.color);

    const { sprite, isImage } = createUnitSprite(scene, {
      x: cx,
      y: cy,
      width: size,
      height: size,
      textureKey: getTowerAssetKey(towerDef.id),
      fallbackColor: CANVAS.unitFill,
      fallbackStroke: accent,
      fallbackStrokeWidth: 2,
    });
    this.sprite = sprite;
    this.spriteIsImage = isImage;
    this.sprite.setDepth(DEPTH.units);

    this.label = scene.add.text(cx, cy, getInitial(towerDef.name), {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: `${Math.round(15 * this.playfieldScale)}px`,
      fontStyle: 'bold',
      color: '#f1f5f9',
    }).setOrigin(0.5).setResolution(2);
    this.label.setDepth(DEPTH.unitLabels);
    if (isImage) this.label.setVisible(false);

    this.fireTimer = 0;
    this.buffMultiplier = 1;
    this.sold = false;
    this.hitCount = 0;
    this.sprite.setInteractive({ useHandCursor: true });
  }

  getCenter() {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  getEffectiveAttackSpeed(enemyCount = 0) {
    let speed = this.def.attackSpeed * this.buffMultiplier;
    if (this.def.special === 'chaos-scaling') {
      speed *= 1 + Math.min(enemyCount * 0.05, 1.5);
    }
    return speed;
  }

  getEffectiveAttackPower() {
    return this.def.attackPower * this.buffMultiplier;
  }

  getRange() {
    return this.def.range * this.playfieldScale;
  }

  distanceTo(enemy) {
    const dx = this.sprite.x - enemy.sprite.x;
    const dy = this.sprite.y - enemy.sprite.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  findTarget(enemies) {
    let best = null;
    let bestProgress = -1;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      if (this.distanceTo(enemy) > this.getRange()) continue;
      const progress = enemy.pathFollower.getProgress();
      if (progress > bestProgress) {
        bestProgress = progress;
        best = enemy;
      }
    }
    return best;
  }

  fire(target, enemies, onProjectileHit) {
    const power = this.getEffectiveAttackPower();
    const count = this.def.special === 'multi-shot' ? (this.def.projectileCount || 3) : 1;

    if (count > 1) {
      const inRange = enemies.filter((e) => e.alive && this.distanceTo(e) <= this.getRange());
      const targets = inRange.slice(0, count);
      if (targets.length === 0 && target) targets.push(target);
      for (const t of targets) this.spawnProjectile(t, power, onProjectileHit);
    } else if (target) {
      this.spawnProjectile(target, power, onProjectileHit);
    }
  }

  spawnProjectile(target, damage, onProjectileHit) {
    let finalDamage = damage;
    if (this.def.special === 'boss-bonus' && target.def.isBoss) {
      finalDamage *= this.def.bossBonusMultiplier || 3;
    }
    const proj = new Projectile(
      this.scene, this.sprite.x, this.sprite.y, target,
      finalDamage, this.def.color,
      (hitTarget, dmg) => onProjectileHit(this, hitTarget, dmg),
      this.playfieldScale
    );
    this.scene.projectiles.push(proj);
    playTowerShoot(this.def);
  }

  update(dt, enemies, enemyCount, onProjectileHit) {
    if (this.sold) return;
    this.fireTimer += dt;
    const interval = 1 / this.getEffectiveAttackSpeed(enemyCount);
    if (this.fireTimer >= interval) {
      const target = this.findTarget(enemies);
      if (target) {
        this.fire(target, enemies, onProjectileHit);
        this.fireTimer = 0;
      }
    }
  }

  destroy() {
    this.sprite.destroy();
    this.label.destroy();
  }
}
