# Home Defense

A personalized browser-based tower defense game built with Phaser.js. Defend against life's chaos using towers named after real people and heroes Seth, Lexie, Noli, and Mikey.

## Quick Start

```bash
npm install
npm run dev
```

- **Game:** http://localhost:5173/
- **Admin (hidden):** http://localhost:5173/admin/

## How to Play

1. Choose a hero, track, and difficulty on the setup screen.
2. Click **START ROUND** to begin each wave.
3. Buy towers from the shop panel and click green placement areas to place them.
4. Use hero abilities when off cooldown.
5. Survive all rounds for your difficulty to win.

## Config & Balance

All game balance lives in `src/config/defaultConfig.json`. The admin tool at `/admin` lets you tune stats and wave composition, saving overrides to `localStorage` for instant iteration. Export JSON when ready to commit new defaults.

## Project Structure

```
src/
  config/          # JSON config + loader + wave generator
  game/
    scenes/        # Boot, Setup, Game
    entities/      # Hero, Tower, Enemy, Projectile
    systems/       # Waves, placement, scaling
  assets/          # Asset key registry for future art
admin/             # Standalone config editor
```

## Build

```bash
npm run build
npm run preview
```
