import { useSyncExternalStore } from 'react';

export type Orientation = 'portrait' | 'landscape';

/**
 * Physical device orientation. Prefers `screen.orientation`, because the
 * `(orientation)` media query compares viewport width to height and flips to
 * "landscape" when the Android keyboard shrinks the viewport.
 *
 * Landscape also needs a viewport wider than it is tall: emulators and some
 * webviews report a landscape screen around a portrait-shaped page, and the
 * page should not be covered then. A real sideways phone passes both checks,
 * and the keyboard case fails the first.
 */
function read(): Orientation {
  const type = typeof screen !== 'undefined' ? screen.orientation?.type : undefined;
  if (type) {
    return type.startsWith('landscape') && window.innerWidth > window.innerHeight
      ? 'landscape'
      : 'portrait';
  }
  return window.matchMedia('(orientation: landscape)').matches ? 'landscape' : 'portrait';
}

function subscribe(onChange: () => void): () => void {
  const so = typeof screen !== 'undefined' ? screen.orientation : undefined;
  if (so) {
    so.addEventListener('change', onChange);
    window.addEventListener('resize', onChange);
    return () => {
      so.removeEventListener('change', onChange);
      window.removeEventListener('resize', onChange);
    };
  }
  const mq = window.matchMedia('(orientation: landscape)');
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

export function useOrientation(): Orientation {
  return useSyncExternalStore(subscribe, read, () => 'portrait');
}

/** Phones and tablets. Desktops report "landscape" too but aren't rotated. */
export function isTouchDevice(): boolean {
  return window.matchMedia('(pointer: coarse)').matches;
}

/**
 * Ask the browser to hold portrait. Android honors this in an installed PWA;
 * elsewhere (iOS, regular tabs) it rejects, which is expected and ignored.
 */
export function tryLockPortrait(): void {
  const so = typeof screen !== 'undefined' ? screen.orientation : undefined;
  // `lock` is missing from some TS DOM lib versions and from iOS Safari.
  const lock = (so as { lock?: (o: string) => Promise<void> } | undefined)?.lock;
  lock?.call(so, 'portrait').catch(() => undefined);
}
