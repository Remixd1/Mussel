import { rpeToRir } from '../../lib/calc/effort';
import { formatWeight } from '../../lib/calc/units';
import type { SetRow } from '../../lib/types';

/** "5 × 160 lb @ RPE 8" */
export function formatSet(s: SetRow, units: 'lb' | 'kg', scale: 'rpe' | 'rir'): string {
  const parts = [`${s.reps ?? '?'} ×`];
  parts.push(s.weightKg != null ? `${formatWeight(s.weightKg, units)} ${units}` : 'BW');
  if (s.rpe != null) parts.push(scale === 'rir' ? `@ RIR ${rpeToRir(s.rpe)}` : `@ RPE ${s.rpe}`);
  return parts.join(' ');
}

export function formatDuration(sec: number): string {
  const capped = Math.min(sec, 5 * 3600);
  const h = Math.floor(capped / 3600);
  const m = Math.round((capped % 3600) / 60);
  return h ? `${h} h ${m} min` : `${m} min`;
}
