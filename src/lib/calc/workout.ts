/**
 * Pure workout logic (CLAUDE.md §5.3): building entries from routines and
 * program days, suggested weights from the PR + chart, totals, and maxes.
 */
import { iconForExercise, matchExercise, SEED_EXERCISES } from '../../data/exercises';
import type {
  ChartData,
  ExerciseMemory,
  ProgramDay,
  RememberedSet,
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

// ---------------------------------------------------------------------------
// Remembering what was lifted (CLAUDE.md §5.3)
// ---------------------------------------------------------------------------

/** Map key for a reps + RPE combination, e.g. 5 reps @ 8.5 -> "5x85". */
export function effortKey(reps: number, rpe: number): string {
  return `${reps}x${Math.round(rpe * 10)}`;
}

export type MemoryFor = (key: string) => ExerciseMemory | undefined;

/**
 * What to remember from a finished entry: its completed sets, and the weight
 * used for each reps + RPE combination. null when nothing was completed.
 */
export function memoryFromEntry(
  entry: SessionEntry,
): { lastSets: RememberedSet[]; weightByEffort: Record<string, number> } | null {
  const done = entry.sets.filter((s) => s.done && (s.weightKg != null || s.reps != null));
  if (!done.length) return null;
  const weightByEffort: Record<string, number> = {};
  for (const s of done) {
    if (s.reps != null && s.rpe != null && s.weightKg != null) {
      weightByEffort[effortKey(s.reps, s.rpe)] = s.weightKg;
    }
  }
  return {
    lastSets: done.map(({ reps, rpe, weightKg }) => ({ reps, rpe, weightKg })),
    weightByEffort,
  };
}

/**
 * Prefill an entry's sets from what was lifted last time:
 * - a set with reps and RPE gets the weight last used at that reps + RPE;
 * - a set without RPE gets last time's reps (if it has none) and weight,
 *   matched by set number;
 * - a freshly added exercise (one blank set) gets last time's sets.
 * Weights already entered, and back-off ("-15%") entries, are left alone.
 */
export function applyMemory(entry: SessionEntry, memory: ExerciseMemory | undefined): SessionEntry {
  if (!memory || entry.dropPercent != null) return entry;
  const last = memory.lastSets ?? [];
  const byEffort = memory.weightByEffort ?? {};

  const blank =
    entry.sets.length === 1 &&
    entry.sets[0].reps == null &&
    entry.sets[0].rpe == null &&
    entry.sets[0].weightKg == null;
  if (blank && last.length) {
    return { ...entry, sets: last.map((s) => ({ ...s, done: false })) };
  }

  const sets = entry.sets.map((s, i): SetRow => {
    if (s.weightKg != null) return s;
    if (s.reps != null && s.rpe != null) {
      const w = byEffort[effortKey(s.reps, s.rpe)];
      return w != null ? { ...s, weightKg: w } : s;
    }
    if (s.rpe == null) {
      const prev = last[i] ?? last.at(-1);
      if (!prev) return s;
      return { ...s, reps: s.reps ?? prev.reps, weightKg: prev.weightKg };
    }
    return s;
  });
  return { ...entry, sets };
}

/** An entry for an exercise picked from the seed list or typed as a custom name. */
export function entryForExercise(
  pick: { exerciseId: string | null; name: string },
  restSec: number,
  maxKg: number | null,
  memory?: ExerciseMemory,
): SessionEntry {
  const seed = pick.exerciseId ? SEED_EXERCISES.find((e) => e.id === pick.exerciseId) : undefined;
  const exerciseId = seed?.id ?? null;
  const exerciseName = seed?.name ?? pick.name.trim();
  return applyMemory(
    {
      exerciseId,
      exerciseName,
      iconId: seed?.icon ?? iconForExercise(pick.name),
      maxKg,
      restSec,
      dropPercent: null,
      note: null,
      sets: [blankSet()],
    },
    memory,
  );
}

export function entriesFromRoutine(
  entries: readonly RoutineEntry[],
  maxFor: (key: string) => number | null,
  memoryFor: MemoryFor = () => undefined,
): SessionEntry[] {
  return entries.map((r) => {
    const key = exerciseKey(r.exerciseId, r.exerciseName);
    return applyMemory(
      {
        exerciseId: r.exerciseId,
        exerciseName: r.exerciseName,
        iconId: r.iconId,
        maxKg: maxFor(key),
        restSec: r.restSec,
        dropPercent: r.dropPercent,
        note: r.note,
        sets: Array.from({ length: Math.max(1, r.sets) }, () => blankSet(r.reps, r.rpe)),
      },
      memoryFor(key),
    );
  });
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

/**
 * A finished workout as routine entries: one per exercise, keeping its set
 * count, rest and notes. Reps and RPE come from the first completed set that
 * has them (else the first set that has them). Weights aren't stored on
 * routines; remembered lifts fill them in when the routine is started.
 */
export function routineEntriesFromSession(entries: readonly SessionEntry[]): RoutineEntry[] {
  return entries.map((e) => {
    const ordered = [...e.sets.filter((s) => s.done), ...e.sets.filter((s) => !s.done)];
    return {
      exerciseId: e.exerciseId,
      exerciseName: e.exerciseName,
      iconId: e.iconId,
      sets: Math.max(1, e.sets.length),
      reps: ordered.find((s) => s.reps != null)?.reps ?? null,
      rpe: ordered.find((s) => s.rpe != null)?.rpe ?? null,
      restSec: e.restSec,
      dropPercent: e.dropPercent,
      note: e.note,
    };
  });
}

/** The default name for a new routine: "Routine N", one past the highest in use. */
export function nextRoutineName(existing: readonly string[]): string {
  let highest = 0;
  for (const name of existing) {
    const m = /^routine\s+(\d+)$/i.exec(name.trim());
    if (m) highest = Math.max(highest, Number(m[1]));
  }
  return `Routine ${highest + 1}`;
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
 * Maxes to save on finish: only a PR field the user changed, saved exactly as
 * entered. Logged sets never raise the PR on their own.
 */
export function maxUpdates(
  entries: readonly SessionEntry[],
  storedMax: (key: string) => number | null,
): MaxUpdate[] {
  const out = new Map<string, MaxUpdate>();
  for (const e of entries) {
    const key = exerciseKey(e.exerciseId, e.exerciseName);
    if (e.maxKg == null || e.maxKg === storedMax(key)) continue;
    // The same exercise twice in one workout: the later PR field wins.
    out.set(key, { key, exerciseName: e.exerciseName, e1rmKg: e.maxKg, source: 'manual' });
  }
  return [...out.values()];
}
