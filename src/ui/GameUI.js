import { getUnitPortraitHtml, getEnemyPortraitHtml } from '../assets/assets.js';
import { getGame } from '../game/gameLauncher.js';
import {
  getEnemyDisplayName,
  getUniqueProfileTypesForTrack,
} from '../config/enemyResolver.js';

const MOBILE_BREAKPOINT = '(max-width: 900px)';
const TOUCH_PLACEMENT = '(hover: none), (pointer: coarse)';
const DRAG_THRESHOLD = 10;

export class GameUI {
  constructor(config, selection) {
    this.config = config;
    this.selection = selection;
    this.heroDef = config.heroes[selection.hero];
    this.handlers = {};

    this.screen = document.getElementById('game-screen');
    this.hudCash = document.getElementById('hud-cash');
    this.hudLives = document.getElementById('hud-lives');
    this.hudRound = document.getElementById('hud-round');
    this.hudMessage = document.getElementById('hud-message');
    this.shopUnits = document.getElementById('shop-units');
    this.shopPanel = document.getElementById('shop-panel');
    this.shopToggle = document.getElementById('shop-drawer-toggle');
    this.shopClose = document.getElementById('shop-drawer-close');
    this.shopBackdrop = document.getElementById('shop-drawer-backdrop');
    this.gameContainer = document.getElementById('game-container');
    this.abilityButtons = document.getElementById('ability-buttons');
    this.sellBtn = document.getElementById('sell-btn');
    this.startRoundBtn = document.getElementById('start-round-btn');
    this.autoStartCheckbox = document.getElementById('auto-start-round');
    this.speedBtn = document.getElementById('speed-btn');
    this.selectedPanel = document.getElementById('selected-unit-panel');
    this.selectedName = document.getElementById('selected-unit-name');
    this.selectedHits = document.getElementById('selected-unit-hits');
    this.selectedRange = document.getElementById('selected-unit-range');
    this.gameOverModal = document.getElementById('game-over-modal');
    this.gameOverTitle = document.getElementById('game-over-title');
    this.enemyRoster = document.getElementById('enemy-roster');
    this.enemyRosterList = document.getElementById('enemy-roster-list');
    this.enemyRosterItems = new Map();

    this.shopItemEls = [];
    this.abilityBtnEls = [];
    this.dragGhost = null;
    this.activeDrag = null;
    this.shopDrawerOpen = false;
    this.mobileMedia = window.matchMedia(MOBILE_BREAKPOINT);
    this.touchMedia = window.matchMedia(TOUCH_PLACEMENT);
    this.onMobileLayoutChange = () => this.syncDrawerLayout();
  }

  on(event, handler) {
    this.handlers[event] = handler;
  }

  mount() {
    this.screen.classList.add('active');
    this.renderShop();
    this.renderAbilities();
    this.bindActions();
    this.bindDrawer();
    this.initEnemyRoster();
    this.updateShopHighlight(null, false, false);
    this.hideSelectedUnit();
    this.hudMessage.textContent = '';
    this.syncDrawerLayout();
    this.mobileMedia.addEventListener('change', this.onMobileLayoutChange);
  }

  isMobileLayout() {
    return this.mobileMedia.matches;
  }

  usesTouchPlacement() {
    return this.touchMedia.matches || this.isMobileLayout();
  }

  bindDrawer() {
    this.shopToggle?.addEventListener('click', () => this.toggleShopDrawer());
    this.shopClose?.addEventListener('click', () => this.closeShopDrawer());
    this.shopBackdrop?.addEventListener('click', () => this.closeShopDrawer());
  }

  syncDrawerLayout() {
    if (this.isMobileLayout()) {
      this.closeShopDrawer(false);
    } else {
      this.screen?.classList.remove('game-screen--shop-open');
      this.shopPanel?.classList.remove('shop-panel--open');
      this.shopBackdrop?.classList.add('hidden');
      this.shopToggle?.setAttribute('aria-expanded', 'false');
      this.shopDrawerOpen = false;
    }
    this.refreshPlayfieldScale();
  }

  toggleShopDrawer() {
    if (this.shopDrawerOpen) this.closeShopDrawer();
    else this.openShopDrawer();
  }

  openShopDrawer() {
    if (!this.isMobileLayout()) return;
    this.shopDrawerOpen = true;
    this.screen?.classList.add('game-screen--shop-open');
    this.shopPanel?.classList.add('shop-panel--open');
    this.shopBackdrop?.classList.remove('hidden');
    this.shopToggle?.setAttribute('aria-expanded', 'true');
    this.refreshPlayfieldScale();
  }

  closeShopDrawer(refreshScale = true) {
    this.shopDrawerOpen = false;
    this.screen?.classList.remove('game-screen--shop-open');
    this.shopPanel?.classList.remove('shop-panel--open');
    this.shopBackdrop?.classList.add('hidden');
    this.shopToggle?.setAttribute('aria-expanded', 'false');
    if (refreshScale) this.refreshPlayfieldScale();
  }

  refreshPlayfieldScale() {
    const game = getGame();
    if (!game) return;
    requestAnimationFrame(() => game.scale.refresh());
    setTimeout(() => game.scale.refresh(), 320);
  }

  selectUnit(unit) {
    if (this.isMobileLayout()) this.closeShopDrawer();
    this.handlers.onSelectUnit?.(unit);
  }

  renderShop() {
    this.shopUnits.innerHTML = '';
    this.shopItemEls = [];

    const units = [
      { type: 'hero', def: this.heroDef },
      ...Object.values(this.config.towers).map((t) => ({ type: 'tower', def: t })),
    ];

    for (const unit of units) {
      const isHero = unit.type === 'hero';
      const portrait = isHero
        ? getUnitPortraitHtml({ heroId: unit.def.id, color: unit.def.color, className: 'shop-unit__portrait' })
        : getUnitPortraitHtml({ towerId: unit.def.id, color: unit.def.color, className: 'shop-unit__portrait' });
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'shop-unit';
      btn.dataset.type = unit.type;
      btn.dataset.id = unit.def.id;
      btn.innerHTML = `
        ${portrait}
        <div class="shop-unit__info">
          <div class="shop-unit__name">${unit.def.name}</div>
          <div class="shop-unit__price">${isHero ? 'Place once · free' : `$${unit.def.buyCost}`}</div>
        </div>
      `;

      if (this.usesTouchPlacement()) {
        btn.addEventListener('pointerdown', (e) => this.onShopPointerDown(e, unit, btn, portrait));
      } else {
        btn.addEventListener('click', () => {
          if (btn.classList.contains('disabled')) return;
          this.selectUnit({ type: unit.type, id: unit.def.id, def: unit.def });
        });
      }

      this.shopUnits.appendChild(btn);
      this.shopItemEls.push({ el: btn, type: unit.type, id: unit.def.id });
    }
  }

  onShopPointerDown(e, unit, btn, portraitHtml) {
    if (btn.classList.contains('disabled')) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    const startX = e.clientX;
    const startY = e.clientY;
    let dragging = false;

    const cleanup = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
      this.gameContainer?.classList.remove('is-dragging');
      this.activeDrag = null;
    };

    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!dragging && Math.hypot(dx, dy) >= DRAG_THRESHOLD) {
        dragging = true;
        this.closeShopDrawer();
        this.dragGhost = this.createDragGhost(portraitHtml, unit.def.name);
        this.gameContainer?.classList.add('is-dragging');
        this.handlers.onDragPlace?.({ phase: 'start', unit: { type: unit.type, id: unit.def.id, def: unit.def } });
      }
      if (dragging) {
        ev.preventDefault();
        this.moveDragGhost(ev.clientX, ev.clientY);
        this.handlers.onDragPlace?.({
          phase: 'move',
          clientX: ev.clientX,
          clientY: ev.clientY,
          unit: { type: unit.type, id: unit.def.id, def: unit.def },
        });
      }
    };

    const onUp = (ev) => {
      cleanup();
      if (dragging) {
        this.removeDragGhost();
        this.handlers.onDragPlace?.({
          phase: 'end',
          clientX: ev.clientX,
          clientY: ev.clientY,
          unit: { type: unit.type, id: unit.def.id, def: unit.def },
        });
        return;
      }
      this.selectUnit({ type: unit.type, id: unit.def.id, def: unit.def });
    };

    this.activeDrag = { unit, btn };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
  }

  createDragGhost(portraitHtml, name) {
    const ghost = document.createElement('div');
    ghost.className = 'shop-drag-ghost';
    ghost.innerHTML = `
      ${portraitHtml}
      <span class="shop-drag-ghost__name">${name}</span>
    `;
    document.body.appendChild(ghost);
    return ghost;
  }

  moveDragGhost(clientX, clientY) {
    if (!this.dragGhost) return;
    this.dragGhost.style.left = `${clientX}px`;
    this.dragGhost.style.top = `${clientY}px`;
  }

  removeDragGhost() {
    this.dragGhost?.remove();
    this.dragGhost = null;
  }

  renderAbilities() {
    this.abilityButtons.innerHTML = '';
    this.abilityBtnEls = [];
    const abilities = this.heroDef.abilities || [];

    for (let i = 0; i < abilities.length; i++) {
      const ability = abilities[i];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ability-btn';
      btn.textContent = ability.name;
      btn.addEventListener('click', () => this.handlers.onAbility?.(i));
      this.abilityButtons.appendChild(btn);
      this.abilityBtnEls.push({ btn, ability });
    }
  }

  bindActions() {
    this.sellBtn.addEventListener('click', () => this.handlers.onSell?.());
    this.startRoundBtn.addEventListener('click', () => this.handlers.onStartRound?.());
    this.speedBtn.addEventListener('click', () => this.handlers.onSpeed?.());
  }

  updateHUD({ cash, lives, round, totalRounds }) {
    this.hudCash.textContent = `$${cash}`;
    this.hudLives.textContent = String(lives);
    this.hudRound.textContent = `${round} / ${totalRounds}`;
  }

  showMessage(text) {
    this.hudMessage.textContent = text || '';
  }

  initEnemyRoster() {
    if (!this.enemyRoster || !this.enemyRosterList) return;

    const profileTypes = getUniqueProfileTypesForTrack(this.config, this.selection.track);
    this.enemyRosterItems.clear();
    this.enemyRosterList.innerHTML = '';

    for (const profileType of profileTypes) {
      const skin = this.config.trackEnemies?.[this.selection.track]?.[profileType];
      const portrait = getEnemyPortraitHtml({
        trackId: this.selection.track,
        profileType,
        color: skin?.color,
        className: 'enemy-roster__portrait',
      });
      const item = document.createElement('li');
      item.className = 'enemy-roster__item';
      item.dataset.profileType = profileType;
      item.innerHTML = `
        ${portrait}
        <span class="enemy-roster__name">???</span>
      `;
      this.enemyRosterList.appendChild(item);
      this.enemyRosterItems.set(profileType, item);
    }

    this.enemyRoster.classList.toggle('hidden', profileTypes.length === 0);
  }

  revealEnemy(profileType) {
    const item = this.enemyRosterItems.get(profileType);
    if (!item || item.classList.contains('enemy-roster__item--revealed')) return;

    const name = getEnemyDisplayName(this.config, this.selection.track, profileType);
    item.querySelector('.enemy-roster__name').textContent = name;
    item.classList.add('enemy-roster__item--revealed');
  }

  updateShopHighlight(placingUnit, sellMode, heroPlaced) {
    for (const { el, type, id } of this.shopItemEls) {
      const isSelected = placingUnit && placingUnit.type === type && placingUnit.id === id;
      const isDisabled = type === 'hero' && heroPlaced;
      el.classList.toggle('selected', isSelected);
      el.classList.toggle('disabled', isDisabled);
    }
    this.sellBtn.classList.toggle('active', sellMode);
  }

  updateAbilities(cooldowns) {
    this.abilityBtnEls.forEach(({ btn, ability }, i) => {
      const cd = cooldowns[i] || 0;
      if (cd > 0) {
        btn.disabled = true;
        btn.innerHTML = `${ability.name} <span class="cooldown">${Math.ceil(cd)}s</span>`;
      } else {
        btn.disabled = false;
        btn.textContent = ability.name;
      }
    });
  }

  showSelectedUnit(unit) {
    if (!unit) {
      this.hideSelectedUnit();
      return;
    }
    this.selectedName.textContent = unit.def.name;
    this.selectedHits.textContent = String(unit.hitCount);
    this.selectedRange.textContent = String(unit.getRange());
    this.selectedPanel.classList.remove('hidden');
  }

  hideSelectedUnit() {
    this.selectedPanel.classList.add('hidden');
  }

  setSpeed(speed) {
    this.speedBtn.textContent = `${speed}×`;
  }

  isAutoStartNextRound() {
    return this.autoStartCheckbox?.checked ?? false;
  }

  showGameOver(won, onReturn) {
    this.gameOverTitle.textContent = won ? 'You Win!' : 'Game Over';
    this.gameOverTitle.className = won ? 'win' : 'lose';
    this.gameOverModal.classList.remove('hidden');

    const handler = () => {
      this.gameOverModal.classList.add('hidden');
      this.gameOverModal.removeEventListener('click', handler);
      onReturn();
    };
    this.gameOverModal.addEventListener('click', handler);
  }

  destroy() {
    this.mobileMedia.removeEventListener('change', this.onMobileLayoutChange);
    this.removeDragGhost();
    this.screen.classList.remove('active');
    this.gameOverModal.classList.add('hidden');
    this.closeShopDrawer(false);
  }
}
