import { rpeToRir } from '../../lib/calc/effort';
import { formatWeight } from '../../lib/calc/units';
import type { SessionEntry, SetRow } from '../../lib/types';

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

/**
 * Which exercises start collapsed: all but the first one with sets left to
 * do, so a long program day opens on what's next instead of every set.
 */
export function initialCollapsed(entries: readonly SessionEntry[]): boolean[] {
  const open = entries.findIndex((e) => e.sets.some((s) => !s.done));
  const keep = open === -1 ? 0 : open;
  return entries.map((_, i) => i !== keep);
}

/** "2/3 sets done", or "All 3 sets done". */
export function setProgress(sets: readonly SetRow[]): string {
  const done = sets.filter((s) => s.done).length;
  const total = sets.length;
  if (total > 0 && done === total) return `All ${total} ${total === 1 ? 'set' : 'sets'} done`;
  return `${done}/${total} ${total === 1 ? 'set' : 'sets'} done`;
}
