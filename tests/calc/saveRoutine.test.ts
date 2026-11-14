import { describe, expect, it } from 'vitest';
import { nextRoutineName, routineEntriesFromSession } from '../../src/lib/calc/workout';
import type { SessionEntry, SetRow } from '../../src/lib/types';

const set = (reps: number | null, rpe: number | null, weightKg: number | null, done = true) =>
  ({ reps, rpe, weightKg, done }) as SetRow;

const entry = (sets: SetRow[], over: Partial<SessionEntry> = {}): SessionEntry => ({
  exerciseId: 'bench-press',
  exerciseName: 'Bench Press',
  iconId: 'bench',
  maxKg: 120,
  restSec: 150,
  dropPercent: null,
  note: 'pause reps',
  sets,
  ...over,
});

describe('routineEntriesFromSession', () => {
  it('keeps exercises, set counts, rest, notes and back-offs', () => {
    const out = routineEntriesFromSession([
      entry([set(5, 8, 100), set(5, 8, 100), set(5, 8, 100, false)]),
      entry([set(8, null, 70)], {
        exerciseId: null,
        exerciseName: 'Back-off Bench',
        dropPercent: 15,
        note: null,
        restSec: 90,
      }),
    ]);
    expect(out).toEqual([
      {
        exerciseId: 'bench-press',
        exerciseName: 'Bench Press',
        iconId: 'bench',
        sets: 3,
        reps: 5,
        rpe: 8,
        restSec: 150,
        dropPercent: null,
        note: 'pause reps',
      },
      {
        exerciseId: null,
        exerciseName: 'Back-off Bench',
        iconId: 'bench',
        sets: 1,
        reps: 8,
        rpe: null,
        restSec: 90,
        dropPercent: 15,
        note: null,
      },
    ]);
  });

  it('takes reps and RPE from a completed set first', () => {
    const [e] = routineEntriesFromSession([entry([set(10, null, null, false), set(6, 9, 90)])]);
    expect([e.reps, e.rpe]).toEqual([6, 9]);
  });

  it('keeps an exercise with no sets as one set', () => {
    const [e] = routineEntriesFromSession([entry([])]);
    expect(e).toMatchObject({ sets: 1, reps: null, rpe: null });
  });
});

describe('nextRoutineName', () => {
  it('starts at Routine 1', () => {
    expect(nextRoutineName([])).toBe('Routine 1');
    expect(nextRoutineName(['Push Day', 'Leg Day'])).toBe('Routine 1');
  });

  it('goes one past the highest Routine N', () => {
    expect(nextRoutineName(['Routine 1', 'routine 2', 'Push Day'])).toBe('Routine 3');
    expect(nextRoutineName(['Routine 4'])).toBe('Routine 5');
    expect(nextRoutineName(['Routine 2b', 'My Routine 7'])).toBe('Routine 1');
  });
});
