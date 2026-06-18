import {
  getHeroAssetPath,
  getHeroSelectedAssetPath,
  getHeroSetupPortraitHtml,
} from '../assets/assets.js';
import { getTrackIconHtml } from './trackIcons.js';
import { beginSetupMusicFromGesture, startSetupMusic, stopSetupMusic } from '../game/audio/backgroundMusic.js';

export class SetupUI {
  constructor(config, onStart) {
    this.config = config;
    this.onStart = onStart;
    this.selection = { hero: null, track: null };

    this.screen = document.getElementById('setup-screen');
    this.startBtn = document.getElementById('start-game-btn');
    this.heroOptions = document.getElementById('hero-options');
    this.trackOptions = document.getElementById('track-options');

    this.render();
    this.startBtn.addEventListener('click', () => {
      beginSetupMusicFromGesture();
      this.tryStart();
    });
  }

  render() {
    this.renderHeroes();
    this.renderTracks();
  }

  renderHeroes() {
    this.heroOptions.innerHTML = '';
    this.heroCards = new Map();

    for (const hero of Object.values(this.config.heroes)) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'option-card option-card--hero';
      card.dataset.heroId = hero.id;
      card.innerHTML = `
        <div class="option-card__portrait-wrap">
          ${getHeroSetupPortraitHtml({ heroId: hero.id, color: hero.color, className: 'option-card__portrait' })}
        </div>
        <div class="option-card__name">${hero.name}</div>
        <div class="option-card__meta">ATK ${hero.attackPower} · SPD ${hero.attackSpeed}</div>
      `;
      card.addEventListener('click', () => {
        beginSetupMusicFromGesture();
        this.selection.hero = hero.id;
        this.updateHeroSelection(hero.id);
        this.updateStartBtn();
      });
      this.heroOptions.appendChild(card);
      this.heroCards.set(hero.id, card);
    }
  }

  updateHeroSelection(selectedHeroId) {
    for (const [heroId, card] of this.heroCards) {
      const isSelected = heroId === selectedHeroId;
      card.classList.toggle('selected', isSelected);
      this.setHeroPortrait(card, heroId, isSelected);
    }
  }

  setHeroPortrait(card, heroId, selected) {
    const portrait = card.querySelector('.option-card__portrait');
    if (!portrait || portrait.tagName !== 'IMG') return;

    const nextSrc = selected
      ? getHeroSelectedAssetPath(heroId) ?? getHeroAssetPath(heroId)
      : getHeroAssetPath(heroId);
    if (!nextSrc || portrait.dataset.src === nextSrc) return;

    portrait.dataset.src = nextSrc;
    portrait.classList.add('option-card__portrait--swapping');
    portrait.style.opacity = '0';

    window.setTimeout(() => {
      portrait.src = nextSrc;
      portrait.style.opacity = '1';
      window.setTimeout(() => portrait.classList.remove('option-card__portrait--swapping'), 180);
    }, 140);
  }

  renderTracks() {
    this.trackOptions.innerHTML = '';
    const excluded = new Set(['dog-park', 'white-house']);

    for (const track of Object.values(this.config.tracks)) {
      if (excluded.has(track.id)) continue;
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'option-card option-card--track';
      card.innerHTML = `
        ${getTrackIconHtml(track.id)}
        <div class="option-card__name">${track.name}</div>
      `;
      card.addEventListener('click', () => {
        beginSetupMusicFromGesture();
        this.selection.track = track.id;
        this.highlight('.option-card', card, this.trackOptions);
        this.updateStartBtn();
      });
      this.trackOptions.appendChild(card);
    }
  }

  highlight(selector, selected, container) {
    container.querySelectorAll(selector).forEach((el) => el.classList.remove('selected'));
    selected.classList.add('selected');
  }

  updateStartBtn() {
    const ready = this.selection.hero && this.selection.track;
    this.startBtn.disabled = !ready;
  }

  tryStart() {
    if (this.startBtn.disabled) return;
    this.onStart({ ...this.selection });
  }

  show() {
    this.screen.classList.add('active');
    document.getElementById('game-screen').classList.remove('active');
    if (this.selection.hero) this.updateHeroSelection(this.selection.hero);
    startSetupMusic();
  }

  hide() {
    stopSetupMusic();
    this.screen.classList.remove('active');
  }
}
