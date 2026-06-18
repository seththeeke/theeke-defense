import { Projectile } from './Projectile.js';
import { CANVAS, getInitial, DEPTH } from '../utils/canvasStyle.js';
import { createUnitSprite, setUnitDisplaySize, setUnitPosition } from '../utils/spriteFactory.js';
import { getHeroAssetKey } from '../../assets/assets.js';
import { getPlayfieldScale } from '../utils/playfieldScale.js';
import { playHeroShoot } from '../audio/soundEffects.js';

export class Hero {
  constructor(scene, config, heroDef, slot, cellSize, gridOffsetX, gridOffsetY) {
    this.scene = scene;
    this.config = config;
    this.def = heroDef;
    this.slot = slot;
    this.cellSize = cellSize;
    this.gridOffsetX = gridOffsetX;
    this.gridOffsetY = gridOffsetY;
    this.playfieldScale = getPlayfieldScale(config);
    this.unitPadding = 6 * this.playfieldScale;

    const cx = gridOffsetX + (slot.col + slot.cols / 2) * cellSize;
    const cy = gridOffsetY + (slot.row + slot.rows / 2) * cellSize;
    const width = slot.cols * cellSize - this.unitPadding;
    const height = slot.rows * cellSize - this.unitPadding;
    const padWidth = slot.cols * cellSize - 2;
    const padHeight = slot.rows * cellSize - 2;

    this.pad = scene.add.rectangle(cx, cy, padWidth, padHeight, CANVAS.placedCell);
    this.pad.setDepth(DEPTH.unitPads);

    const { sprite, isImage } = createUnitSprite(scene, {
      x: cx,
      y: cy,
      width,
      height,
      textureKey: getHeroAssetKey(heroDef.id),
      fallbackColor: CANVAS.unitFill,
      fallbackStroke: CANVAS.heroStroke,
      fallbackStrokeWidth: 3,
    });
    this.sprite = sprite;
    this.spriteIsImage = isImage;
    this.sprite.setDepth(DEPTH.units);

    this.label = scene.add.text(cx, cy, getInitial(heroDef.name), {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: `${Math.round(18 * this.playfieldScale)}px`,
      fontStyle: 'bold',
      color: '#fbbf24',
    }).setOrigin(0.5).setResolution(2);
    this.label.setDepth(DEPTH.unitLabels);
    if (isImage) this.label.setVisible(false);

    this.fireTimer = 0;
    this.distracted = false;
    this.distractTimer = 0;
    this.zoomiesActive = false;
    this.zoomiesTimer = 0;
    this.toxicBreathActive = false;
    this.toxicBreathTimer = 0;
    this.abilityCooldowns = heroDef.abilities.map(() => 0);
    this.relocateMode = false;
    this.hitCount = 0;
    this.sprite.setInteractive({ useHandCursor: true });
  }

  getRange() {
    return this.def.range * this.playfieldScale;
  }

  getCenter() {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  getEffectiveAttackSpeed() {
    let speed = this.def.attackSpeed;
    if (this.zoomiesActive) {
      const zoomies = this.def.abilities.find((a) => a.id === 'zoomies');
      speed *= zoomies?.effectMagnitude || 3;
    }
    return speed;
  }

  getAttackColor() {
    if (this.toxicBreathActive) return '#22c55e';
    if (this.zoomiesActive) return '#ef4444';
    return this.def.color;
  }

  getAttackProjectileOptions() {
    const options = {};
    if (this.toxicBreathActive) {
      options.size = 18;
      options.hitRadius = 12;
      options.bubble = true;
      options.alpha = 0.9;
    }
    return options;
  }

  spawnAttackProjectile(target, onProjectileHit) {
    const proj = new Projectile(
      this.scene, this.sprite.x, this.sprite.y, target,
      this.def.attackPower, this.getAttackColor(),
      (hitTarget, dmg) => onProjectileHit(this, hitTarget, dmg, true),
      this.playfieldScale,
      this.getAttackProjectileOptions()
    );
    this.scene.projectiles.push(proj);
  }

  spawnFocusBubble(target, damage, onProjectileHit) {
    const proj = new Projectile(
      this.scene, this.sprite.x, this.sprite.y, target,
      damage, this.def.color,
      (hitTarget, dmg) => onProjectileHit(this, hitTarget, dmg, true),
      this.playfieldScale,
      {
        bubble: true,
        radius: 18,
        hitRadius: 20,
        speed: 320,
        alpha: 0.75,
        strokeAlpha: 0.8,
      }
    );
    this.scene.projectiles.push(proj);
  }

  spawnSunshineBurst(damage, onProjectileHit) {
    const count = 16;
    const speed = 480 * this.playfieldScale;
    const color = '#fde047';

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const proj = new Projectile(
        this.scene, this.sprite.x, this.sprite.y, null,
        damage, color,
        (hitTarget, dmg) => onProjectileHit(this, hitTarget, dmg, true),
        this.playfieldScale,
        {
          homing: false,
          velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
          size: 8,
          hitRadius: 10,
          maxDistance: 380,
          bubble: true,
          alpha: 0.95,
        }
      );
      this.scene.projectiles.push(proj);
    }
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

  update(dt, enemies, onProjectileHit) {
    for (let i = 0; i < this.abilityCooldowns.length; i++) {
      if (this.abilityCooldowns[i] > 0) {
        this.abilityCooldowns[i] = Math.max(0, this.abilityCooldowns[i] - dt);
      }
    }

    if (this.zoomiesActive) {
      this.zoomiesTimer -= dt;
      if (this.zoomiesTimer <= 0) this.zoomiesActive = false;
    }

    if (this.toxicBreathActive) {
      this.toxicBreathTimer -= dt;
      if (this.toxicBreathTimer <= 0) this.toxicBreathActive = false;
    }

    if (this.def.distractChance && !this.distracted && !this.zoomiesActive) {
      if (Math.random() < this.def.distractChance * dt) {
        this.distracted = true;
        this.distractTimer = this.def.distractDuration || 1.5;
      }
    }
    if (this.distracted) {
      this.distractTimer -= dt;
      if (this.distractTimer <= 0) this.distracted = false;
      return;
    }

    this.fireTimer += dt;
    const interval = 1 / this.getEffectiveAttackSpeed();

    if (this.fireTimer >= interval) {
      const target = this.findTarget(enemies);
      if (target) {
        if (this.def.accuracy !== undefined && Math.random() > this.def.accuracy) {
          this.fireTimer = 0;
          return;
        }
        this.spawnAttackProjectile(target, onProjectileHit);
        playHeroShoot(this.def, this.getEffectiveAttackSpeed());
        this.fireTimer = 0;
      }
    }
  }

  canUseAbility(index) {
    return this.abilityCooldowns[index] <= 0;
  }

  useAbility(index, enemies, onProjectileHit) {
    const ability = this.def.abilities[index];
    if (!ability || !this.canUseAbility(index)) return null;

    this.abilityCooldowns[index] = ability.cooldown;
    const result = { ability, hero: this };

    switch (ability.id) {
      case 'focus': {
        const alive = enemies.filter((e) => e.alive);
        if (alive.length === 0) break;
        const strongest = alive.reduce((a, b) => (a.health > b.health ? a : b));
        const damage = this.def.attackPower * ability.effectMagnitude;
        this.spawnFocusBubble(strongest, damage, onProjectileHit);
        result.target = strongest;
        break;
      }
      case 'sunshine-spin': {
        this.spawnSunshineBurst(ability.effectMagnitude, onProjectileHit);
        result.aoe = true;
        break;
      }
      case 'relocate':
        result.relocate = true;
        break;
      case 'zoomies':
        this.zoomiesActive = true;
        this.zoomiesTimer = ability.duration;
        result.zoomies = true;
        break;
      case 'toxic-breath': {
        this.toxicBreathActive = true;
        this.toxicBreathTimer = ability.duration;
        for (const enemy of enemies) {
          if (!enemy.alive) continue;
          if (this.distanceTo(enemy) <= this.getRange()) {
            enemy.applySlow(ability.effectMagnitude, ability.duration);
          }
        }
        result.toxic = true;
        break;
      }
    }

    return result;
  }

  moveToSlot(slot) {
    this.slot = slot;
    const cx = this.gridOffsetX + (slot.col + slot.cols / 2) * this.cellSize;
    const cy = this.gridOffsetY + (slot.row + slot.rows / 2) * this.cellSize;
    const width = slot.cols * this.cellSize - this.unitPadding;
    const height = slot.rows * this.cellSize - this.unitPadding;
    const padWidth = slot.cols * this.cellSize - 2;
    const padHeight = slot.rows * this.cellSize - 2;
    setUnitPosition(this.pad, cx, cy);
    this.pad.setSize(padWidth, padHeight);
    setUnitPosition(this.sprite, cx, cy);
    setUnitDisplaySize(this.sprite, this.spriteIsImage, width, height);
    this.label.setPosition(cx, cy);
  }

  destroy() {
    this.pad.destroy();
    this.sprite.destroy();
    this.label.destroy();
  }
}
