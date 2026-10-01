import { describe, expect, it } from 'vitest';
import {
  entryVolumeKg,
  isWorkingSet,
  sessionVolumeKg,
  workingSetCount,
} from '../../src/lib/calc/volume';
import type { SessionEntry, SetRow } from '../../src/lib/types';

const set = (reps: number, weightKg: number, extra: Partial<SetRow> = {}): SetRow => ({
  reps,
  rpe: null,
  weightKg,
  done: true,
  ...extra,
});

const entry = (sets: SetRow[]): SessionEntry => ({
  exerciseId: 'back-squat',
  exerciseName: 'Back Squat',
  iconId: 'squat',
  maxKg: null,
  restSec: 90,
  dropPercent: null,
  note: null,
  sets,
});

describe('volume', () => {
  it('sums reps * weight over done sets', () => {
    expect(entryVolumeKg(entry([set(5, 100), set(5, 100), set(3, 110)]))).toBe(1330);
  });

  it('ignores sets not marked done', () => {
    expect(entryVolumeKg(entry([set(5, 100, { done: false }), set(5, 100)]))).toBe(500);
  });

  it('treats missing reps or weight as zero (e.g. bodyweight sets)', () => {
    expect(entryVolumeKg(entry([set(10, 0, { weightKg: null })]))).toBe(0);
    expect(entryVolumeKg(entry([set(0, 50, { reps: null })]))).toBe(0);
  });

  it('sums across a session', () => {
    expect(sessionVolumeKg([entry([set(5, 100)]), entry([set(8, 50)])])).toBe(900);
  });

  it('counts working sets', () => {
    expect(workingSetCount([entry([set(5, 100), set(5, 60, { done: false })])])).toBe(1);
    expect(isWorkingSet(set(1, 1, { done: false }))).toBe(false);
  });
});
