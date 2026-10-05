/**
 * When to show the iOS "Add to Home Screen" hint (CLAUDE.md §5.8): iPhone or
 * iPad Safari, not already installed, and not dismissed before.
 */

export const INSTALL_HINT_KEY = 'mussel.installHintDismissed';

export interface NavigatorLike {
  userAgent: string;
  platform?: string;
  maxTouchPoints?: number;
  standalone?: boolean;
}

export function isIosSafari(nav: NavigatorLike): boolean {
  const ua = nav.userAgent;
  // iPadOS 13+ reports itself as a Mac; touch points give it away.
  const ios =
    /iPad|iPhone|iPod/.test(ua) || (nav.platform === 'MacIntel' && (nav.maxTouchPoints ?? 0) > 1);
  // Other iOS browsers (Chrome, Firefox, Edge, Opera) can't add to the home screen the same way.
  const safari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(ua);
  return ios && safari;
}

export function shouldShowInstallHint(
  nav: NavigatorLike,
  displayModeStandalone: boolean,
  dismissed: boolean,
): boolean {
  if (dismissed || displayModeStandalone || nav.standalone === true) return false;
  return isIosSafari(nav);
}

export function readDismissed(): boolean {
  try {
    return localStorage.getItem(INSTALL_HINT_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeDismissed(): void {
  try {
    localStorage.setItem(INSTALL_HINT_KEY, '1');
  } catch {
    // Private mode: the hint comes back next visit, which is fine.
  }
}
