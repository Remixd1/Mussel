/**
 * Estimated one-rep max (Epley): weight * (1 + reps / 30), for 1..12 reps.
 * A single is its own 1RM. Outside that range the estimate is too noisy: null.
 */
export function e1rm(weightKg: number, reps: number): number | null {
  if (!Number.isFinite(weightKg) || weightKg <= 0) return null;
  if (!Number.isInteger(reps) || reps < 1 || reps > 12) return null;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}
