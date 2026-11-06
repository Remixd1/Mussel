/**
 * Lock-screen rest timer (CLAUDE.md §5.4): while the app is in the
 * background, a silent notification shows the time left between sets.
 *
 * What the web platform allows:
 * - Android (Chrome, installed or not): the notification updates every second
 *   while the phone is locked, and "rest over" buzzes when the timer ends.
 * - iOS (16.4+, only when Mussel is added to the Home Screen): the
 *   notification appears with the end time, but iOS pauses the app once it is
 *   in the background, so it can't count down or alert at the end. That
 *   needs server push (a paid Firebase plan), which this app doesn't use.
 *
 * The setting is per device (notification permission is), so it lives in
 * localStorage rather than the synced profile.
 */

const KEY = 'mussel.restNotifications';
const TAG = 'mussel-rest-timer';

export type NotifySupport = 'supported' | 'needs-install' | 'unsupported';

function isIos(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    /iPad|iPhone|iPod/.test(nav.userAgent) ||
    (nav.platform === 'MacIntel' && (nav.maxTouchPoints ?? 0) > 1)
  );
}

/** Whether this device can show the rest notification at all. */
export function notifySupport(): NotifySupport {
  if (typeof window === 'undefined') return 'unsupported';
  const hasApi = 'Notification' in window && 'serviceWorker' in navigator;
  if (hasApi) return 'supported';
  // iOS Safari only exposes notifications to apps added to the Home Screen.
  return isIos() ? 'needs-install' : 'unsupported';
}

export function restNotificationsOn(): boolean {
  try {
    return (
      notifySupport() === 'supported' &&
      localStorage.getItem(KEY) === '1' &&
      Notification.permission === 'granted'
    );
  } catch {
    return false;
  }
}

/** Ask for permission (must run from a tap) and remember the choice. */
export async function enableRestNotifications(): Promise<'granted' | 'denied' | 'unsupported'> {
  if (notifySupport() !== 'supported') return 'unsupported';
  const result =
    Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (result !== 'granted') return 'denied';
  try {
    localStorage.setItem(KEY, '1');
  } catch {
    // Private mode: works for this session only.
  }
  return 'granted';
}

export function disableRestNotifications(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing stored.
  }
  void clearRestNotification();
}

/** "1:25" */
function clock(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Notification text for a running rest. Pure; `timeOf` formats the end time. */
export function restNotificationText(
  remainingSec: number,
  endsAtMs: number,
  exerciseName: string | null,
  timeOf: (ms: number) => string = (ms) =>
    new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
): { title: string; body: string } {
  return {
    title: `Rest · ${clock(remainingSec)} left`,
    body: `${exerciseName ? `${exerciseName} · ` : ''}until ${timeOf(endsAtMs)}`,
  };
}

async function registration(): Promise<ServiceWorkerRegistration | null> {
  if (notifySupport() !== 'supported') return null;
  try {
    return (await navigator.serviceWorker.getRegistration()) ?? null;
  } catch {
    return null;
  }
}

/** Show or update the countdown. Silent, and replaces itself (same tag). */
export async function showRestNotification(
  remainingSec: number,
  endsAtMs: number,
  exerciseName: string | null,
): Promise<void> {
  const reg = await registration();
  if (!reg) return;
  const { title, body } = restNotificationText(remainingSec, endsAtMs, exerciseName);
  try {
    await reg.showNotification(title, {
      body,
      tag: TAG,
      silent: true,
      icon: '/icon-192.png',
      badge: '/favicon.png',
      data: { url: '/workout' },
      // `renotify` and `timestamp` are supported on Android but missing from TS's DOM types.
      ...({ renotify: false, timestamp: endsAtMs } as object),
    });
  } catch {
    // Permission revoked, or the browser refused: the in-app timer still works.
  }
}

/** Rest is over while the app is in the background: replace the countdown and buzz. */
export async function showRestDoneNotification(message: string): Promise<void> {
  const reg = await registration();
  if (!reg) return;
  try {
    await reg.showNotification(message, {
      tag: TAG,
      icon: '/icon-192.png',
      badge: '/favicon.png',
      data: { url: '/workout' },
      ...({ renotify: true, vibrate: [200, 100, 200] } as object),
    });
  } catch {
    // Ignore; see above.
  }
}

export async function clearRestNotification(): Promise<void> {
  const reg = await registration();
  if (!reg) return;
  try {
    const list = await reg.getNotifications({ tag: TAG });
    list.forEach((n) => n.close());
  } catch {
    // Nothing to close.
  }
}
