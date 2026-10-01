import { useEffect, useRef, useState } from 'react';

export interface RestTimerView {
  running: boolean;
  remainingSec: number;
  /** 0..1 of the rest still to go. */
  fraction: number;
}

/**
 * Timestamp-based countdown (CLAUDE.md §5.4): shows `endsAt - now`, so it
 * stays right after the phone sleeps. Calls `onDone` once when it reaches 0.
 */
export function useRestTimer(
  endsAtMs: number | null,
  durationSec: number,
  onDone: () => void,
): RestTimerView {
  const [now, setNow] = useState(() => Date.now());
  const fired = useRef<number | null>(null);
  const done = useRef(onDone);

  useEffect(() => {
    done.current = onDone;
  });

  useEffect(() => {
    if (endsAtMs == null) return;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (t >= endsAtMs && fired.current !== endsAtMs) {
        fired.current = endsAtMs;
        done.current();
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [endsAtMs]);

  if (endsAtMs == null) return { running: false, remainingSec: 0, fraction: 0 };
  const remainingSec = Math.max(0, Math.ceil((endsAtMs - now) / 1000));
  return {
    running: remainingSec > 0,
    remainingSec,
    fraction: durationSec > 0 ? Math.min(1, remainingSec / durationSec) : 0,
  };
}

/** "1:05" */
export function formatClock(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
