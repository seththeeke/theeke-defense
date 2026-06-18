import Phaser from 'phaser';
import PreloadScene from './scenes/PreloadScene.js';
import GameScene from './scenes/GameScene.js';
import { GameUI } from '../ui/GameUI.js';
import { resolveAvailableAssets } from '../assets/assetLoader.js';
import { getPlayfieldSize } from './utils/playfieldScale.js';

let game = null;

export async function startGame(selection, onReturnToSetup) {
  const config = window.__GAME_CONFIG__;
  const gameUI = new GameUI(config, selection);
  gameUI.mount();

  const container = document.getElementById('game-container');
  container.classList.add('is-loading');

  const assetsToLoad = await resolveAvailableAssets(config, selection);

  requestAnimationFrame(() => {
    const track = config.tracks[selection.track];
    const playfield = getPlayfieldSize(track, config);
    const width = playfield.width;
    const height = playfield.height;

    if (game) {
      game.destroy(true);
      game = null;
    }

    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: 'game-container',
      width,
      height,
      backgroundColor: '#0a0c10',
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      roundPixels: true,
      scene: [PreloadScene, GameScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    });

    const onResize = () => game?.scale?.refresh();
    window.addEventListener('resize', onResize);
    game.events.once('destroy', () => window.removeEventListener('resize', onResize));

    game.scene.start('PreloadScene', {
      selection,
      gameUI,
      onReturnToSetup,
      assetsToLoad,
    });
  });
}

export function returnToSetup(onReady) {
  if (game) {
    game.destroy(true);
    game = null;
  }
  document.getElementById('game-container')?.classList.remove('is-loading');
  document.getElementById('game-over-modal')?.classList.add('hidden');
  onReady?.();
}

export function getGame() {
  return game;
}
