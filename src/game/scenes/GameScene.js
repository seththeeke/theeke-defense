import Phaser from 'phaser';
import { Hero } from '../entities/Hero.js';
import { Tower } from '../entities/Tower.js';
import { resetProjectileIdCounter } from '../entities/Projectile.js';
import { PlacementManager } from '../systems/PlacementManager.js';
import { WaveManager } from '../systems/WaveManager.js';
import { CANVAS, DEPTH } from '../utils/canvasStyle.js';
import { unlockAudioSync } from '../audio/audioContext.js';
import { TrackFlowAnimator } from '../utils/trackFlowAnimator.js';
import { getTrackPaths } from '../utils/pathFollower.js';
import {
  getPlayfieldScale,
  getScaledCellSize,
  getScaledGridOffset,
  getScaledTrackWidth,
  scaleTrack,
  scaleUnitPadding,
} from '../utils/playfieldScale.js';
import { TOWER_BLOCK_SIZE } from '../utils/unitFootprint.js';
import { clientToGamePoint, isClientOverCanvas } from '../utils/inputCoords.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.selection = data.selection;
    this.config = window.__GAME_CONFIG__;
    this.gameUI = data.gameUI;
    this.onReturnToSetup = data.onReturnToSetup;
    this.gameSpeed = 1;
    this.gameOver = false;
    this.placingUnit = null;
    this.sellMode = false;
    this.relocateMode = false;
    this.betweenRounds = true;
    this.roundNumber = 0;
    this.hero = null;
    this.selectedUnit = null;
    this.seenProfileTypes = new Set();
  }

  create() {
    const config = this.config;
    const rawTrack = config.tracks[this.selection.track];
    const heroDef = config.heroes[this.selection.hero];

    const { width, height } = this.scale;
    this.playfieldScale = getPlayfieldScale(config);
    this.track = scaleTrack(rawTrack, this.playfieldScale);
    this.playfieldWidth = width;
    this.cellSize = getScaledCellSize(config);
    this.gridOffsetX = getScaledGridOffset(config);
    this.gridOffsetY = getScaledGridOffset(config);
    this.trackWidth = getScaledTrackWidth(config);
    this.unitPadding = scaleUnitPadding(config);
    this.totalRounds = config.gameConstants.totalRounds ?? 40;
    this.heroDef = heroDef;

    this.cash = config.gameConstants.startingCash;
    this.lives = config.gameConstants.startingLives;
    this.projectiles = [];

    this.placement = new PlacementManager(
      this.track, this.cellSize, this.gridOffsetX, this.gridOffsetY, width, height, this.trackWidth, this.playfieldScale
    );
    this.waveManager = new WaveManager(
      this, config, this.track, this.gridOffsetX, this.gridOffsetY, this.playfieldScale
    );
    this.waveManager.setTotalRounds(this.totalRounds);
    this.waveManager.setOnEnemySpawned((enemyDef) => this.onEnemySpawned(enemyDef));

    this.add.rectangle(width / 2, height / 2, width, height, CANVAS.bg);

    this.previewGraphics = this.add.graphics().setDepth(DEPTH.preview);
    this.rangeGraphics = this.add.graphics().setDepth(DEPTH.range);
    this.selectedRangeGraphics = this.add.graphics().setDepth(DEPTH.rangeSelected);

    this.drawTrack(this.track);
    this.trackFlowAnimators = this.createTrackFlowAnimators(this.track);
    this.drawPlacementAreas();
    this.wireUI();

    this.input.on('pointerdown', (pointer) => this.onPointerDown(pointer));
    this.input.on('pointermove', (pointer) => this.onPointerMove(pointer));

    this.updateHUD();
    resetProjectileIdCounter();
  }

  wireUI() {
    const ui = this.gameUI;

    ui.on('onSelectUnit', (item) => this.selectUnitToPlace(item));
    ui.on('onDragPlace', (data) => this.onDragPlace(data));
    ui.on('onSell', () => {
      this.sellMode = !this.sellMode;
      this.placingUnit = null;
      this.updateShopHighlights();
      this.clearPlacementPreview();
      ui.showMessage(this.sellMode ? 'Click a tower to sell' : '');
    });
    ui.on('onStartRound', () => this.startNextRound());
    ui.on('onAbility', (i) => this.useAbility(i));
    ui.on('onSpeed', () => {
      const speeds = [1, 2, 3];
      this.gameSpeed = speeds[(speeds.indexOf(this.gameSpeed) + 1) % speeds.length];
      ui.setSpeed(this.gameSpeed);
    });
  }

  drawTrack(track) {
    const g = this.add.graphics().setDepth(DEPTH.track);
    g.lineStyle(this.trackWidth + 6, CANVAS.trackGlow, 0.25);
    this.strokePath(g, track.path);
    if (track.path2) this.strokePath(g, track.path2);

    g.lineStyle(this.trackWidth, CANVAS.track, 1);
    this.strokePath(g, track.path);
    if (track.path2) this.strokePath(g, track.path2);
  }

  createTrackFlowAnimators(track) {
    const paths = getTrackPaths(track);
    return paths.map((path) => {
      const waypoints = path.waypoints.map((w) => ({
        x: w.x + this.gridOffsetX,
        y: w.y + this.gridOffsetY,
      }));
      return new TrackFlowAnimator(this, waypoints, {
        depth: DEPTH.trackFlow,
        color: 0xe2e8f0,
        alpha: 0.55,
        lineWidth: 3 * this.playfieldScale,
        speed: 60 * this.playfieldScale,
        dashLength: 10 * this.playfieldScale,
        gapLength: 16 * this.playfieldScale,
      });
    });
  }

  strokePath(g, waypoints) {
    if (waypoints.length < 2) return;
    g.beginPath();
    g.moveTo(waypoints[0].x + this.gridOffsetX, waypoints[0].y + this.gridOffsetY);
    for (let i = 1; i < waypoints.length; i++) {
      g.lineTo(waypoints[i].x + this.gridOffsetX, waypoints[i].y + this.gridOffsetY);
    }
    g.strokePath();
  }

  drawPlacementAreas() {
    this.placementGraphics = this.add.graphics().setDepth(DEPTH.buildable);
    this.redrawPlacementAreas();
  }

  redrawPlacementAreas() {
    if (!this.placementGraphics) return;

    const g = this.placementGraphics;
    g.clear();

    for (const { col, row } of this.placement.getPlacementBlocks()) {
      const occupied = this.placement.occupied.has(this.placement.blockKey(col, row));
      const fill = occupied ? CANVAS.placedCell : CANVAS.buildable;
      const border = occupied ? CANVAS.placedCellBorder : CANVAS.buildableBorder;
      const x = this.gridOffsetX + col * this.cellSize;
      const y = this.gridOffsetY + row * this.cellSize;
      g.fillStyle(fill, occupied ? 1 : 0.85);
      g.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);
      g.lineStyle(1, border, occupied ? 0.5 : 0.6);
      g.strokeRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);
    }
  }

  updateHUD() {
    this.gameUI.updateHUD({
      cash: this.cash,
      lives: this.lives,
      round: this.roundNumber,
      totalRounds: this.totalRounds,
    });
  }

  selectUnitToPlace(item) {
    if (item.type === 'hero') {
      if (this.hero) {
        this.showMessage('Hero already placed!');
        return;
      }
      this.placingUnit = { type: 'hero', id: item.id, def: item.def };
      this.sellMode = false;
      this.deselectUnit();
      this.showMessage(
        this.gameUI.usesTouchPlacement()
          ? `Drag or tap open ground to place ${item.def.name}`
          : `Click open ground to place ${item.def.name}`
      );
    } else {
      if (this.cash < item.def.buyCost) {
        this.showMessage('Not enough cash!');
        return;
      }
      this.placingUnit = { type: 'tower', id: item.id, def: item.def };
      this.sellMode = false;
      this.deselectUnit();
      this.showMessage(
        this.gameUI.usesTouchPlacement()
          ? `Drag or tap to place ${item.def.name}`
          : `Click to place ${item.def.name}`
      );
    }
    this.updateShopHighlights();
  }

  onDragPlace({ phase, clientX, clientY, unit }) {
    if (phase === 'start') {
      this.selectUnitToPlace(unit);
      return;
    }

    const pointer = clientToGamePoint(this.game, clientX, clientY);

    if (phase === 'move') {
      if (this.placingUnit) this.updatePlacementPreview(pointer);
      return;
    }

    if (phase === 'end') {
      if (isClientOverCanvas(this.game, clientX, clientY) && this.placingUnit) {
        this.tryPlaceAt(pointer);
      }
    }
  }

  updateShopHighlights() {
    this.gameUI.updateShopHighlight(this.placingUnit, this.sellMode, !!this.hero);
  }

  onPointerMove(pointer) {
    if (this.placingUnit) this.updatePlacementPreview(pointer);
  }

  clearPlacementPreview() {
    this.previewGraphics.clear();
    this.rangeGraphics.clear();
  }

  updatePlacementPreview(pointer) {
    this.previewGraphics.clear();
    this.rangeGraphics.clear();

    const { col, row } = this.placement.screenToGrid(pointer.x, pointer.y);

    if (this.placingUnit.type === 'hero') {
      const footprint = this.placement.getHeroFootprintAt(col, row);
      if (!footprint) return;
      const valid = this.placement.canPlaceHeroFootprint(footprint.col, footprint.row);
      const color = valid ? CANVAS.previewValid : CANVAS.previewInvalid;
      this.drawBlockOutline(footprint.col, footprint.row, footprint.cols, footprint.rows, color);
      const center = this.getSlotCenter(footprint);
      this.drawRangeCircle(center.x, center.y, this.placingUnit.def.range * this.playfieldScale, CANVAS.rangeValid);
      return;
    }

    const towerDef = this.placingUnit.def;
    const placeRow = this.placement.findPlaceableRowNear(col, row, TOWER_BLOCK_SIZE);
    if (placeRow === null) return;

    const valid = this.placement.canPlace(col, placeRow, TOWER_BLOCK_SIZE);
    const color = valid ? CANVAS.previewValid : CANVAS.previewInvalid;
    this.drawBlockOutline(col, placeRow, TOWER_BLOCK_SIZE, TOWER_BLOCK_SIZE, color);
    const cx = this.gridOffsetX + (col + TOWER_BLOCK_SIZE / 2) * this.cellSize;
    const cy = this.gridOffsetY + (placeRow + TOWER_BLOCK_SIZE / 2) * this.cellSize;
    this.drawRangeCircle(cx, cy, towerDef.range * this.playfieldScale, CANVAS.rangeValid);
  }

  drawBlockOutline(col, row, cols, rows, color) {
    const x = this.gridOffsetX + col * this.cellSize;
    const y = this.gridOffsetY + row * this.cellSize;
    this.previewGraphics.lineStyle(2, color, 0.95);
    this.previewGraphics.strokeRect(x + 2, y + 2, cols * this.cellSize - 4, rows * this.cellSize - 4);
    this.previewGraphics.fillStyle(color, 0.18);
    this.previewGraphics.fillRect(x + 2, y + 2, cols * this.cellSize - 4, rows * this.cellSize - 4);
  }

  drawRangeCircle(x, y, range, color) {
    this.rangeGraphics.lineStyle(1.5, color, 0.55);
    this.rangeGraphics.strokeCircle(x, y, range);
    this.rangeGraphics.fillStyle(color, 0.06);
    this.rangeGraphics.fillCircle(x, y, range);
  }

  getSlotCenter(slot) {
    return {
      x: this.gridOffsetX + (slot.col + slot.cols / 2) * this.cellSize,
      y: this.gridOffsetY + (slot.row + slot.rows / 2) * this.cellSize,
    };
  }

  selectUnit(unit) {
    this.selectedUnit = unit;
    this.placingUnit = null;
    this.sellMode = false;
    this.updateShopHighlights();
    this.clearPlacementPreview();
    this.gameUI.showSelectedUnit(unit);
    this.drawSelectedRange();
  }

  deselectUnit() {
    this.selectedUnit = null;
    this.selectedRangeGraphics.clear();
    this.gameUI.hideSelectedUnit();
  }

  drawSelectedRange() {
    this.selectedRangeGraphics.clear();
    if (!this.selectedUnit) return;
    const center = this.selectedUnit.getCenter();
    const range = this.selectedUnit.getRange();
    this.selectedRangeGraphics.lineStyle(2, CANVAS.rangeSelected, 0.7);
    this.selectedRangeGraphics.strokeCircle(center.x, center.y, range);
    this.selectedRangeGraphics.fillStyle(CANVAS.rangeSelected, 0.07);
    this.selectedRangeGraphics.fillCircle(center.x, center.y, range);
  }

  onPointerDown(pointer) {
    unlockAudioSync();
    if (this.gameOver) return;

    const { col, row } = this.placement.screenToGrid(pointer.x, pointer.y);

    if (this.relocateMode) {
      const footprint = this.placement.getHeroFootprintAt(col, row);
      if (footprint) {
        const match = this.placement.getOpenHeroFootprints().find(
          (f) => f.col === footprint.col && f.row === footprint.row
        );
        if (match) {
          this.placement.relocateHero(match);
          this.redrawPlacementAreas();
          this.relocateMode = false;
          this.showMessage('');
          if (this.selectedUnit === this.hero) this.drawSelectedRange();
          return;
        }
      }
      return;
    }

    if (this.sellMode) {
      for (const tower of [...this.placement.towers]) {
        if (this.isTowerAt(tower, col, row)) {
          this.cash += tower.def.sellValue;
          if (this.selectedUnit === tower) this.deselectUnit();
          this.placement.removeTower(tower);
          this.redrawPlacementAreas();
          this.updateHUD();
          return;
        }
      }
      return;
    }

    if (this.placingUnit) {
      this.tryPlaceAt(pointer);
      return;
    }

    if (this.hero) {
      const b = this.hero.sprite.getBounds();
      if (Phaser.Geom.Rectangle.Contains(b, pointer.x, pointer.y)) {
        this.selectUnit(this.hero);
        return;
      }
    }

    for (const tower of this.placement.towers) {
      const b = tower.sprite.getBounds();
      if (Phaser.Geom.Rectangle.Contains(b, pointer.x, pointer.y)) {
        this.selectUnit(tower);
        return;
      }
    }

    this.deselectUnit();
  }

  tryPlaceAt(pointer) {
    if (!this.placingUnit) return;

    const { col, row } = this.placement.screenToGrid(pointer.x, pointer.y);

    if (this.placingUnit.type === 'hero') {
      const footprint = this.placement.getHeroFootprintAt(col, row);
      if (footprint && this.placement.canPlaceHeroFootprint(footprint.col, footprint.row)) {
        const hero = new Hero(
          this, this.config, this.heroDef, footprint,
          this.cellSize, this.gridOffsetX, this.gridOffsetY
        );
        this.placement.placeHero(hero, footprint);
        this.hero = hero;
        this.redrawPlacementAreas();
        hero.sprite.on('pointerdown', (p) => {
          p.event?.stopPropagation?.();
          this.selectUnit(hero);
        });
        this.placingUnit = null;
        this.clearPlacementPreview();
        this.updateShopHighlights();
        this.showMessage(`${this.heroDef.name} deployed!`);
      }
      return;
    }

    const towerDef = this.placingUnit.def;
    const placeRow = this.placement.findPlaceableRowNear(col, row, TOWER_BLOCK_SIZE);
    if (placeRow !== null && this.placement.canPlace(col, placeRow, TOWER_BLOCK_SIZE)) {
      this.cash -= towerDef.buyCost;
      const tower = new Tower(
        this, this.config, towerDef, col, placeRow,
        this.cellSize, this.gridOffsetX, this.gridOffsetY
      );
      tower.sprite.on('pointerdown', (p) => {
        p.event?.stopPropagation?.();
        this.selectUnit(tower);
      });
      this.placement.placeTower(tower);
      this.redrawPlacementAreas();
      this.placingUnit = null;
      this.clearPlacementPreview();
      this.updateShopHighlights();
      this.updateHUD();
      this.showMessage('');
    }
  }

  isTowerAt(tower, col, row) {
    return col === tower.col && row === tower.row;
  }

  useAbility(index) {
    if (!this.hero) {
      this.showMessage('Place your hero first!');
      return;
    }
    if (!this.hero.canUseAbility(index)) {
      this.showMessage('Ability on cooldown!');
      return;
    }

    const enemies = this.waveManager.getAllEnemies();
    const result = this.hero.useAbility(index, enemies, (a, t, d, h) =>
      this.onProjectileHit(a, t, d, h)
    );
    if (!result) return;

    if (result.relocate) {
      this.relocateMode = true;
      this.showMessage('Click an open spot to relocate');
      return;
    }

    if (result.aoe) {
      this.showMessage('Sunshine Spin!');
    }
    if (result.zoomies) this.showMessage('ZOOMIES!');
    if (result.toxic) {
      this.showMessage('Toxic Breath!');
    }
    if (result.target) {
      this.showMessage('Focus!');
    }

    if (this.selectedUnit === this.hero) this.gameUI.showSelectedUnit(this.hero);
  }

  startNextRound() {
    if (!this.betweenRounds || this.gameOver) return;
    if (!this.hero) {
      this.showMessage('Place your hero before starting!');
      return;
    }
    this.roundNumber++;
    if (this.roundNumber > this.totalRounds) return;

    this.betweenRounds = false;
    this.waveManager.startRound(this.roundNumber);
    this.updateHUD();
    this.showMessage(`Round ${this.roundNumber}!`);
  }

  onProjectileHit(attacker, target, damage, isHero = false) {
    if (!target.alive) return;

    if (attacker.hitCount !== undefined) attacker.hitCount++;
    if (this.selectedUnit === attacker) this.gameUI.showSelectedUnit(attacker);

    target.takeDamage(damage);

    if (!isHero && attacker.def?.special === 'slow-on-hit') {
      target.applySlow(attacker.def.effectMagnitude, attacker.def.effectDuration, true);
    }

    if (!target.alive) this.onEnemyKilled(target);
  }

  onEnemySpawned(enemyDef) {
    const profileType = enemyDef.profileType;
    if (!profileType || this.seenProfileTypes.has(profileType)) return;
    this.seenProfileTypes.add(profileType);
    this.gameUI.revealEnemy(profileType);
  }

  onEnemyKilled(enemy) {
    this.cash += enemy.def.cashReward;
    this.updateHUD();
  }

  onEnemyLeaked(enemy) {
    if (enemy.def.isBoss) {
      this.lives = 0;
      this.showMessage('Boss escaped!');
    } else {
      this.lives -= enemy.def.livesCost;
    }
    this.updateHUD();
    if (this.lives <= 0) this.endGame(false);
  }

  endGame(won) {
    this.gameOver = true;
    this.gameUI.showGameOver(won, () => {
      this.gameUI.destroy();
      this.onReturnToSetup?.();
    });
  }

  showMessage(text) {
    this.gameUI.showMessage(text);
  }

  update(time, delta) {
    if (this.gameOver) return;

    const dt = (delta / 1000) * this.gameSpeed;

    for (const animator of this.trackFlowAnimators || []) {
      animator.update(dt);
    }

    if (this.hero) {
      this.gameUI.updateAbilities(this.hero.abilityCooldowns);
    }

    if (!this.betweenRounds && this.hero) {
      this.waveManager.update(dt);

      for (const enemy of this.waveManager.enemies) {
        if (enemy.reachedEnd && !enemy._leaked) {
          enemy._leaked = true;
          this.onEnemyLeaked(enemy);
        }
      }

      const dead = this.waveManager.enemies.filter((e) => !e.alive && !e.reachedEnd);
      for (const e of dead) {
        if (!e._rewarded) {
          e._rewarded = true;
          this.onEnemyKilled(e);
        }
      }
      this.waveManager.cleanupDead();

      const aliveCount = this.waveManager.getAliveEnemies().length;
      this.placement.updateSynergies(this.hero);

      this.hero.update(dt, this.waveManager.getAllEnemies(), (a, t, d, h) =>
        this.onProjectileHit(a, t, d, h)
      );

      for (const tower of this.placement.towers) {
        tower.update(dt, this.waveManager.getAllEnemies(), aliveCount, (a, t, d) =>
          this.onProjectileHit(a, t, d, false)
        );
      }

      for (const proj of this.projectiles) {
        proj.update(dt, this.waveManager.getAllEnemies());
      }
      const deadProj = this.projectiles.filter((p) => !p.alive);
      for (const p of deadProj) p.destroy();
      this.projectiles = this.projectiles.filter((p) => p.alive);

      if (this.waveManager.roundComplete) {
        this.betweenRounds = true;
        this.cash += this.config.gameConstants.roundCompletionBonus;
        this.updateHUD();
        this.showMessage(
          `Round ${this.roundNumber} complete! +$${this.config.gameConstants.roundCompletionBonus}`
        );
        if (this.roundNumber >= this.totalRounds) {
          this.endGame(true);
        } else if (this.gameUI.isAutoStartNextRound()) {
          this.startNextRound();
        }
      }
    }
  }
}
