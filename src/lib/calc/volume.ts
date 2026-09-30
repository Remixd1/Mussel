import type { SessionEntry, SetRow } from '../types';

/** A set counts toward volume and estimated maxes only if completed and not a warmup. */
export function isWorkingSet(set: SetRow): boolean {
  return set.done && !set.isWarmup;
}

/** Sum of reps * weightKg over working sets. Unweighted sets contribute 0. */
export function entryVolumeKg(entry: SessionEntry): number {
  return entry.sets.reduce(
    (sum, set) => (isWorkingSet(set) ? sum + (set.reps ?? 0) * (set.weightKg ?? 0) : sum),
    0,
  );
}

export function sessionVolumeKg(entries: readonly SessionEntry[]): number {
  return entries.reduce((sum, entry) => sum + entryVolumeKg(entry), 0);
}

export function workingSetCount(entries: readonly SessionEntry[]): number {
  return entries.reduce((n, entry) => n + entry.sets.filter(isWorkingSet).length, 0);
}
