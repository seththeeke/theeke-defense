import Phaser from 'phaser';
import { loadConfig } from '../../config/configLoader.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    window.__GAME_CONFIG__ = loadConfig();
    this.scene.start('SetupScene');
  }
}
