import { describe, expect, it } from 'vitest';
import {
  formatNumber,
  formatWeight,
  fromKg,
  LB_PER_KG,
  toKg,
  WEIGHT_STEP,
} from '../../src/lib/calc/units';

describe('units', () => {
  it('kg passes through unchanged', () => {
    expect(toKg(100, 'kg')).toBe(100);
    expect(fromKg(100, 'kg')).toBe(100);
  });

  it('converts lb to kg and back at full precision', () => {
    expect(toKg(LB_PER_KG, 'lb')).toBeCloseTo(1, 12);
    expect(fromKg(1, 'lb')).toBe(LB_PER_KG);
    expect(fromKg(toKg(225, 'lb'), 'lb')).toBeCloseTo(225, 10);
  });

  it('does not round on conversion', () => {
    // 225 lb is 102.0582... kg; storage must keep every digit.
    expect(toKg(225, 'lb')).not.toBe(102.1);
    expect(toKg(225, 'lb')).toBeCloseTo(102.05828, 5);
  });

  it('formats to 1 decimal and drops a trailing .0', () => {
    expect(formatNumber(100)).toBe('100');
    expect(formatNumber(100.04)).toBe('100');
    expect(formatNumber(102.54)).toBe('102.5');
    expect(formatNumber(102.56)).toBe('102.6');
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(-0.01)).toBe('0');
  });

  it('formats canonical kg in the display unit', () => {
    expect(formatWeight(toKg(225, 'lb'), 'lb')).toBe('225');
    expect(formatWeight(100, 'kg')).toBe('100');
    expect(formatWeight(100, 'lb')).toBe('220.5');
  });

  it('uses 5 lb / 2.5 kg stepper increments', () => {
    expect(WEIGHT_STEP).toEqual({ lb: 5, kg: 2.5 });
  });
});
