import { describe, expect, it } from 'vitest';
import { e1rm } from '../../src/lib/calc/e1rm';

describe('e1rm (Epley)', () => {
  it('returns the weight itself for a single', () => {
    expect(e1rm(100, 1)).toBe(100);
  });

  it('applies weight * (1 + reps / 30) for 2..12 reps', () => {
    expect(e1rm(100, 5)).toBeCloseTo(116.6667, 4);
    expect(e1rm(100, 10)).toBeCloseTo(133.3333, 4);
    expect(e1rm(60, 12)).toBeCloseTo(84, 10);
  });

  it('returns null above 12 reps', () => {
    expect(e1rm(100, 13)).toBeNull();
  });

  it('returns null for zero, negative, or fractional reps', () => {
    expect(e1rm(100, 0)).toBeNull();
    expect(e1rm(100, -3)).toBeNull();
    expect(e1rm(100, 2.5)).toBeNull();
  });

  it('returns null for non-positive or non-finite weight', () => {
    expect(e1rm(0, 5)).toBeNull();
    expect(e1rm(-20, 5)).toBeNull();
    expect(e1rm(Number.NaN, 5)).toBeNull();
  });
});
