import Phaser from 'phaser';
import { loadConfig } from './config/configLoader.js';
import { SetupUI } from './ui/SetupUI.js';
import { startGame, returnToSetup } from './game/gameLauncher.js';
import { bindGlobalAudioUnlock } from './game/audio/audioContext.js';
import { initSetupMusicAutoplay } from './game/audio/backgroundMusic.js';

window.__GAME_CONFIG__ = loadConfig();

let setupUI = null;

function initSetup() {
  setupUI = new SetupUI(window.__GAME_CONFIG__, (selection) => {
    setupUI.hide();
    startGame(selection, () => {
      returnToSetup(() => setupUI.show());
    });
  });
}

bindGlobalAudioUnlock();
initSetup();
initSetupMusicAutoplay();
