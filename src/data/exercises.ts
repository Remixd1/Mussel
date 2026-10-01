/**
 * Seed exercise list (CLAUDE.md §5.6) and keyword matching for exercise names
 * typed in programs ("Comp Bench", "paused incline db press", ...).
 */
import type { PictogramId } from '../components/icons/art';

export interface SeedExercise {
  id: string;
  name: string;
  icon: PictogramId;
}

export const SEED_EXERCISES: readonly SeedExercise[] = [
  { id: 'back-squat', name: 'Back Squat', icon: 'squat' },
  { id: 'front-squat', name: 'Front Squat', icon: 'squat' },
  { id: 'deadlift', name: 'Deadlift', icon: 'deadlift' },
  { id: 'rdl', name: 'Romanian Deadlift', icon: 'deadlift' },
  { id: 'bench-press', name: 'Bench Press', icon: 'bench' },
  { id: 'incline-bench', name: 'Incline Bench Press', icon: 'bench' },
  { id: 'ohp', name: 'Overhead Press', icon: 'ohp' },
  { id: 'pullup', name: 'Pull-up', icon: 'pullup' },
  { id: 'barbell-row', name: 'Barbell Row', icon: 'row' },
  { id: 'bicep-curl', name: 'Bicep Curl', icon: 'curl' },
  { id: 'dip', name: 'Dip', icon: 'pushup' },
  { id: 'lunge', name: 'Walking Lunge', icon: 'lunge' },
  { id: 'leg-press', name: 'Leg Press', icon: 'machine' },
  { id: 'lat-pulldown', name: 'Lat Pulldown', icon: 'machine' },
];

function normalize(name: string): string {
  return ` ${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()} `;
}

const has = (n: string, ...words: string[]) => words.some((w) => n.includes(` ${w} `));

/**
 * Best seed match for a free-text exercise name, or null. Only confident
 * matches: variations like "pause squat" still map to their parent lift.
 */
export function matchExercise(name: string): string | null {
  const n = normalize(name);
  // Isolation/accessory movements that share a keyword with a main lift.
  if (has(n, 'split', 'bulg', 'bulgarian', 'hack', 'goblet')) return null;
  if (has(n, 'hamstring', 'leg curl', 'nordic')) return null;

  if (has(n, 'rdl', 'romanian', 'stiff')) return 'rdl';
  if (has(n, 'deadlift', 'deadlifts')) return 'deadlift';
  if (has(n, 'front') && has(n, 'squat')) return 'front-squat';
  if (has(n, 'squat', 'squats')) return 'back-squat';
  if (has(n, 'bench') && has(n, 'incline')) return 'incline-bench';
  if (has(n, 'bench') && !has(n, 'db', 'dumbbell')) return 'bench-press';
  if (has(n, 'ohp', 'overhead') && !has(n, 'tricep', 'triceps', 'extension')) return 'ohp';
  if (has(n, 'pulldown', 'pulldowns')) return 'lat-pulldown';
  if (has(n, 'pullup', 'pullups', 'chinup', 'chinups')) return 'pullup';
  if (has(n, 'leg press')) return 'leg-press';
  if (has(n, 'press') && has(n, 'leg')) return 'leg-press';
  if (has(n, 'row') && has(n, 'barbell', 'pendlay')) return 'barbell-row';
  if (has(n, 'dip', 'dips')) return 'dip';
  if (has(n, 'lunge', 'lunges')) return 'lunge';
  return null;
}

/** A pictogram for any exercise name, from keywords; `machine` when unsure. */
export function iconForExercise(name: string): PictogramId {
  const seedId = matchExercise(name);
  const seed = seedId ? SEED_EXERCISES.find((e) => e.id === seedId) : undefined;
  if (seed) return seed.icon;

  const n = normalize(name);
  // Machine-only movements that would otherwise match "curl" or "press".
  if (has(n, 'hamstring', 'extension', 'extensions', 'pushdown', 'pushdowns')) return 'machine';
  if (has(n, 'split', 'lunge', 'lunges', 'step')) return 'lunge';
  if (has(n, 'squat', 'squats')) return 'squat';
  if (has(n, 'deadlift', 'hinge', 'thrust', 'glute')) return 'deadlift';
  if (has(n, 'curl', 'curls')) return 'curl';
  if (has(n, 'row', 'rows')) return 'row';
  if (has(n, 'pullup', 'pullups', 'pulldown', 'pullover', 'chin')) return 'pullup';
  if (has(n, 'shoulder', 'lateral', 'raise', 'raises', 'overhead')) return 'ohp';
  if (has(n, 'bench', 'press', 'fly', 'flye', 'chest')) return 'bench';
  if (has(n, 'pushup', 'push', 'dip', 'dips')) return 'pushup';
  if (has(n, 'plank')) return 'plank';
  if (has(n, 'crunch', 'abs', 'core', 'situp')) return 'core';
  if (has(n, 'run', 'treadmill', 'sprint')) return 'run';
  if (has(n, 'bike', 'cycle', 'cycling')) return 'cycle';
  if (has(n, 'stretch', 'mobility')) return 'stretch';
  // Generic "machine"/"cable" work with no clearer movement keyword.
  return 'machine';
}
