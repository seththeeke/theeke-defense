import { computeBuildableGrid } from '../utils/placementGrid.js';
import { TOWER_BLOCK_SIZE } from '../utils/unitFootprint.js';

const HERO_FOOTPRINT_COLS = 2;
const HERO_FOOTPRINT_ROWS = 2;

export class PlacementManager {
  constructor(track, cellSize, gridOffsetX, gridOffsetY, playfieldWidth, playfieldHeight, trackWidth, playfieldScale = 1) {
    this.track = track;
    this.cellSize = cellSize;
    this.gridOffsetX = gridOffsetX;
    this.gridOffsetY = gridOffsetY;
    this.playfieldScale = playfieldScale;

    const grid = computeBuildableGrid(
      track, cellSize, gridOffsetX, gridOffsetY, playfieldWidth, playfieldHeight, trackWidth
    );
    this.buildable = grid.buildable;
    this.cols = grid.cols;
    this.rows = grid.rows;

    this.occupied = new Set();
    this.towers = [];
    this.hero = null;
    this.heroFootprint = null;
  }

  blockKey(col, row) {
    return `${col},${row}`;
  }

  isBuildable(col, row) {
    return this.buildable.has(this.blockKey(col, row));
  }

  isBlockFree(col, row) {
    return !this.occupied.has(this.blockKey(col, row));
  }

  isInBounds(col, row) {
    return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
  }

  canPlace(col, row, blockSize) {
    for (let c = col; c < col + blockSize; c++) {
      if (!this.isInBounds(c, row)) return false;
      if (!this.isBlockFree(c, row)) return false;
      if (!this.isBuildable(c, row)) return false;
    }
    return true;
  }

  findPlaceableRow(col, blockSize) {
    for (let row = 0; row < this.rows; row++) {
      if (this.canPlace(col, row, blockSize)) return row;
    }
    return null;
  }

  /** Prefer the row under the cursor, then search nearby rows. */
  findPlaceableRowNear(col, row, blockSize) {
    if (this.canPlace(col, row, blockSize)) return row;

    for (let dist = 1; dist < this.rows; dist++) {
      if (row - dist >= 0 && this.canPlace(col, row - dist, blockSize)) return row - dist;
      if (row + dist < this.rows && this.canPlace(col, row + dist, blockSize)) return row + dist;
    }
    return null;
  }

  occupyBlocks(col, row, blockSize, rows = 1) {
    for (let r = row; r < row + rows; r++) {
      for (let c = col; c < col + blockSize; c++) {
        this.occupied.add(this.blockKey(c, r));
      }
    }
  }

  freeBlocks(col, row, blockSize, rows = 1) {
    for (let r = row; r < row + rows; r++) {
      for (let c = col; c < col + blockSize; c++) {
        this.occupied.delete(this.blockKey(c, r));
      }
    }
  }

  placeTower(tower) {
    this.occupyBlocks(tower.col, tower.row, TOWER_BLOCK_SIZE);
    this.towers.push(tower);
  }

  removeTower(tower) {
    this.freeBlocks(tower.col, tower.row, TOWER_BLOCK_SIZE);
    this.towers = this.towers.filter((t) => t !== tower);
    tower.destroy();
  }

  footprintContains(footprint, col, row) {
    return (
      col >= footprint.col &&
      col < footprint.col + footprint.cols &&
      row >= footprint.row &&
      row < footprint.row + footprint.rows
    );
  }

  canPlaceHeroFootprint(col, row) {
    if (this.hero) return false;
    if (col < 0 || col + HERO_FOOTPRINT_COLS > this.cols) return false;
    if (row < 0 || row + HERO_FOOTPRINT_ROWS > this.rows) return false;

    for (let c = col; c < col + HERO_FOOTPRINT_COLS; c++) {
      for (let r = row; r < row + HERO_FOOTPRINT_ROWS; r++) {
        if (!this.isBuildable(c, r) || !this.isBlockFree(c, r)) return false;
      }
    }
    return true;
  }

  findHeroAnchor(col, row) {
    for (let anchorRow = row; anchorRow >= row - (HERO_FOOTPRINT_ROWS - 1) && anchorRow >= 0; anchorRow--) {
      for (let anchorCol = col; anchorCol >= col - (HERO_FOOTPRINT_COLS - 1) && anchorCol >= 0; anchorCol--) {
        if (this.canPlaceHeroFootprint(anchorCol, anchorRow)) {
          return { col: anchorCol, row: anchorRow };
        }
      }
    }
    return null;
  }

  getHeroFootprintAt(col, row) {
    const anchor = this.findHeroAnchor(col, row);
    if (!anchor) return null;
    return {
      col: anchor.col,
      row: anchor.row,
      cols: HERO_FOOTPRINT_COLS,
      rows: HERO_FOOTPRINT_ROWS,
    };
  }

  placeHero(hero, footprint) {
    if (!this.canPlaceHeroFootprint(footprint.col, footprint.row)) return false;

    this.occupyBlocks(footprint.col, footprint.row, footprint.cols, footprint.rows);
    this.hero = hero;
    this.heroFootprint = { ...footprint };
    return true;
  }

  getOpenHeroFootprints() {
    const footprints = [];

    for (let row = 0; row <= this.rows - HERO_FOOTPRINT_ROWS; row++) {
      for (let col = 0; col <= this.cols - HERO_FOOTPRINT_COLS; col++) {
        const footprint = {
          col,
          row,
          cols: HERO_FOOTPRINT_COLS,
          rows: HERO_FOOTPRINT_ROWS,
        };

        if (this.heroFootprint &&
            footprint.col === this.heroFootprint.col &&
            footprint.row === this.heroFootprint.row) {
          continue;
        }

        let fits = true;
        for (let c = col; c < col + HERO_FOOTPRINT_COLS; c++) {
          for (let r = row; r < row + HERO_FOOTPRINT_ROWS; r++) {
            if (!this.isBuildable(c, r) || !this.isBlockFree(c, r)) {
              fits = false;
              break;
            }
          }
          if (!fits) break;
        }

        if (fits) footprints.push(footprint);
      }
    }

    return footprints;
  }

  relocateHero(footprint) {
    if (!this.hero || !this.heroFootprint) return false;

    let fits = true;
    for (let c = footprint.col; c < footprint.col + footprint.cols; c++) {
      for (let r = footprint.row; r < footprint.row + footprint.rows; r++) {
        if (!this.isBuildable(c, r) || !this.isBlockFree(c, r)) {
          fits = false;
          break;
        }
      }
      if (!fits) break;
    }
    if (!fits) return false;

    const old = this.heroFootprint;
    this.freeBlocks(old.col, old.row, old.cols, old.rows);
    this.occupyBlocks(footprint.col, footprint.row, footprint.cols, footprint.rows);
    this.hero.moveToSlot(footprint);
    this.heroFootprint = { ...footprint };
    return true;
  }

  screenToGrid(x, y) {
    const col = Math.floor((x - this.gridOffsetX) / this.cellSize);
    const row = Math.floor((y - this.gridOffsetY) / this.cellSize);
    return { col, row };
  }

  getPlacementBlocks() {
    return [...this.buildable].map((key) => {
      const [col, row] = key.split(',').map(Number);
      return { col, row };
    });
  }

  applyMikeyBuffs(mikeyHero) {
    if (!mikeyHero || mikeyHero.def.id !== 'mikey') return;

    for (const tower of this.towers) {
      tower.buffMultiplier = 1;
    }

    const buffRange = (mikeyHero.def.buffRange || 100) * this.playfieldScale;
    const buffPower = mikeyHero.def.buffPower || 0;

    for (const tower of this.towers) {
      const dx = tower.sprite.x - mikeyHero.sprite.x;
      const dy = tower.sprite.y - mikeyHero.sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= buffRange) {
        tower.buffMultiplier = 1 + buffPower;
      }
    }
  }

  applyWillSynergy() {
    const willTowers = this.towers.filter((t) => t.def.id === 'will');

    for (const tower of this.towers) {
      if (tower.def.id !== 'danielle') continue;
      tower.buffMultiplier = 1;

      for (const will of willTowers) {
        const dx = tower.sprite.x - will.sprite.x;
        const dy = tower.sprite.y - will.sprite.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= will.getRange()) {
          tower.buffMultiplier = 1 + (will.def.buffPower || 0);
          break;
        }
      }
    }
  }

  updateSynergies(mikeyHero) {
    this.applyMikeyBuffs(mikeyHero);
    this.applyWillSynergy();
  }
}
