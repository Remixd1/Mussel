/**
 * Pure workout logic (CLAUDE.md §5.3): building entries from routines and
 * program days, suggested weights from the PR + chart, totals, and maxes.
 */
import { iconForExercise, matchExercise, SEED_EXERCISES } from '../../data/exercises';
import type {
  ChartData,
  ProgramDay,
  RoutineEntry,
  SessionEntry,
  SessionTotals,
  SetRow,
  Units,
} from '../types';
import { e1rmFromSet, targetWeightKg } from './effort';
import { fromKg, toKg, WEIGHT_STEP } from './units';

/** Key into users/{uid}/maxes: the seed id, or "custom:" + lowercased name. */
export function exerciseKey(exerciseId: string | null, name: string): string {
  return exerciseId ?? `custom:${name.trim().toLowerCase().replace(/\s+/g, ' ')}`;
}

export function blankSet(reps: number | null = null, rpe: number | null = null): SetRow {
  return { reps, rpe, weightKg: null, done: false };
}

/** A new set copying the previous one's targets and weight (not its done state). */
export function nextSet(prev: SetRow | undefined): SetRow {
  return prev
    ? { reps: prev.reps, rpe: prev.rpe, weightKg: prev.weightKg, done: false }
    : blankSet();
}

/** An entry for an exercise picked from the seed list or typed as a custom name. */
export function entryForExercise(
  pick: { exerciseId: string | null; name: string },
  restSec: number,
  maxKg: number | null,
): SessionEntry {
  const seed = pick.exerciseId ? SEED_EXERCISES.find((e) => e.id === pick.exerciseId) : undefined;
  return {
    exerciseId: seed?.id ?? null,
    exerciseName: seed?.name ?? pick.name.trim(),
    iconId: seed?.icon ?? iconForExercise(pick.name),
    maxKg,
    restSec,
    dropPercent: null,
    note: null,
    sets: [blankSet()],
  };
}

export function entriesFromRoutine(
  entries: readonly RoutineEntry[],
  maxFor: (key: string) => number | null,
): SessionEntry[] {
  return entries.map((r) => ({
    exerciseId: r.exerciseId,
    exerciseName: r.exerciseName,
    iconId: r.iconId,
    maxKg: maxFor(exerciseKey(r.exerciseId, r.exerciseName)),
    restSec: r.restSec,
    dropPercent: r.dropPercent,
    note: r.note,
    sets: Array.from({ length: Math.max(1, r.sets) }, () => blankSet(r.reps, r.rpe)),
  }));
}

/** A program day as routine entries (reps and RPE ranges take their lower bound). */
export function routineEntriesFromDay(day: ProgramDay, restSec: number): RoutineEntry[] {
  return day.exercises.map((e) => {
    const p = e.prescription;
    return {
      exerciseId: e.exerciseId ?? matchExercise(e.name),
      exerciseName: e.name,
      iconId: e.iconId,
      sets: e.sets,
      reps: e.reps?.min ?? null,
      rpe: p.kind === 'rpe' ? p.min : null,
      restSec,
      dropPercent: p.kind === 'percentDrop' ? p.percent : null,
      note:
        [e.repsText && !e.reps ? e.repsText : '', e.note ?? ''].filter(Boolean).join(' · ') || null,
    };
  });
}

/** Round kg to the plate step of the display unit. */
function roundToStep(kg: number, unit: Units): number {
  const step = WEIGHT_STEP[unit];
  return toKg(Math.round(fromKg(kg, unit) / step) * step, unit);
}

/** The weight a set would use: what's entered, else its suggestion. */
export function effectiveWeight(
  entries: readonly SessionEntry[],
  ei: number,
  si: number,
  chart: ChartData,
  unit: Units,
): number | null {
  return entries[ei].sets[si]?.weightKg ?? suggestedWeightKg(entries, ei, si, chart, unit);
}

/**
 * Suggested weight for a set: PR x chart% at its reps and RPE, rounded to the
 * plate step. A back-off entry ("-15%") suggests that drop from the previous
 * exercise's last set instead. null when there isn't enough to go on.
 */
export function suggestedWeightKg(
  entries: readonly SessionEntry[],
  ei: number,
  si: number,
  chart: ChartData,
  unit: Units,
): number | null {
  const entry = entries[ei];
  const set = entry?.sets[si];
  if (!set) return null;

  if (entry.dropPercent != null) {
    const prev = entries[ei - 1];
    if (!prev?.sets.length) return null;
    const base = effectiveWeight(entries, ei - 1, prev.sets.length - 1, chart, unit);
    return base == null ? null : roundToStep(base * (1 - entry.dropPercent / 100), unit);
  }
  if (entry.maxKg == null || set.reps == null || set.rpe == null) return null;
  return targetWeightKg(entry.maxKg, chart, set.reps, set.rpe, unit);
}

export function sessionTotals(
  entries: readonly SessionEntry[],
  startedAt: Date,
  endedAt: Date,
): SessionTotals {
  let volumeKg = 0;
  let setCount = 0;
  for (const e of entries) {
    for (const s of e.sets) {
      if (!s.done) continue;
      setCount++;
      volumeKg += (s.reps ?? 0) * (s.weightKg ?? 0);
    }
  }
  return {
    volumeKg,
    setCount,
    durationSec: Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 1000)),
  };
}

/** Best chart-estimated 1RM from an entry's completed sets. */
export function bestE1rm(entry: SessionEntry, chart: ChartData): number | null {
  let best: number | null = null;
  for (const s of entry.sets) {
    if (!s.done || s.reps == null || s.rpe == null || s.weightKg == null) continue;
    const est = e1rmFromSet(chart, s.weightKg, s.reps, s.rpe);
    if (est != null && (best == null || est > best)) best = est;
  }
  return best;
}

export interface MaxUpdate {
  key: string;
  exerciseName: string;
  e1rmKg: number;
  source: 'manual' | 'session';
}

/**
 * Maxes to save on finish: an edited PR field is saved as entered; a
 * completed set whose estimated 1RM beats the PR raises it.
 */
export function maxUpdates(
  entries: readonly SessionEntry[],
  chart: ChartData,
  storedMax: (key: string) => number | null,
): MaxUpdate[] {
  const out = new Map<string, MaxUpdate>();
  for (const e of entries) {
    const key = exerciseKey(e.exerciseId, e.exerciseName);
    const stored = storedMax(key);
    let value = stored;
    let source: MaxUpdate['source'] | null = null;
    if (e.maxKg != null && e.maxKg !== stored) {
      value = e.maxKg;
      source = 'manual';
    }
    const best = bestE1rm(e, chart);
    if (best != null && best > (value ?? 0) + 1e-9) {
      value = best;
      source = 'session';
    }
    if (source && value != null) {
      const prev = out.get(key);
      if (!prev || value > prev.e1rmKg)
        out.set(key, { key, exerciseName: e.exerciseName, e1rmKg: value, source });
    }
  }
  return [...out.values()];
}
