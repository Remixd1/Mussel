import { describe, expect, it } from 'vitest';
import {
  chartPercent,
  defaultChart,
  e1rmFromSet,
  isHalfStep,
  rirToRpe,
  rpeToRir,
  targetWeightKg,
} from '../../src/lib/calc/effort';
import { toKg } from '../../src/lib/calc/units';
import type { ChartData } from '../../src/lib/types';

const chart: ChartData = {
  sourceScale: 'rpe',
  rpeValues: [10, 9, 8],
  rows: [
    { reps: 1, percents: [1, 0.96, 0.92] },
    { reps: 3, percents: [0.92, 0.88, null] },
  ],
};

describe('RPE / RIR', () => {
  it('converts both ways', () => {
    expect(rirToRpe(2)).toBe(8);
    expect(rpeToRir(8.5)).toBe(1.5);
  });

  it('checks the 0.5 grid', () => {
    expect(isHalfStep(8.5)).toBe(true);
    expect(isHalfStep(8.3)).toBe(false);
  });
});

describe('chartPercent', () => {
  it('reads exact cells', () => {
    expect(chartPercent(chart, 1, 9)).toBe(0.96);
    expect(chartPercent(chart, 3, 10)).toBe(0.92);
  });

  it('interpolates between RPE columns', () => {
    expect(chartPercent(chart, 1, 9.5)).toBeCloseTo(0.98, 10);
  });

  it('interpolates between rep rows', () => {
    expect(chartPercent(chart, 2, 10)).toBeCloseTo(0.96, 10);
  });

  it('interpolates across both', () => {
    // Between (1,10)=1, (1,9)=.96, (3,10)=.92, (3,9)=.88 at reps 2, RPE 9.5.
    expect(chartPercent(chart, 2, 9.5)).toBeCloseTo(0.94, 10);
  });

  it('is null outside the chart or across blank cells', () => {
    expect(chartPercent(chart, 4, 10)).toBeNull();
    expect(chartPercent(chart, 1, 7)).toBeNull();
    expect(chartPercent(chart, 2, 8.5)).toBeNull();
  });
});

describe('defaultChart', () => {
  const d = defaultChart();

  it('covers 1 to 12 reps at RPE 6 to 10', () => {
    expect(d.rows.map((r) => r.reps)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(d.rpeValues[0]).toBe(10);
    expect(d.rpeValues.at(-1)).toBe(6);
  });

  it('is 100% for a single at RPE 10 and falls with reps and lower RPE', () => {
    expect(chartPercent(d, 1, 10)).toBe(1);
    expect(chartPercent(d, 5, 8)!).toBeLessThan(chartPercent(d, 3, 8)!);
    expect(chartPercent(d, 5, 7)!).toBeLessThan(chartPercent(d, 5, 9)!);
  });
});

describe('targets and estimates', () => {
  it('suggests a weight rounded to the plate step', () => {
    // 200 kg e1RM x 0.96 = 192 kg -> 192.5 kg on a 2.5 kg step.
    expect(targetWeightKg(200, chart, 1, 9, 'kg')).toBe(192.5);
    // In lb: 192 kg = 423.3 lb -> 425 lb.
    expect(targetWeightKg(200, chart, 1, 9, 'lb')).toBeCloseTo(toKg(425, 'lb'), 10);
  });

  it('estimates 1RM from a logged set', () => {
    expect(e1rmFromSet(chart, 96, 1, 9)).toBeCloseTo(100, 10);
  });

  it('returns null off the chart or for bad input', () => {
    expect(targetWeightKg(200, chart, 8, 9, 'kg')).toBeNull();
    expect(targetWeightKg(0, chart, 1, 9, 'kg')).toBeNull();
    expect(e1rmFromSet(chart, 0, 1, 9)).toBeNull();
  });
});
