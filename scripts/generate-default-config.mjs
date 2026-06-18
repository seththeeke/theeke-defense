import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const existingPath = join(__dirname, '../src/config/defaultConfig.json');
const existing = JSON.parse(readFileSync(existingPath, 'utf8'));

const PROFILE_TYPES = [
  'basic',
  'slow-powerhouse',
  'speedy-weakling',
  'healing',
  'strong-speed',
  'ability-immune',
  'boss',
];

const enemyProfiles = {
  basic: {
    id: 'basic',
    label: 'Basic',
    speed: 55,
    health: 40,
    cashReward: 8,
    livesCost: 1,
    healRate: 0,
    immuneToTowerAbilities: false,
    isBoss: false,
  },
  'slow-powerhouse': {
    id: 'slow-powerhouse',
    label: 'Slow Powerhouse',
    speed: 35,
    health: 90,
    cashReward: 12,
    livesCost: 1,
    healRate: 0,
    immuneToTowerAbilities: false,
    isBoss: false,
  },
  'speedy-weakling': {
    id: 'speedy-weakling',
    label: 'Speedy Weakling',
    speed: 85,
    health: 22,
    cashReward: 6,
    livesCost: 1,
    healRate: 0,
    immuneToTowerAbilities: false,
    isBoss: false,
  },
  healing: {
    id: 'healing',
    label: 'Healing Enemy',
    speed: 40,
    health: 45,
    cashReward: 14,
    livesCost: 1,
    healRate: 4,
    immuneToTowerAbilities: false,
    isBoss: false,
  },
  'strong-speed': {
    id: 'strong-speed',
    label: 'Strong Speed',
    speed: 75,
    health: 42,
    cashReward: 10,
    livesCost: 1,
    healRate: 0,
    immuneToTowerAbilities: false,
    isBoss: false,
  },
  'ability-immune': {
    id: 'ability-immune',
    label: 'Ability Immune',
    speed: 50,
    health: 80,
    cashReward: 16,
    livesCost: 1,
    healRate: 0,
    immuneToTowerAbilities: true,
    isBoss: false,
  },
  boss: {
    id: 'boss',
    label: 'Boss',
    speed: 45,
    health: 350,
    cashReward: 80,
    livesCost: 3,
    healRate: 0,
    immuneToTowerAbilities: false,
    isBoss: true,
  },
};

const trackEnemyNames = {
  'amazon-office': {
    basic: { name: 'Meeting', color: '#4a6fa5' },
    'slow-powerhouse': { name: 'Boss Ping', color: '#2c3e6b' },
    'speedy-weakling': { name: 'Slack Ping', color: '#7b9fd4' },
    healing: { name: 'WBR Bridge', color: '#5b8a72' },
    'strong-speed': { name: 'Project Blocker', color: '#c97b2e' },
    'ability-immune': { name: 'VP Escalation', color: '#8b2942' },
    boss: { name: 'Performance Improvement Plan', color: '#1a1a2e' },
  },
  broadway: {
    basic: { name: 'Vomit on the street', color: '#7cb342' },
    'slow-powerhouse': { name: 'Bridesmaid', color: '#e91e8c' },
    'speedy-weakling': { name: 'Jello Shot', color: '#ff6f00' },
    healing: { name: 'Drunk Homeless Person', color: '#8d6e63' },
    'strong-speed': { name: 'One more Drink', color: '#ab47bc' },
    'ability-immune': { name: 'Ms Kellies Karaoke', color: '#f06292' },
    boss: { name: 'Hangover', color: '#37474f' },
  },
  'theeke-house': {
    basic: { name: 'Dog Poop on Floor', color: '#8d6e3f' },
    'slow-powerhouse': { name: 'Making a Fence', color: '#6d4c41' },
    'speedy-weakling': { name: 'Yappy Dog', color: '#d4a574' },
    healing: { name: 'Surprise Chore', color: '#81c784' },
    'strong-speed': { name: 'Angry Dad', color: '#e53935' },
    'ability-immune': { name: 'Single Parenting', color: '#5c6bc0' },
    boss: { name: 'The In-Laws', color: '#9b2335' },
  },
};

const waveTemplate = [
  { round: 1, entries: [{ profileType: 'basic', count: 5 }] },
  { round: 2, entries: [{ profileType: 'basic', count: 8 }] },
  {
    round: 3,
    entries: [
      { profileType: 'basic', count: 4 },
      { profileType: 'slow-powerhouse', count: 2 },
    ],
  },
  {
    round: 4,
    entries: [
      { profileType: 'slow-powerhouse', count: 4 },
      { profileType: 'basic', count: 3 },
    ],
  },
  {
    round: 5,
    entries: [
      { profileType: 'basic', count: 3 },
      { profileType: 'speedy-weakling', count: 5 },
    ],
  },
  {
    round: 6,
    entries: [
      { profileType: 'healing', count: 4 },
      { profileType: 'basic', count: 2 },
    ],
  },
  {
    round: 7,
    entries: [
      { profileType: 'strong-speed', count: 5 },
      { profileType: 'speedy-weakling', count: 3 },
    ],
  },
  {
    round: 8,
    entries: [
      { profileType: 'ability-immune', count: 3 },
      { profileType: 'healing', count: 2 },
      { profileType: 'strong-speed', count: 2 },
    ],
  },
  {
    round: 9,
    entries: [
      { profileType: 'basic', count: 2 },
      { profileType: 'slow-powerhouse', count: 2 },
      { profileType: 'speedy-weakling', count: 3 },
      { profileType: 'healing', count: 2 },
      { profileType: 'strong-speed', count: 2 },
      { profileType: 'ability-immune', count: 2 },
    ],
  },
  {
    round: 10,
    entries: [
      { profileType: 'boss', count: 1 },
      { profileType: 'ability-immune', count: 2 },
      { profileType: 'strong-speed', count: 3 },
      { profileType: 'healing', count: 2 },
      { profileType: 'slow-powerhouse', count: 2 },
    ],
  },
];

const tracks = { ...existing.tracks };
tracks['theeke-house'].description =
  'Standard layout — survive 10 rounds to face The In-Laws';

const waves = {};
for (const trackId of Object.keys(trackEnemyNames)) {
  waves[trackId] = waveTemplate.map((w) => ({
    round: w.round,
    entries: w.entries.map((e) => ({ ...e })),
  }));
}

const config = {
  gameConstants: {
    ...existing.gameConstants,
    totalRounds: 10,
  },
  enemyProfiles,
  trackEnemies: trackEnemyNames,
  towers: existing.towers,
  heroes: existing.heroes,
  tracks,
  waves,
};

writeFileSync(existingPath, JSON.stringify(config, null, 2) + '\n');
console.log('Wrote', existingPath);
