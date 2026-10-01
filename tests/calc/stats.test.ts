import { describe, expect, it } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { weekStats } from '../../src/lib/calc/stats';

const s = (date: Date, volumeKg: number, setCount: number) => ({
  startedAt: Timestamp.fromDate(date),
  totals: { volumeKg, setCount, durationSec: 0 },
});

describe('weekStats', () => {
  // Thursday 1 Oct 2026; the week started Monday 28 Sep.
  const now = new Date(2026, 9, 1, 18, 0);

  it('counts only this Monday-to-Sunday week', () => {
    const stats = weekStats(
      [
        s(new Date(2026, 8, 28, 7), 1000, 10),
        s(new Date(2026, 9, 1, 7), 500, 5),
        s(new Date(2026, 8, 27, 20), 9999, 99), // last Sunday
      ],
      now,
    );
    expect(stats).toMatchObject({ workouts: 2, volumeKg: 1500, sets: 15 });
  });

  it('reports the most recent workout, even from earlier weeks', () => {
    expect(weekStats([s(new Date(2026, 8, 20), 1, 1)], now).lastWorkout).toEqual(
      new Date(2026, 8, 20),
    );
    expect(weekStats([], now).lastWorkout).toBeNull();
  });
});
