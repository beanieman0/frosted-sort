/**
 * Web Audio API sound utility for ASMR-style game sounds.
 * Volume is controlled by the soundVolume setting (0–1).
 * All sounds use soft fade-in/fade-out to avoid annoying clicks.
 */

let _volume = 0.6; // default until settings context updates it

export function setSoundSystemVolume(v: number) {
  _volume = v;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  gainMultiplier: number = 1.0
) {
  if (_volume === 0) return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    const peakGain = _volume * gainMultiplier * 0.18;
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(peakGain, ctx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration + 0.05);
  } catch (_e) {
    // Silently ignore if AudioContext is unavailable
  }
}

/** Soft descending "glug" for pouring liquid */
export function playPourSound() {
  playTone(350, 0.15, 'sine', 0.7);
  setTimeout(() => playTone(300, 0.1, 'sine', 0.4), 80);
}

/** Soft click for selecting a tube */
export function playTapSound() {
  playTone(600, 0.08, 'triangle', 0.45);
}

/** Pleasant C-major chord arpeggio for winning */
export function playWinSound() {
  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.4, 'sine', 0.65), i * 120);
  });
}
