import { startOfWeek } from 'date-fns';
import type { Session } from '../types';

export interface WeekStats {
  workouts: number;
  volumeKg: number;
  sets: number;
  lastWorkout: Date | null;
}

/** This Monday-to-Sunday week's totals, plus the most recent workout date. */
export function weekStats(
  sessions: readonly Pick<Session, 'startedAt' | 'totals'>[],
  now: Date,
): WeekStats {
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }).getTime();
  let workouts = 0;
  let volumeKg = 0;
  let sets = 0;
  let last: number | null = null;
  for (const s of sessions) {
    const t = s.startedAt.toMillis();
    if (last === null || t > last) last = t;
    if (t >= weekStart && t <= now.getTime()) {
      workouts++;
      volumeKg += s.totals.volumeKg;
      sets += s.totals.setCount;
    }
  }
  return { workouts, volumeKg, sets, lastWorkout: last === null ? null : new Date(last) };
}
