/**
 * RPE/RIR and effort-chart math (CLAUDE.md §5.2b, §10). Pure functions.
 * Effort is canonical RPE; RIR converts as RPE = 10 - RIR.
 */
import type { ChartData, Units } from '../types';
import { fromKg, toKg, WEIGHT_STEP } from './units';

export const rirToRpe = (rir: number): number => 10 - rir;
export const rpeToRir = (rpe: number): number => 10 - rpe;

/** Effort values must sit on a 0.5 grid. */
export function isHalfStep(n: number): boolean {
  return Number.isFinite(n) && Math.abs(n * 2 - Math.round(n * 2)) < 1e-9;
}

export const DEFAULT_CHART_NAME = 'RKL Standard Issue';

/**
 * Built-in chart (an approximation): Epley with reps in reserve.
 * effective reps n = reps + (10 - RPE); % = 1 if n <= 1, else 1 / (1 + n / 30).
 */
export function defaultChart(): ChartData {
  const rpeValues = [10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6];
  const rows = Array.from({ length: 12 }, (_, i) => {
    const reps = i + 1;
    return {
      reps,
      percents: rpeValues.map((rpe) => {
        const n = reps + (10 - rpe);
        return n <= 1 ? 1 : Math.round((1 / (1 + n / 30)) * 10000) / 10000;
      }),
    };
  });
  return { sourceScale: 'rpe', rpeValues, rows };
}

/**
 * Original indices of the entries just below (`a`) and above (`b`) `x`, and
 * how far `x` sits between them (0..1). `values` may be in any order.
 */
function bracket(values: number[], x: number) {
  const sorted = values.map((v, i) => ({ v, i })).sort((p, q) => p.v - q.v);
  if (!sorted.length || x < sorted[0].v - 1e-9 || x > sorted[sorted.length - 1].v + 1e-9) {
    return null;
  }
  for (let k = 0; k < sorted.length; k++) {
    if (Math.abs(sorted[k].v - x) < 1e-9) return { a: sorted[k].i, b: sorted[k].i, t: 0 };
    if (sorted[k].v > x) {
      const lo = sorted[k - 1];
      const hi = sorted[k];
      return { a: lo.i, b: hi.i, t: (x - lo.v) / (hi.v - lo.v) };
    }
  }
  return null;
}

/**
 * %1RM (as a fraction) for `reps` at `rpe`, interpolating between neighbouring
 * rows and columns. null outside the chart or across blank cells.
 */
export function chartPercent(chart: ChartData, reps: number, rpe: number): number | null {
  const col = bracket(chart.rpeValues, rpe);
  const row = bracket(
    chart.rows.map((r) => r.reps),
    reps,
  );
  if (!col || !row) return null;
  const cell = (r: number, c: number) => chart.rows[r].percents[c];
  const corners = [cell(row.a, col.a), cell(row.a, col.b), cell(row.b, col.a), cell(row.b, col.b)];
  if (corners.some((v) => v == null)) return null;
  const [aa, ab, ba, bb] = corners as number[];
  const top = aa + (ab - aa) * col.t;
  const bottom = ba + (bb - ba) * col.t;
  return top + (bottom - top) * row.t;
}

/** Suggested weight in kg, rounded to the plate step in the display unit. */
export function targetWeightKg(
  e1rmKg: number,
  chart: ChartData,
  reps: number,
  rpe: number,
  unit: Units,
): number | null {
  const pct = chartPercent(chart, reps, rpe);
  if (pct == null || !(e1rmKg > 0)) return null;
  const step = WEIGHT_STEP[unit];
  const shown = Math.round(fromKg(e1rmKg * pct, unit) / step) * step;
  return toKg(shown, unit);
}

/** Estimated 1RM from a logged set, via the chart. */
export function e1rmFromSet(
  chart: ChartData,
  weightKg: number,
  reps: number,
  rpe: number,
): number | null {
  const pct = chartPercent(chart, reps, rpe);
  if (pct == null || pct <= 0 || !(weightKg > 0)) return null;
  return weightKg / pct;
}
