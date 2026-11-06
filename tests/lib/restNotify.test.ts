import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRestNotification } from '../../src/hooks/useRestNotification';
import {
  disableRestNotifications,
  enableRestNotifications,
  notifySupport,
  restNotificationText,
  restNotificationsOn,
  showRestDoneNotification,
} from '../../src/lib/restNotify';

type Shown = { title: string; options: NotificationOptions & Record<string, unknown> };

/** Fake Notification + service worker registration that records what's shown. */
function installFakes(permission: NotificationPermission = 'default', grant = true) {
  const shown: Shown[] = [];
  const closed: string[] = [];
  const reg = {
    showNotification: vi.fn(async (title: string, options: Shown['options']) => {
      shown.push({ title, options });
    }),
    getNotifications: vi.fn(async () => [{ close: () => closed.push('rest') }]),
  };
  const Notif = Object.assign(function Notification() {}, {
    permission,
    requestPermission: vi.fn(async () => {
      Notif.permission = grant ? 'granted' : 'denied';
      return Notif.permission;
    }),
  });
  vi.stubGlobal('Notification', Notif);
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: { getRegistration: async () => reg },
  });
  return { shown, closed, reg, Notif };
}

function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => (hidden ? 'hidden' : 'visible'),
  });
  document.dispatchEvent(new Event('visibilitychange'));
}

const flush = () => act(async () => await Promise.resolve());

beforeEach(() => localStorage.clear());
afterEach(() => {
  vi.unstubAllGlobals();
  delete (navigator as { serviceWorker?: unknown }).serviceWorker;
  setHidden(false);
});

describe('notification text', () => {
  it('shows time left and when rest ends', () => {
    expect(restNotificationText(85, 0, 'Comp Bench', () => '3:42 PM')).toEqual({
      title: 'Rest · 1:25 left',
      body: 'Comp Bench · until 3:42 PM',
    });
    expect(restNotificationText(5, 0, null, () => '3:42 PM')).toEqual({
      title: 'Rest · 0:05 left',
      body: 'until 3:42 PM',
    });
  });
});

describe('opting in', () => {
  it('asks permission and remembers it per device', async () => {
    const { Notif } = installFakes('default', true);
    expect(notifySupport()).toBe('supported');
    expect(restNotificationsOn()).toBe(false);
    await expect(enableRestNotifications()).resolves.toBe('granted');
    expect(Notif.requestPermission).toHaveBeenCalled();
    expect(restNotificationsOn()).toBe(true);
    disableRestNotifications();
    expect(restNotificationsOn()).toBe(false);
  });

  it('reports a refusal', async () => {
    installFakes('default', false);
    await expect(enableRestNotifications()).resolves.toBe('denied');
    expect(restNotificationsOn()).toBe(false);
  });

  it('explains that iPhone needs the Home Screen app', () => {
    vi.stubGlobal('Notification', undefined);
    delete (window as { Notification?: unknown }).Notification;
    const ua = navigator.userAgent;
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
    });
    expect(notifySupport()).toBe('needs-install');
    Object.defineProperty(navigator, 'userAgent', { configurable: true, value: ua });
  });
});

describe('useRestNotification', () => {
  const props = (remainingSec: number, running = true) => ({
    running,
    remainingSec,
    endsAtMs: running ? Date.now() + remainingSec * 1000 : null,
    exerciseName: 'Comp Bench',
  });

  it('does nothing unless turned on', async () => {
    const { shown } = installFakes('granted');
    setHidden(true);
    renderHook(() => useRestNotification(props(90)));
    await flush();
    expect(shown).toHaveLength(0);
  });

  it('shows a silent countdown while hidden and clears it on return', async () => {
    const { shown, closed } = installFakes('granted');
    localStorage.setItem('mussel.restNotifications', '1');
    const { rerender } = renderHook((p) => useRestNotification(p), { initialProps: props(90) });
    await flush();
    expect(shown).toHaveLength(0); // app in view: no notification

    act(() => setHidden(true));
    await flush();
    expect(shown.at(-1)?.title).toBe('Rest · 1:30 left');
    expect(shown.at(-1)?.options).toMatchObject({ tag: 'mussel-rest-timer', silent: true });

    rerender(props(89));
    await flush();
    expect(shown.at(-1)?.title).toBe('Rest · 1:29 left');

    act(() => setHidden(false));
    await flush();
    expect(closed.length).toBeGreaterThan(0);
  });

  it('clears when the rest is skipped', async () => {
    const { closed } = installFakes('granted');
    localStorage.setItem('mussel.restNotifications', '1');
    setHidden(true);
    const { rerender } = renderHook((p) => useRestNotification(p), { initialProps: props(60) });
    await flush();
    rerender(props(0, false));
    await flush();
    expect(closed.length).toBeGreaterThan(0);
  });

  it('rest over replaces the countdown and alerts', async () => {
    const { shown } = installFakes('granted');
    await showRestDoneNotification('Rest over.');
    expect(shown[0].title).toBe('Rest over.');
    expect(shown[0].options).toMatchObject({ tag: 'mussel-rest-timer', renotify: true });
    expect(shown[0].options.silent).toBeFalsy();
  });
});
