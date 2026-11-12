import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';
import {
  applyMemory,
  blankSet,
  effortKey,
  entriesFromRoutine,
  entryForExercise,
  memoryFromEntry,
} from '../../src/lib/calc/workout';
import type { ExerciseMemory, RoutineEntry, SessionEntry, SetRow } from '../../src/lib/types';

const set = (reps: number | null, rpe: number | null, weightKg: number | null, done = true) =>
  ({ reps, rpe, weightKg, done }) as SetRow;

const entry = (sets: SetRow[], over: Partial<SessionEntry> = {}): SessionEntry => ({
  exerciseId: 'bench-press',
  exerciseName: 'Bench Press',
  iconId: 'bench',
  maxKg: 120,
  restSec: 90,
  dropPercent: null,
  note: null,
  sets,
  ...over,
});

const memory = (m: Partial<ExerciseMemory>): ExerciseMemory => ({
  exerciseName: 'Bench Press',
  lastSets: [],
  weightByEffort: {},
  updatedAt: Timestamp.fromMillis(0),
  ...m,
});

describe('effortKey', () => {
  it('keys reps + RPE without dots', () => {
    expect(effortKey(5, 8)).toBe('5x80');
    expect(effortKey(3, 8.5)).toBe('3x85');
  });
});

describe('memoryFromEntry', () => {
  it('remembers completed sets and the weight per reps + RPE', () => {
    const mem = memoryFromEntry(
      entry([set(5, 8, 100), set(5, 8, 102.5), set(8, null, 80), set(5, 8, 110, false)]),
    );
    expect(mem?.lastSets).toEqual([
      { reps: 5, rpe: 8, weightKg: 100 },
      { reps: 5, rpe: 8, weightKg: 102.5 },
      { reps: 8, rpe: null, weightKg: 80 },
    ]);
    // Latest completed set at 5 @ 8 wins; the unticked 110 is ignored.
    expect(mem?.weightByEffort).toEqual({ '5x80': 102.5 });
  });

  it('remembers nothing when no set was completed', () => {
    expect(memoryFromEntry(entry([set(5, 8, 100, false)]))).toBeNull();
  });
});

describe('applyMemory', () => {
  it('fills the weight used last time at the same reps + RPE', () => {
    const e = applyMemory(
      entry([blankSet(5, 8), blankSet(3, 9)]),
      memory({ weightByEffort: { '5x80': 100 } }),
    );
    expect(e.sets.map((s) => s.weightKg)).toEqual([100, null]);
  });

  it('fills reps and weights from last time for sets without RPE', () => {
    const e = applyMemory(
      entry([blankSet(null, null), blankSet(10, null), blankSet(null, null)]),
      memory({
        lastSets: [
          { reps: 12, rpe: null, weightKg: 20 },
          { reps: 10, rpe: null, weightKg: 22.5 },
        ],
      }),
    );
    expect(e.sets.map((s) => [s.reps, s.weightKg])).toEqual([
      [12, 20],
      [10, 22.5],
      [10, 22.5], // more sets than last time: repeat the last one
    ]);
    expect(e.sets.every((s) => !s.done)).toBe(true);
  });

  it("brings back last time's sets for a freshly added exercise", () => {
    const e = applyMemory(
      entry([blankSet()]),
      memory({
        lastSets: [
          { reps: 5, rpe: 8, weightKg: 100 },
          { reps: 5, rpe: 8, weightKg: 100 },
        ],
      }),
    );
    expect(e.sets).toEqual([set(5, 8, 100, false), set(5, 8, 100, false)]);
  });

  it('leaves entered weights and back-off entries alone', () => {
    const typed = applyMemory(
      entry([set(5, 8, 90, false)]),
      memory({ weightByEffort: { '5x80': 100 } }),
    );
    expect(typed.sets[0].weightKg).toBe(90);
    const backoff = entry([blankSet(6, null)], { dropPercent: 15 });
    expect(applyMemory(backoff, memory({ lastSets: [{ reps: 6, rpe: null, weightKg: 70 }] }))).toBe(
      backoff,
    );
  });

  it('does nothing without memory', () => {
    const e = entry([blankSet(5, 8)]);
    expect(applyMemory(e, undefined)).toBe(e);
  });
});

describe('building workouts with memory', () => {
  const routine: RoutineEntry[] = [
    {
      exerciseId: 'bench-press',
      exerciseName: 'Bench Press',
      iconId: 'bench',
      sets: 2,
      reps: 5,
      rpe: 8,
      restSec: 120,
      dropPercent: null,
      note: null,
    },
    {
      exerciseId: null,
      exerciseName: 'Cable Curl',
      iconId: 'curl',
      sets: 2,
      reps: null,
      rpe: null,
      restSec: 60,
      dropPercent: null,
      note: null,
    },
  ];
  const mems: Record<string, ExerciseMemory> = {
    'bench-press': memory({ weightByEffort: { '5x80': 100 } }),
    'custom:cable curl': memory({
      exerciseName: 'Cable Curl',
      lastSets: [{ reps: 12, rpe: null, weightKg: 25 }],
    }),
  };

  it('prefills routine and program days', () => {
    const entries = entriesFromRoutine(
      routine,
      () => 120,
      (k) => mems[k],
    );
    expect(entries[0].sets.map((s) => s.weightKg)).toEqual([100, 100]);
    expect(entries[1].sets.map((s) => [s.reps, s.weightKg])).toEqual([
      [12, 25],
      [12, 25],
    ]);
    expect(entries[0].maxKg).toBe(120);
  });

  it('prefills an exercise added from the picker', () => {
    const e = entryForExercise(
      { exerciseId: null, name: 'Cable Curl' },
      60,
      null,
      mems['custom:cable curl'],
    );
    expect(e.sets).toEqual([set(12, null, 25, false)]);
  });
});
