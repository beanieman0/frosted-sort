import { Audio } from 'expo-av';

// We use short, synthesized base64-encoded WAV tones as sounds
// so the app has zero external dependencies for audio.
// These are minimal beep/click/chime sounds generated procedurally.

let pourSound: Audio.Sound | null = null;
let winSound: Audio.Sound | null = null;
let tapSound: Audio.Sound | null = null;

// Expo Audio requires files, so we use short web Audio API synthesis on web
// and expo-av on native. This utility abstracts both.

function playWebTone(frequency: number, duration: number, type: OscillatorType = 'sine', gain: number = 0.15) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    // Soft fade-in and fade-out to avoid "clicking" sound artifacts
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (_e) {
    // Silently ignore if audio is not available
  }
}

/**
 * Plays a satisfying low "glug" sound when liquid is poured.
 * Descending frequency gives it that "liquid filling" feel.
 */
export function playPourSound() {
  playWebTone(350, 0.15, 'sine', 0.12);
  // A quick second tone offset gives a "thicker liquid" feel
  setTimeout(() => playWebTone(300, 0.1, 'sine', 0.07), 80);
}

/**
 * Plays a soft, satisfying UI tap (when selecting a tube).  
 */
export function playTapSound() {
  playWebTone(600, 0.08, 'triangle', 0.08);
}

/**
 * Plays a pleasant multi-note win chime.
 */
export function playWinSound() {
  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6 - a C major chord
  notes.forEach((freq, i) => {
    setTimeout(() => playWebTone(freq, 0.4, 'sine', 0.12), i * 120);
  });
}
