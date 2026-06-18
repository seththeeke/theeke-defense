import { getAudioContext, unlockAudio, unlockAudioSync } from './audioContext.js';

/** Upbeat C-major loop — C → G → Am → F */
const PROGRESSION = [
  { freqs: [261.63, 329.63, 392], root: 130.81 },
  { freqs: [392, 493.88, 587.33], root: 196 },
  { freqs: [220, 261.63, 329.63], root: 110 },
  { freqs: [349.23, 440, 523.25], root: 174.61 },
];

const CHORD_DURATION = 2;
const ARP_STEP = 0.17;
const MASTER_VOLUME = 0.18;
const SCHEDULE_LOOKAHEAD = 12;

let musicGain = null;
let schedulerTimer = null;
let chordIndex = 0;
let nextChordTime = 0;
let isPlaying = false;
let musicEnabled = false;

function isSetupScreenActive() {
  return document.getElementById('setup-screen')?.classList.contains('active') ?? false;
}

function playTone(audioCtx, freq, startTime, duration, type, peakGain, attack = 0.04) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  const release = Math.min(duration * 0.45, 0.12);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + attack);
  gain.gain.linearRampToValueAtTime(peakGain * 0.7, startTime + duration - release);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);

  osc.connect(gain);
  gain.connect(musicGain);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

function playChordSection(audioCtx, chord, startTime) {
  const [root, third, fifth] = chord.freqs;
  const arpPattern = [root, third, fifth, third, root, fifth, third, fifth];
  const arpSteps = Math.floor(CHORD_DURATION / ARP_STEP);

  playTone(audioCtx, chord.root, startTime, CHORD_DURATION * 0.95, 'sine', 0.1, 0.06);
  playTone(audioCtx, root, startTime, CHORD_DURATION, 'triangle', 0.055, 0.2);

  for (let i = 0; i < arpSteps; i += 1) {
    const stepTime = startTime + i * ARP_STEP;
    const note = arpPattern[i % arpPattern.length];
    const bounce = i % 8 === 7 ? note * 1.5 : note;
    playTone(audioCtx, bounce, stepTime, ARP_STEP * 0.9, 'triangle', 0.14, 0.02);
  }

  if (chordIndex % PROGRESSION.length === 0) {
    playTone(audioCtx, root * 2, startTime + CHORD_DURATION * 0.5, 0.14, 'sine', 0.07, 0.01);
  }
}

function scheduleMusic() {
  const audioCtx = getAudioContext();
  if (!audioCtx || !isPlaying || !musicGain) return;

  while (nextChordTime < audioCtx.currentTime + SCHEDULE_LOOKAHEAD) {
    const chord = PROGRESSION[chordIndex % PROGRESSION.length];
    playChordSection(audioCtx, chord, nextChordTime);
    chordIndex += 1;
    nextChordTime += CHORD_DURATION;
  }

  schedulerTimer = window.setTimeout(scheduleMusic, 500);
}

function startPlayback() {
  const audioCtx = getAudioContext();
  if (!audioCtx || isPlaying) return;
  if (audioCtx.state !== 'running') return;

  isPlaying = true;
  chordIndex = 0;

  musicGain = audioCtx.createGain();
  const t = audioCtx.currentTime;
  musicGain.gain.setValueAtTime(0, t);
  musicGain.gain.linearRampToValueAtTime(MASTER_VOLUME, t + 0.35);
  musicGain.connect(audioCtx.destination);

  nextChordTime = t + 0.05;
  scheduleMusic();
}

function ensureSetupMusicPlaying() {
  if (!musicEnabled || !isSetupScreenActive()) return;
  unlockAudioSync();
  startPlayback();
  unlockAudio().then((running) => {
    if (running && musicEnabled && isSetupScreenActive() && !isPlaying) {
      startPlayback();
    }
  });
}

/** Call synchronously from a click/tap handler on the setup screen. */
export function beginSetupMusicFromGesture() {
  musicEnabled = true;
  unlockAudioSync();
  startPlayback();
  unlockAudio().then((running) => {
    if (running && musicEnabled && isSetupScreenActive() && !isPlaying) {
      startPlayback();
    }
  });
}

export function enableSetupMusic() {
  musicEnabled = true;
  return unlockAudio().then((running) => {
    if (running) startPlayback();
    return running;
  });
}

function bindGestureFallback() {
  const unlockFromGesture = () => {
    if (!isSetupScreenActive()) return;
    beginSetupMusicFromGesture();
  };

  document.addEventListener('pointerdown', unlockFromGesture, true);
  document.addEventListener('keydown', unlockFromGesture, true);
}

/** Start landing-page music immediately when allowed; otherwise on first interaction. */
export function initSetupMusicAutoplay() {
  musicEnabled = true;
  bindGestureFallback();
  enableSetupMusic();
}

export function startSetupMusic() {
  if (!musicEnabled) return;
  ensureSetupMusicPlaying();
}

export function stopSetupMusic() {
  isPlaying = false;

  if (schedulerTimer) {
    clearTimeout(schedulerTimer);
    schedulerTimer = null;
  }

  const audioCtx = getAudioContext();
  if (musicGain && audioCtx) {
    const t = audioCtx.currentTime;
    musicGain.gain.cancelScheduledValues(t);
    musicGain.gain.setValueAtTime(musicGain.gain.value, t);
    musicGain.gain.linearRampToValueAtTime(0, t + 0.4);
    const gain = musicGain;
    window.setTimeout(() => gain.disconnect(), 500);
    musicGain = null;
  }
}
