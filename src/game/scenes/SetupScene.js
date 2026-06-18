import Phaser from 'phaser';

export default class SetupScene extends Phaser.Scene {
  constructor() {
    super('SetupScene');
  }

  create() {
    const config = window.__GAME_CONFIG__;
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    this.add.text(width / 2, 40, 'Theeke Defense', {
      fontSize: '36px',
      color: '#ffd700',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, 80, 'defend all aspects of life', {
      fontSize: '16px',
      color: '#aaa',
    }).setOrigin(0.5);

    this.selection = {
      hero: null,
      track: null,
      difficulty: null,
    };

    this.createHeroSelection(config, 120);
    this.createTrackSelection(config, 280);
    this.createDifficultySelection(config, 440);

    this.startButton = this.add.text(width / 2, height - 60, 'START GAME', {
      fontSize: '24px',
      color: '#666',
      backgroundColor: '#333',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.startButton.on('pointerdown', () => this.tryStart());
    this.startButton.on('pointerover', () => {
      if (this.canStart()) this.startButton.setColor('#fff');
    });
    this.startButton.on('pointerout', () => {
      this.startButton.setColor(this.canStart() ? '#2ecc71' : '#666');
    });
  }

  createHeroSelection(config, y) {
    this.add.text(60, y - 30, 'Choose Your Hero', { fontSize: '18px', color: '#fff' });
    const heroes = Object.values(config.heroes);
    heroes.forEach((hero, i) => {
      const x = 120 + i * 180;
      const box = this.add.rectangle(x, y + 40, 150, 80,
        Phaser.Display.Color.HexStringToColor(hero.color).color
      ).setStrokeStyle(2, 0x555).setInteractive({ useHandCursor: true });

      this.add.text(x, y + 30, hero.name, { fontSize: '14px', color: '#fff' }).setOrigin(0.5);
      this.add.text(x, y + 55, `ATK ${hero.attackPower} | SPD ${hero.attackSpeed}`, {
        fontSize: '10px', color: '#ddd',
      }).setOrigin(0.5);

      box.heroId = hero.id;
      box.on('pointerdown', () => {
        this.selection.hero = hero.id;
        this.highlightGroup(this.heroBoxes, box);
        this.updateStartButton();
      });
      if (!this.heroBoxes) this.heroBoxes = [];
      this.heroBoxes.push(box);
    });
  }

  createTrackSelection(config, y) {
    this.add.text(60, y - 30, 'Choose Your Track', { fontSize: '18px', color: '#fff' });
    const tracks = Object.values(config.tracks);
    tracks.forEach((track, i) => {
      const x = 110 + i * 170;
      const box = this.add.rectangle(x, y + 40, 140, 70, 0x2c3e50)
        .setStrokeStyle(2, 0x555).setInteractive({ useHandCursor: true });

      this.add.text(x, y + 25, track.name, { fontSize: '11px', color: '#fff', align: 'center', wordWrap: { width: 130 } }).setOrigin(0.5);
      this.add.text(x, y + 50, track.description.substring(0, 40) + '...', {
        fontSize: '8px', color: '#aaa', wordWrap: { width: 130 }, align: 'center',
      }).setOrigin(0.5);

      box.trackId = track.id;
      box.on('pointerdown', () => {
        this.selection.track = track.id;
        this.highlightGroup(this.trackBoxes, box);
        this.updateStartButton();
      });
      if (!this.trackBoxes) this.trackBoxes = [];
      this.trackBoxes.push(box);
    });
  }

  createDifficultySelection(config, y) {
    this.add.text(60, y - 30, 'Choose Difficulty', { fontSize: '18px', color: '#fff' });
    const diffs = Object.entries(config.difficulties);
    diffs.forEach(([key, diff], i) => {
      const x = 140 + i * 180;
      const colors = { easy: 0x2ecc71, medium: 0xf39c12, hard: 0xe74c3c, impossible: 0x8e44ad };
      const box = this.add.rectangle(x, y + 30, 150, 50, colors[key] || 0x555)
        .setStrokeStyle(2, 0x555).setInteractive({ useHandCursor: true });

      this.add.text(x, y + 20, diff.label, { fontSize: '14px', color: '#fff' }).setOrigin(0.5);
      this.add.text(x, y + 38, `${diff.totalRounds} rounds`, { fontSize: '10px', color: '#eee' }).setOrigin(0.5);

      box.difficultyId = key;
      box.on('pointerdown', () => {
        this.selection.difficulty = key;
        this.highlightGroup(this.diffBoxes, box);
        this.updateStartButton();
      });
      if (!this.diffBoxes) this.diffBoxes = [];
      this.diffBoxes.push(box);
    });
  }

  highlightGroup(group, selected) {
    group.forEach((box) => {
      box.setStrokeStyle(box === selected ? 4 : 2, box === selected ? 0xffd700 : 0x555);
    });
  }

  canStart() {
    return this.selection.hero && this.selection.track && this.selection.difficulty;
  }

  updateStartButton() {
    if (this.canStart()) {
      this.startButton.setColor('#2ecc71');
      this.startButton.setBackgroundColor('#1e3a1e');
    }
  }

  tryStart() {
    if (!this.canStart()) return;
    this.scene.start('GameScene', { selection: { ...this.selection } });
  }
}
