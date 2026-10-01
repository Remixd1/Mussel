import { describe, expect, it } from 'vitest';
import { dayElapsed, weekElapsed } from '../../src/lib/calc/time';

describe('dayElapsed', () => {
  it('is 0 at midnight and 0.5 at noon', () => {
    expect(dayElapsed(new Date(2026, 8, 30, 0, 0, 0))).toBe(0);
    expect(dayElapsed(new Date(2026, 8, 30, 12, 0, 0))).toBe(0.5);
  });

  it('approaches 1 just before midnight', () => {
    expect(dayElapsed(new Date(2026, 8, 30, 23, 59, 59))).toBeCloseTo(1, 4);
  });
});

describe('weekElapsed', () => {
  it('starts the week on Monday', () => {
    // 2026-09-28 is a Monday.
    expect(weekElapsed(new Date(2026, 8, 28, 0, 0, 0))).toBe(0);
  });

  it('is halfway at Thursday noon', () => {
    expect(weekElapsed(new Date(2026, 9, 1, 12, 0, 0))).toBeCloseTo(0.5, 6);
  });

  it('treats Sunday as the end of the week', () => {
    expect(weekElapsed(new Date(2026, 9, 4, 23, 59, 59))).toBeCloseTo(1, 4);
  });
});
