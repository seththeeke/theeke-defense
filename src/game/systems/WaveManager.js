import { Enemy, resetEnemyIdCounter } from '../entities/Enemy.js';
import { getTrackPaths } from '../utils/pathFollower.js';
import { getWavesForTrack, resolveEnemyDef } from '../../config/enemyResolver.js';

export class WaveManager {
  constructor(scene, config, track, gridOffsetX = 0, gridOffsetY = 0, playfieldScale = 1) {
    this.scene = scene;
    this.config = config;
    this.track = track;
    this.trackId = track.id;
    this.playfieldScale = playfieldScale;
    this.gridOffsetX = gridOffsetX;
    this.gridOffsetY = gridOffsetY;
    this.paths = getTrackPaths(track).map((p) => ({
      ...p,
      waypoints: p.waypoints.map((w) => ({
        x: w.x + gridOffsetX,
        y: w.y + gridOffsetY,
      })),
    }));
    this.currentRound = 0;
    this.totalRounds = 10;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.spawnInterval = 0.8;
    this.enemies = [];
    this.waveActive = false;
    this.waveComplete = false;
    this.roundComplete = false;
    this.onEnemySpawned = null;
  }

  setTotalRounds(n) {
    this.totalRounds = n;
  }

  setOnEnemySpawned(callback) {
    this.onEnemySpawned = callback;
  }

  startRound(roundNumber) {
    this.currentRound = roundNumber;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.waveActive = true;
    this.waveComplete = false;
    this.roundComplete = false;

    const trackWaves = getWavesForTrack(this.config, this.trackId);
    const waveData = trackWaves.find((w) => w.round === roundNumber);
    if (!waveData) {
      this.waveActive = false;
      this.roundComplete = true;
      return;
    }

    for (const { profileType, count } of waveData.entries) {
      if (!resolveEnemyDef(this.config, this.trackId, profileType)) continue;
      for (let i = 0; i < count; i++) {
        const pathInfo = this.pickPath();
        this.spawnQueue.push({ profileType, ...pathInfo });
      }
    }

    this.spawnQueue.sort(() => Math.random() - 0.5);
  }

  pickPath() {
    if (this.paths.length === 1) {
      return { pathId: 'path', waypoints: this.paths[0].waypoints };
    }

    const spawnPoint = this.track.spawnPoints[
      Math.floor(Math.random() * this.track.spawnPoints.length)
    ];
    const pathId = spawnPoint.pathId || 'path';
    const path = this.paths.find((p) => p.id === pathId) || this.paths[0];
    return { pathId, waypoints: path.waypoints };
  }

  update(dt) {
    if (!this.waveActive) return;

    if (this.spawnQueue.length > 0) {
      this.spawnTimer += dt;
      if (this.spawnTimer >= this.spawnInterval) {
        this.spawnTimer = 0;
        const next = this.spawnQueue.shift();
        const enemyDef = resolveEnemyDef(this.config, this.trackId, next.profileType);
        if (enemyDef) {
          const enemy = new Enemy(
            this.scene,
            this.config,
            enemyDef,
            this.currentRound,
            this.config.gameConstants.roundScalingFactor,
            next.waypoints,
            next.pathId,
            this.playfieldScale
          );
          this.enemies.push(enemy);
          this.onEnemySpawned?.(enemyDef);
        }
      }
    }

    for (const enemy of this.enemies) {
      enemy.update(dt);
    }

    const aliveEnemies = this.enemies.filter((e) => e.alive);
    if (this.spawnQueue.length === 0 && aliveEnemies.length === 0) {
      this.waveActive = false;
      this.roundComplete = true;
    }
  }

  getAliveEnemies() {
    return this.enemies.filter((e) => e.alive);
  }

  getAllEnemies() {
    return this.enemies;
  }

  cleanupDead() {
    const dead = this.enemies.filter((e) => !e.alive);
    for (const e of dead) e.destroy();
    this.enemies = this.enemies.filter((e) => e.alive);
  }

  reset() {
    for (const e of this.enemies) e.destroy();
    this.enemies = [];
    resetEnemyIdCounter();
    this.currentRound = 0;
    this.spawnQueue = [];
    this.waveActive = false;
  }
}
