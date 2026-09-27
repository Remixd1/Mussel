import type { Units } from '../types';

export const LB_PER_KG = 2.2046226218;

/** Stepper increment in the display unit. */
export const WEIGHT_STEP: Record<Units, number> = { lb: 5, kg: 2.5 };

/** Convert a value entered in `unit` to canonical kg (full precision). */
export function toKg(value: number, unit: Units): number {
  return unit === 'kg' ? value : value / LB_PER_KG;
}

/** Convert canonical kg to `unit` (full precision). */
export function fromKg(kg: number, unit: Units): number {
  return unit === 'kg' ? kg : kg * LB_PER_KG;
}

/** Round to 1 decimal, dropping a trailing ".0": 100 -> "100", 102.54 -> "102.5". */
export function formatNumber(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  // Avoid "-0" for tiny negatives that round to zero.
  return String(Object.is(rounded, -0) ? 0 : rounded);
}

/** Canonical kg to a display string in `unit`, e.g. "225". */
export function formatWeight(kg: number, unit: Units): string {
  return formatNumber(fromKg(kg, unit));
}
