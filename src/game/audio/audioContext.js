let ctx = null;

export function getAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

export function isAudioRunning() {
  const audioCtx = getAudioContext();
  return audioCtx?.state === 'running';
}

/**
 * Resume audio in the same call stack as a user gesture (required on mobile Safari).
 * Returns a promise that resolves when the context is running.
 */
export function unlockAudio() {
  const audioCtx = getAudioContext();
  if (!audioCtx) return Promise.resolve(false);
  if (audioCtx.state === 'running') return Promise.resolve(true);
  if (audioCtx.state === 'suspended') {
    return audioCtx.resume().then(() => audioCtx.state === 'running').catch(() => false);
  }
  return Promise.resolve(false);
}

/** Synchronous unlock — call directly inside click/pointerdown handlers. */
export function unlockAudioSync() {
  const audioCtx = getAudioContext();
  if (!audioCtx) return false;
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx.state === 'running';
}

/** Call from any user-gesture handler (pointer/keyboard) to unlock all game audio. */
export function unlockAudioFromUserGesture() {
  return unlockAudioSync() || unlockAudio();
}

export function bindGlobalAudioUnlock() {
  const unlock = () => {
    unlockAudioSync();
  };

  document.addEventListener('pointerdown', unlock, true);
  document.addEventListener('keydown', unlock, true);
}
