import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { importCsvText } from '../../src/lib/csv/importFile';
import { toKg } from '../../src/lib/calc/units';
import {
  bestE1rm,
  blankSet,
  entriesFromRoutine,
  entryForExercise,
  exerciseKey,
  maxUpdates,
  nextSet,
  routineEntriesFromDay,
  sessionTotals,
  suggestedWeightKg,
} from '../../src/lib/calc/workout';
import type { ChartData, SessionEntry } from '../../src/lib/types';

const chart: ChartData = {
  sourceScale: 'rpe',
  rpeValues: [10, 9, 8],
  rows: [
    { reps: 1, percents: [1, 0.96, 0.92] },
    { reps: 3, percents: [0.92, 0.88, 0.85] },
    { reps: 5, percents: [0.86, 0.83, 0.8] },
  ],
};

const entry = (over: Partial<SessionEntry> = {}): SessionEntry => ({
  exerciseId: 'back-squat',
  exerciseName: 'Back Squat',
  iconId: 'squat',
  maxKg: 200,
  restSec: 120,
  dropPercent: null,
  note: null,
  sets: [blankSet(5, 8)],
  ...over,
});

describe('exerciseKey', () => {
  it('uses the seed id, or a normalized custom name', () => {
    expect(exerciseKey('bench-press', 'Bench Press')).toBe('bench-press');
    expect(exerciseKey(null, '  Paused   Incline DB ')).toBe('custom:paused incline db');
  });
});

describe('sets', () => {
  it('copies targets and weight to the next set, not its done state', () => {
    expect(nextSet({ reps: 5, rpe: 8, weightKg: 100, done: true })).toEqual({
      reps: 5,
      rpe: 8,
      weightKg: 100,
      done: false,
    });
    expect(nextSet(undefined)).toEqual(blankSet());
  });
});

describe('entryForExercise', () => {
  it('uses seed name and icon', () => {
    const e = entryForExercise({ exerciseId: 'bench-press', name: 'ignored' }, 90, 120);
    expect(e).toMatchObject({
      exerciseName: 'Bench Press',
      iconId: 'bench',
      maxKg: 120,
      restSec: 90,
    });
    expect(e.sets).toHaveLength(1);
  });

  it('keeps custom names and guesses an icon', () => {
    const e = entryForExercise({ exerciseId: null, name: ' Cable Curl ' }, 60, null);
    expect(e).toMatchObject({ exerciseId: null, exerciseName: 'Cable Curl', iconId: 'curl' });
  });
});

describe('suggestedWeightKg', () => {
  it('is PR x chart% at the set reps and RPE, rounded to the plate step', () => {
    // 200 x 0.80 = 160 kg.
    expect(suggestedWeightKg([entry()], 0, 0, chart, 'kg')).toBe(160);
    // 200 x 0.85 = 170 kg at 3 @ 8.
    expect(suggestedWeightKg([entry({ sets: [blankSet(3, 8)] })], 0, 0, chart, 'kg')).toBe(170);
  });

  it('interpolates RPE 8.5 and rounds in pounds', () => {
    const e = entry({ maxKg: toKg(405, 'lb'), sets: [blankSet(5, 8.5)] });
    // 405 lb x 0.815 = 330.1 lb -> 330 lb.
    expect(suggestedWeightKg([e], 0, 0, chart, 'lb')).toBeCloseTo(toKg(330, 'lb'), 9);
  });

  it('is null without a PR, reps, or RPE, or off the chart', () => {
    expect(suggestedWeightKg([entry({ maxKg: null })], 0, 0, chart, 'kg')).toBeNull();
    expect(suggestedWeightKg([entry({ sets: [blankSet(null, 8)] })], 0, 0, chart, 'kg')).toBeNull();
    expect(suggestedWeightKg([entry({ sets: [blankSet(5, null)] })], 0, 0, chart, 'kg')).toBeNull();
    expect(suggestedWeightKg([entry({ sets: [blankSet(12, 8)] })], 0, 0, chart, 'kg')).toBeNull();
  });

  it("suggests a back-off drop from the previous exercise's last set", () => {
    const top = entry({ sets: [{ reps: 3, rpe: 8, weightKg: 180, done: true }] });
    const backoff = entry({ maxKg: null, dropPercent: 15, sets: [blankSet(6, null)] });
    // 180 x 0.85 = 153 -> 152.5 kg.
    expect(suggestedWeightKg([top, backoff], 1, 0, chart, 'kg')).toBe(152.5);
  });

  it("uses the previous set's suggestion when nothing was entered", () => {
    const top = entry({ sets: [blankSet(3, 8)] }); // suggests 170
    const backoff = entry({ maxKg: null, dropPercent: 10, sets: [blankSet(6, null)] });
    expect(suggestedWeightKg([top, backoff], 1, 0, chart, 'kg')).toBe(152.5);
  });
});

describe('totals and maxes', () => {
  const done = entry({
    sets: [
      { reps: 5, rpe: 8, weightKg: 160, done: true },
      { reps: 5, rpe: 9, weightKg: 170, done: true },
      { reps: 5, rpe: 8, weightKg: 160, done: false },
    ],
  });

  it('totals volume and working sets over done sets, and the duration', () => {
    const t = sessionTotals([done], new Date(0), new Date(45 * 60 * 1000));
    expect(t).toEqual({ volumeKg: 1650, setCount: 2, durationSec: 2700 });
  });

  it('finds the best estimated 1RM from done sets', () => {
    // 170 / 0.83 = 204.8; 160 / 0.80 = 200.
    expect(bestE1rm(done, chart)).toBeCloseTo(204.82, 2);
  });

  it('raises a max when a set beats it', () => {
    const updates = maxUpdates([done], chart, () => 200);
    expect(updates).toHaveLength(1);
    expect(updates[0]).toMatchObject({ key: 'back-squat', source: 'session' });
    expect(updates[0].e1rmKg).toBeCloseTo(204.82, 2);
  });

  it('saves an edited PR field, and nothing when unchanged and unbeaten', () => {
    const edited = entry({ maxKg: 210, sets: [blankSet(5, 8)] });
    expect(maxUpdates([edited], chart, () => 200)).toEqual([
      { key: 'back-squat', exerciseName: 'Back Squat', e1rmKg: 210, source: 'manual' },
    ]);
    expect(maxUpdates([entry({ sets: [blankSet(5, 8)] })], chart, () => 200)).toEqual([]);
  });
});

describe('routines from programs', () => {
  const text = readFileSync(
    resolve(process.cwd(), 'tests/fixtures/five-day-split-week1.csv'),
    'utf8',
  );
  const days = importCsvText(text, 'x.csv').days!;

  it('turns a program day into routine entries (lower bounds, drops, notes)', () => {
    const r = routineEntriesFromDay(days[1], 120);
    expect(r[0]).toMatchObject({
      exerciseName: 'comp squat',
      exerciseId: 'back-squat',
      sets: 1,
      reps: 3,
      rpe: 5,
    });
    expect(r[1]).toMatchObject({
      exerciseName: 'pause squat',
      rpe: null,
      dropPercent: 15,
      reps: 6,
    });
    expect(r.every((e) => e.restSec === 120)).toBe(true);
  });

  it('keeps special reps and coach notes as the note', () => {
    const day5 = routineEntriesFromDay(days[4], 90);
    expect(day5.at(-1)).toMatchObject({ exerciseName: 'cable curl', reps: null, note: 'DROPSET' });
    expect(routineEntriesFromDay(days[5], 90)[0].note).toBe('7.5kg');
  });

  it('expands routine entries into a workout with the stored maxes', () => {
    const entries = entriesFromRoutine(routineEntriesFromDay(days[0], 90), (key) =>
      key === 'bench-press' ? 140 : null,
    );
    expect(entries[0]).toMatchObject({ exerciseName: 'Comp Bench', maxKg: 140 });
    expect(entries[0].sets).toEqual([blankSet(3, 5), blankSet(3, 5), blankSet(3, 5)]);
    expect(entries[2].maxKg).toBeNull();
  });
});

describe('sortRoutines', () => {
  it('puts the newest first and orders a same-time import by day', async () => {
    const { sortRoutines } = await import('../../src/lib/db/routines');
    const { Timestamp } = await import('firebase/firestore');
    const t = (ms: number) => Timestamp.fromMillis(ms);
    const sorted = sortRoutines([
      { name: 'Split · Week 1 Day 5', updatedAt: t(100) },
      { name: 'Split · Week 1 Day 10', updatedAt: t(100) },
      { name: 'Push Day', updatedAt: t(200) },
      { name: 'Split · Week 1 Day 2', updatedAt: t(100) },
    ]);
    expect(sorted.map((r) => r.name)).toEqual([
      'Push Day',
      'Split · Week 1 Day 2',
      'Split · Week 1 Day 5',
      'Split · Week 1 Day 10',
    ]);
  });
});
