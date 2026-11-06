import { useEffect, useState } from 'react';
import {
  clearRestNotification,
  restNotificationsOn,
  showRestNotification,
} from '../lib/restNotify';

function isHidden(): boolean {
  return typeof document !== 'undefined' && document.visibilityState === 'hidden';
}

/**
 * Mirrors the rest timer into a lock-screen notification while the app is in
 * the background (see src/lib/restNotify.ts). Does nothing unless the user
 * turned it on in Calibration. The "rest over" alert is fired by the caller's
 * timer-done handler.
 */
export function useRestNotification({
  running,
  remainingSec,
  endsAtMs,
  exerciseName,
}: {
  running: boolean;
  remainingSec: number;
  endsAtMs: number | null;
  exerciseName: string | null;
}): void {
  const [hidden, setHidden] = useState(isHidden);

  useEffect(() => {
    const onChange = () => setHidden(isHidden());
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  useEffect(() => {
    if (!restNotificationsOn()) return;
    if (hidden && running && endsAtMs != null) {
      void showRestNotification(remainingSec, endsAtMs, exerciseName);
    } else if (!hidden || endsAtMs == null) {
      // Back in the app, or the rest was skipped. A finished rest while hidden
      // keeps its "rest over" notification until the app is opened.
      void clearRestNotification();
    }
  }, [hidden, running, remainingSec, endsAtMs, exerciseName]);

  // Leaving the workout screen ends the mirror.
  useEffect(
    () => () => {
      void clearRestNotification();
    },
    [],
  );
}
