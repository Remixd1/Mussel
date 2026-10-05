import { afterEach, describe, expect, it, vi } from 'vitest';
import { buzz, CUES, playCue, resetAudioForTests } from '../../src/lib/sound';

/** Minimal AudioContext that records each oscillator's settings. */
function fakeAudio() {
  const oscillators: { type: string; freq: number; start: number }[] = [];
  const resume = vi.fn(async () => undefined);
  class FakeContext {
    state = 'suspended';
    currentTime = 1;
    destination = {};
    resume = resume;
    createOscillator() {
      const rec = { type: '', freq: 0, start: 0 };
      oscillators.push(rec);
      return {
        set type(v: string) {
          rec.type = v;
        },
        frequency: {
          set value(v: number) {
            rec.freq = v;
          },
        },
        connect: (node: unknown) => node,
        start: (t: number) => {
          rec.start = t;
        },
        stop: () => undefined,
      };
    }
    createGain() {
      return {
        gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
        connect: () => ({}),
      };
    }
  }
  return { FakeContext, oscillators, resume };
}

afterEach(() => {
  resetAudioForTests();
  vi.unstubAllGlobals();
});

describe('playCue', () => {
  it('plays a square-wave beep per tone, in order, and resumes a suspended context', () => {
    const { FakeContext, oscillators, resume } = fakeAudio();
    vi.stubGlobal('AudioContext', FakeContext);
    playCue('rest');
    expect(oscillators.map((o) => o.freq)).toEqual(CUES.rest.map((t) => t.freq));
    expect(oscillators.every((o) => o.type === 'square')).toBe(true);
    expect(oscillators[1].start).toBeGreaterThan(oscillators[0].start);
    expect(resume).toHaveBeenCalled();
  });

  it('does nothing where Web Audio is missing', () => {
    vi.stubGlobal('AudioContext', undefined);
    expect(() => playCue('set')).not.toThrow();
  });
});

describe('buzz', () => {
  it('vibrates where supported', () => {
    const vibrate = vi.fn(() => true);
    vi.stubGlobal('navigator', { vibrate });
    buzz([200, 100, 200]);
    expect(vibrate).toHaveBeenCalledWith([200, 100, 200]);
  });

  it('is silent without vibrate (iOS) and when vibrate throws', () => {
    vi.stubGlobal('navigator', { userAgent: 'iPhone' });
    expect(() => buzz(200)).not.toThrow();
    vi.stubGlobal('navigator', {
      vibrate: () => {
        throw new Error('blocked');
      },
    });
    expect(() => buzz(200)).not.toThrow();
  });
});
