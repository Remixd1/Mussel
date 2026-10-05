import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ToastProvider } from '../../src/components/ui';
import {
  INSTALL_HINT_KEY,
  isIosSafari,
  shouldShowInstallHint,
} from '../../src/features/system/installHint';
import { SystemBanners } from '../../src/features/system/SystemBanners';
import { UpdatePrompt } from '../../src/features/system/UpdatePrompt';
import { pwaState } from '../mocks/pwa-register-react';

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const IPHONE_CHROME =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/129.0 Mobile/15E148 Safari/604.1';
const ANDROID =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36';
const MAC_SAFARI =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';

describe('install hint rules', () => {
  it('targets iOS Safari only', () => {
    expect(isIosSafari({ userAgent: IPHONE_SAFARI })).toBe(true);
    expect(isIosSafari({ userAgent: IPHONE_CHROME })).toBe(false);
    expect(isIosSafari({ userAgent: ANDROID })).toBe(false);
    // iPadOS reports a Mac user agent; touch support tells it apart.
    expect(isIosSafari({ userAgent: MAC_SAFARI, platform: 'MacIntel', maxTouchPoints: 5 })).toBe(
      true,
    );
    expect(isIosSafari({ userAgent: MAC_SAFARI, platform: 'MacIntel', maxTouchPoints: 0 })).toBe(
      false,
    );
  });

  it('hides once installed or dismissed', () => {
    const nav = { userAgent: IPHONE_SAFARI };
    expect(shouldShowInstallHint(nav, false, false)).toBe(true);
    expect(shouldShowInstallHint({ ...nav, standalone: true }, false, false)).toBe(false);
    expect(shouldShowInstallHint(nav, true, false)).toBe(false);
    expect(shouldShowInstallHint(nav, false, true)).toBe(false);
  });
});

describe('SystemBanners', () => {
  const realUa = navigator.userAgent;
  const setUa = (value: string) =>
    Object.defineProperty(window.navigator, 'userAgent', { value, configurable: true });

  beforeEach(() => localStorage.clear());
  afterEach(() => setUa(realUa));

  it('shows the offline banner while the connection is down', () => {
    render(<SystemBanners />);
    expect(screen.queryByText(/facility link lost/i)).not.toBeInTheDocument();
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(screen.getByText(/facility link lost/i)).toBeInTheDocument();
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(screen.queryByText(/facility link lost/i)).not.toBeInTheDocument();
  });

  it('shows the install hint on iOS Safari and remembers dismissal', () => {
    setUa(IPHONE_SAFARI);
    const { unmount } = render(<SystemBanners />);
    expect(screen.getByText(/add to home screen/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss install hint' }));
    expect(screen.queryByText(/add to home screen/i)).not.toBeInTheDocument();
    expect(localStorage.getItem(INSTALL_HINT_KEY)).toBe('1');
    unmount();
    render(<SystemBanners />);
    expect(screen.queryByText(/add to home screen/i)).not.toBeInTheDocument();
  });

  it('shows no install hint on Android', () => {
    setUa(ANDROID);
    render(<SystemBanners />);
    expect(screen.queryByText(/add to home screen/i)).not.toBeInTheDocument();
  });
});

describe('UpdatePrompt', () => {
  afterEach(() => {
    pwaState.needRefresh = false;
    pwaState.updateServiceWorker.mockClear();
  });

  it('asks before reloading into a new version', () => {
    pwaState.needRefresh = true;
    render(
      <ToastProvider>
        <UpdatePrompt />
      </ToastProvider>,
    );
    expect(screen.getByText(/new lab firmware available/i)).toBeInTheDocument();
    expect(pwaState.updateServiceWorker).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Reload' }));
    expect(pwaState.updateServiceWorker).toHaveBeenCalledWith(true);
  });

  it('stays quiet when up to date', () => {
    render(
      <ToastProvider>
        <UpdatePrompt />
      </ToastProvider>,
    );
    expect(screen.queryByText(/firmware/i)).not.toBeInTheDocument();
  });
});
