import { hexToPhaser, DEPTH } from '../utils/canvasStyle.js';
import { hasTexture } from '../../assets/assetLoader.js';

let projectileIdCounter = 0;

export class Projectile {
  constructor(scene, x, y, target, damage, color, onHit, playfieldScale = 1, options = {}) {
    this.scene = scene;
    this.target = target;
    this.damage = damage;
    this.onHit = onHit;
    this.playfieldScale = playfieldScale;
    this.alive = true;
    this.id = ++projectileIdCounter;
    this.hitEnemyIds = new Set();
    this.traveled = 0;

    const size = (options.size ?? 10) * playfieldScale;
    this.speed = (options.speed ?? 420) * playfieldScale;
    this.hitRadius = (options.hitRadius ?? 8) * playfieldScale;
    this.maxDistance = options.maxDistance != null ? options.maxDistance * playfieldScale : null;
    this.velocity = options.velocity ?? null;
    this.homing = options.homing ?? (target != null && !this.velocity);
    this.useBubble = options.bubble === true;

    if (this.useBubble || !hasTexture(scene, 'projectile')) {
      const radius = (options.radius ?? size / 2);
      const fill = hexToPhaser(color || '#818cf8');
      this.sprite = scene.add.circle(x, y, radius, fill, options.alpha ?? 1);
      this.sprite.setStrokeStyle(Math.max(1, 2 * playfieldScale), 0xffffff, options.strokeAlpha ?? 0.6);
      this.sprite.setDepth(DEPTH.projectiles);
      this.spriteIsImage = false;
    } else {
      this.sprite = scene.add.image(x, y, 'projectile');
      this.sprite.setDisplaySize(size, size);
      this.sprite.setDepth(DEPTH.projectiles);
      this.sprite.setTint(hexToPhaser(color || '#818cf8'));
      this.spriteIsImage = true;
    }
  }

  update(dt, enemies = []) {
    if (!this.alive) return;

    if (this.homing) {
      if (!this.target?.alive) {
        this.alive = false;
        return;
      }

      const tx = this.target.sprite.x;
      const ty = this.target.sprite.y;
      const dx = tx - this.sprite.x;
      const dy = ty - this.sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.hitRadius) {
        this.onHit(this.target, this.damage);
        this.alive = false;
        return;
      }

      const move = this.speed * dt;
      this.traveled += move;
      this.sprite.x += (dx / dist) * move;
      this.sprite.y += (dy / dist) * move;
      return;
    }

    if (this.velocity) {
      const moveX = this.velocity.x * dt;
      const moveY = this.velocity.y * dt;
      this.sprite.x += moveX;
      this.sprite.y += moveY;
      this.traveled += Math.sqrt(moveX * moveX + moveY * moveY);

      if (this.maxDistance != null && this.traveled >= this.maxDistance) {
        this.alive = false;
        return;
      }

      for (const enemy of enemies) {
        if (!enemy.alive || this.hitEnemyIds.has(enemy.id)) continue;
        const dx = enemy.sprite.x - this.sprite.x;
        const dy = enemy.sprite.y - this.sprite.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.hitRadius) {
          this.hitEnemyIds.add(enemy.id);
          this.onHit(enemy, this.damage);
          this.alive = false;
          return;
        }
      }
      return;
    }

    this.alive = false;
  }

  destroy() {
    this.sprite.destroy();
  }
}

export function resetProjectileIdCounter() {
  projectileIdCounter = 0;
}
