import { differenceInSeconds, startOfDay, startOfWeek } from 'date-fns';

const DAY_SEC = 24 * 60 * 60;

/** Fraction of the current day (local midnight to midnight) that has passed. */
export function dayElapsed(now: Date): number {
  return differenceInSeconds(now, startOfDay(now)) / DAY_SEC;
}

/** Fraction of the current Monday-to-Sunday week that has passed. */
export function weekElapsed(now: Date): number {
  return differenceInSeconds(now, startOfWeek(now, { weekStartsOn: 1 })) / (7 * DAY_SEC);
}
