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
  weightKg,
  done: true,
  isWarmup: false,
  ...extra,
});

const entry = (
  sets: SetRow[],
  trackingType: SessionEntry['trackingType'] = 'weight_reps',
): SessionEntry => ({
  exerciseId: 'back-squat',
  exerciseName: 'Back Squat',
  iconId: 'squat',
  trackingType,
  sets,
});

describe('volume', () => {
  it('sums reps * weight over done, non-warmup sets', () => {
    expect(entryVolumeKg(entry([set(5, 100), set(5, 100), set(3, 110)]))).toBe(1330);
  });

  it('ignores warmups', () => {
    expect(entryVolumeKg(entry([set(5, 60, { isWarmup: true }), set(5, 100)]))).toBe(500);
  });

  it('ignores sets not marked done', () => {
    expect(entryVolumeKg(entry([set(5, 100, { done: false }), set(5, 100)]))).toBe(500);
  });

  it('only counts weight_reps entries', () => {
    expect(entryVolumeKg(entry([set(10, 0)], 'reps_only'))).toBe(0);
    expect(
      entryVolumeKg(entry([{ durationSec: 60, done: true, isWarmup: false }], 'duration')),
    ).toBe(0);
  });

  it('treats missing reps or weight as zero', () => {
    expect(entryVolumeKg(entry([{ reps: 5, done: true, isWarmup: false }]))).toBe(0);
  });

  it('sums across a session', () => {
    const entries = [entry([set(5, 100)]), entry([set(8, 50)]), entry([set(20, 0)], 'reps_only')];
    expect(sessionVolumeKg(entries)).toBe(900);
  });

  it('counts working sets of every tracking type', () => {
    const entries = [
      entry([set(5, 100), set(5, 60, { isWarmup: true })]),
      entry([set(10, 0), set(10, 0, { done: false })], 'reps_only'),
    ];
    expect(workingSetCount(entries)).toBe(2);
    expect(isWorkingSet(set(1, 1, { done: true, isWarmup: true }))).toBe(false);
  });
});
