import { describe, expect, it } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import {
  editRoutineEntry,
  entriesFromRoutine,
  nextRoutineName,
  routineEntriesFromSession,
} from '../../src/lib/calc/workout';
import type { ExerciseMemory, RoutineEntry, SessionEntry, SetRow } from '../../src/lib/types';

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
        setRows: [
          { reps: 5, rpe: 8, weightKg: 100 },
          { reps: 5, rpe: 8, weightKg: 100 },
          { reps: 5, rpe: 8, weightKg: 100 },
        ],
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
        setRows: [{ reps: 8, rpe: null, weightKg: 70 }],
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

describe('starting a routine saved from a workout', () => {
  const saved = routineEntriesFromSession([
    entry([set(5, 8, 100), set(5, 8, 105), set(3, 9, 110)]),
    entry([set(12, null, 20), set(10, null, 22.5)], {
      exerciseId: null,
      exerciseName: 'Cable Curl',
      iconId: 'curl',
    }),
  ]);
  const savedAt = 1_000_000;
  const mem = (m: Partial<ExerciseMemory>, at: number): ExerciseMemory => ({
    exerciseName: 'Bench Press',
    lastSets: [],
    weightByEffort: {},
    updatedAt: Timestamp.fromMillis(at),
    ...m,
  });

  it('brings back every set with its own reps, RPE and weight', () => {
    const [bench, curl] = entriesFromRoutine(
      saved,
      () => 120,
      () => undefined,
      savedAt,
    );
    expect(bench.sets).toEqual([
      set(5, 8, 100, false),
      set(5, 8, 105, false),
      set(3, 9, 110, false),
    ]);
    expect(curl.sets).toEqual([set(12, null, 20, false), set(10, null, 22.5, false)]);
    expect(bench.maxKg).toBe(120);
  });

  it('keeps the routine weights over older remembered lifts', () => {
    const old = mem({ weightByEffort: { '5x80': 90, '3x90': 95 } }, savedAt - 1);
    const [bench] = entriesFromRoutine(
      saved,
      () => null,
      (k) => (k === 'bench-press' ? old : undefined),
      savedAt,
    );
    expect(bench.sets.map((s) => s.weightKg)).toEqual([100, 105, 110]);
  });

  it('uses newer remembered lifts, falling back to the routine where they have none', () => {
    const newer = mem({ weightByEffort: { '5x80': 107.5 } }, savedAt + 1);
    const [bench] = entriesFromRoutine(
      saved,
      () => null,
      (k) => (k === 'bench-press' ? newer : undefined),
      savedAt,
    );
    expect(bench.sets.map((s) => s.weightKg)).toEqual([107.5, 107.5, 110]);
  });

  it('leaves back-off weights blank so the drop is suggested', () => {
    const [b] = entriesFromRoutine(
      routineEntriesFromSession([entry([set(8, null, 70)], { dropPercent: 15 })]),
      () => null,
    );
    expect(b.sets).toEqual([set(8, null, null, false)]);
  });

  it('still builds hand-made routines from sets x reps @ RPE', () => {
    const plain: RoutineEntry = { ...saved[0], setRows: undefined, sets: 2, reps: 6, rpe: 7 };
    const [e] = entriesFromRoutine([plain], () => null);
    expect(e.sets).toEqual([set(6, 7, null, false), set(6, 7, null, false)]);
  });
});

describe('editRoutineEntry', () => {
  const [bench] = routineEntriesFromSession([entry([set(5, 8, 100), set(3, 9, 110)])]);

  it('adds sets by repeating the last saved set, and trims them', () => {
    expect(editRoutineEntry(bench, { sets: 3 }).setRows).toEqual([
      { reps: 5, rpe: 8, weightKg: 100 },
      { reps: 3, rpe: 9, weightKg: 110 },
      { reps: 3, rpe: 9, weightKg: 110 },
    ]);
    expect(editRoutineEntry(bench, { sets: 1 }).setRows).toEqual([
      { reps: 5, rpe: 8, weightKg: 100 },
    ]);
  });

  it('applies a new reps or RPE value to every set and keeps weights', () => {
    const e = editRoutineEntry(editRoutineEntry(bench, { reps: 4 }), { rpe: 7.5 });
    expect(e.setRows).toEqual([
      { reps: 4, rpe: 7.5, weightKg: 100 },
      { reps: 4, rpe: 7.5, weightKg: 110 },
    ]);
    expect([e.reps, e.rpe]).toEqual([4, 7.5]);
  });

  it('leaves rest edits and hand-made routines alone', () => {
    expect(editRoutineEntry(bench, { restSec: 60 }).setRows).toEqual(bench.setRows);
    const plain: RoutineEntry = { ...bench, setRows: undefined };
    expect(editRoutineEntry(plain, { sets: 4 })).toEqual({ ...plain, sets: 4 });
  });
});
