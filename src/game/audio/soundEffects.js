import { getAudioContext, unlockAudio } from './audioContext.js';

export { unlockAudio };

const MAX_VOICES = 14;
const MIN_INTERVAL_MS = 40;

const TOWER_PROFILES = {
  'slow-on-hit': { freq: 165, decay: 0.14, type: 'triangle', volume: 0.055 },
  'multi-shot': { freq: 540, decay: 0.055, type: 'square', volume: 0.045 },
  'boss-bonus': { freq: 125, decay: 0.16, type: 'sawtooth', volume: 0.065 },
  'chaos-scaling': { freq: 400, decay: 0.07, type: 'square', volume: 0.05 },
  'will-synergy': { freq: 310, decay: 0.09, type: 'sine', volume: 0.05 },
  default: { freq: 275, decay: 0.085, type: 'square', volume: 0.05 },
};

const HERO_PROFILES = {
  seth: { freq: 215, decay: 0.12, type: 'sine', volume: 0.06 },
  lexie: { freq: 495, decay: 0.06, type: 'triangle', volume: 0.055 },
  noli: { freq: 345, decay: 0.08, type: 'square', volume: 0.052 },
  mikey: { freq: 290, decay: 0.1, type: 'sine', volume: 0.058 },
  default: { freq: 300, decay: 0.09, type: 'sine', volume: 0.055 },
};

let activeVoices = 0;
let lastPlayAt = 0;

function getTowerProfile(towerDef) {
  return TOWER_PROFILES[towerDef?.special] || TOWER_PROFILES.default;
}

function getHeroProfile(heroDef) {
  return HERO_PROFILES[heroDef?.id] || HERO_PROFILES.default;
}

function playShootSound(profile, attackSpeed = 1) {
  const audioCtx = getAudioContext();
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  if (audioCtx.state !== 'running') return;

  const now = performance.now();
  if (now - lastPlayAt < MIN_INTERVAL_MS || activeVoices >= MAX_VOICES) return;
  lastPlayAt = now;

  const pitch = 0.9 + Math.min(attackSpeed, 2.2) * 0.12;
  const startFreq = profile.freq * pitch;
  const t = audioCtx.currentTime;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = profile.type;
  osc.frequency.setValueAtTime(startFreq, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(60, startFreq * 0.45), t + profile.decay);

  gain.gain.setValueAtTime(profile.volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + profile.decay);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  activeVoices += 1;
  osc.start(t);
  osc.stop(t + profile.decay + 0.02);
  osc.onended = () => {
    activeVoices = Math.max(0, activeVoices - 1);
  };
}

/**
 * Short synthesized pew/blip via Web Audio — no asset files required.
 */
export function playTowerShoot(towerDef) {
  playShootSound(getTowerProfile(towerDef), towerDef?.attackSpeed ?? 1);
}

export function playHeroShoot(heroDef, attackSpeed) {
  playShootSound(getHeroProfile(heroDef), attackSpeed ?? heroDef?.attackSpeed ?? 1);
}
