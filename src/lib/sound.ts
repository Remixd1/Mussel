/**
 * Short lab beeps via Web Audio (CLAUDE.md §3.8): no audio files. Off unless
 * the profile's sound setting is on; callers check that.
 *
 * iOS only lets audio start after a user gesture, so the context is created
 * (and resumed) on the first cue, which is always a tap ("set done"). Later
 * cues that fire without a gesture, like the end of a rest, then play too.
 */

export type Cue = 'set' | 'rest';

interface Tone {
  freq: number;
  /** Start offset in seconds. */
  at: number;
  dur: number;
}

export const CUES: Record<Cue, Tone[]> = {
  set: [{ freq: 880, at: 0, dur: 0.09 }],
  rest: [
    { freq: 660, at: 0, dur: 0.14 },
    { freq: 990, at: 0.18, dur: 0.2 },
  ],
};

type AudioCtor = typeof AudioContext;

let ctx: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (ctx) return ctx;
  const w = globalThis as unknown as { AudioContext?: AudioCtor; webkitAudioContext?: AudioCtor };
  const Ctor = w.AudioContext ?? w.webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
  } catch {
    return null;
  }
  return ctx;
}

/** Plays a cue. Never throws; silently does nothing where audio isn't available. */
export function playCue(cue: Cue): void {
  const ac = audioContext();
  if (!ac) return;
  try {
    if (ac.state === 'suspended') void ac.resume().catch(() => undefined);
    const start = ac.currentTime + 0.01;
    for (const t of CUES[cue]) {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'square';
      osc.frequency.value = t.freq;
      // Quick fade in/out so the square wave doesn't click.
      gain.gain.setValueAtTime(0, start + t.at);
      gain.gain.linearRampToValueAtTime(0.08, start + t.at + 0.01);
      gain.gain.setValueAtTime(0.08, start + t.at + t.dur - 0.02);
      gain.gain.linearRampToValueAtTime(0, start + t.at + t.dur);
      osc.connect(gain).connect(ac.destination);
      osc.start(start + t.at);
      osc.stop(start + t.at + t.dur + 0.02);
    }
  } catch {
    // Audio is a nicety; never break logging over it.
  }
}

/** Vibrates where supported (Android). iOS has no vibrate and is skipped. */
export function buzz(pattern: number | number[]): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // Some browsers throw when vibration is blocked; ignore.
  }
}

/** Test hook: forget the cached audio context. */
export function resetAudioForTests(): void {
  ctx = null;
}
