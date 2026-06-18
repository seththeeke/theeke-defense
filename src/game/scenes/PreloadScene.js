import Phaser from 'phaser';
import GameScene from './GameScene.js';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  init(data) {
    this.launchData = data;
    this.assetsToLoad = data.assetsToLoad || [];
  }

  preload() {
    const { width, height } = this.scale;
    this.loadingText = this.add
      .text(width / 2, height / 2, 'Loading assets...', {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '16px',
        color: '#94a3b8',
      })
      .setOrigin(0.5)
      .setResolution(2);

    for (const { key, path } of this.assetsToLoad) {
      this.load.image(key, path);
    }
  }

  create() {
    this.loadingText?.destroy();
    document.getElementById('game-container')?.classList.remove('is-loading');
    this.scene.start('GameScene', this.launchData);
  }
}
