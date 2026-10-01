import type { SegmentOption } from '../../components/ui';
import type { EffortScale, ThemePref, Units } from '../../lib/types';

export const UNIT_OPTIONS: readonly SegmentOption<Units>[] = [
  { value: 'lb', label: 'lb' },
  { value: 'kg', label: 'kg' },
];

export const EFFORT_OPTIONS: readonly SegmentOption<EffortScale>[] = [
  { value: 'rpe', label: 'RPE' },
  { value: 'rir', label: 'RIR' },
];

export const REST_OPTIONS: readonly SegmentOption<number>[] = [
  { value: 60, label: '60s' },
  { value: 90, label: '90s' },
  { value: 120, label: '120s' },
  { value: 180, label: '180s' },
];

export const THEME_OPTIONS: readonly SegmentOption<ThemePref>[] = [
  { value: 'system', label: 'Auto' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];
