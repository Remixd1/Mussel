import { useLayoutEffect, useRef, useState } from 'react';
import type { VectorArt } from '../../components/icons/art';
import { VectorIcon } from '../../components/icons/VectorIcon';
import { useCopy } from '../../hooks/useCopy';
import { useOnline } from '../../hooks/useOnline';
import { readDismissed, shouldShowInstallHint, writeDismissed } from './installHint';
import './system.css';

/** The iOS Share button: a box with an arrow out of the top. */
const SHARE_ART: VectorArt = {
  grid: 24,
  stroke: 2.2,
  shapes: [
    { l: [12, 3, 12, 14] },
    { l: [8, 7, 12, 3, 16, 7] },
    { l: [9, 10, 5, 10, 5, 21, 19, 21, 19, 10, 15, 10] },
  ],
};

function standaloneDisplay(): boolean {
  try {
    return window.matchMedia?.('(display-mode: standalone)').matches ?? false;
  } catch {
    return false;
  }
}

/**
 * Slim bars pinned to the top of the screen: offline status and the iOS
 * install hint. Publishes its height as --banner-h so pages move down.
 */
export function SystemBanners() {
  const copy = useCopy();
  const online = useOnline();
  const [hint, setHint] = useState(() =>
    shouldShowInstallHint(navigator, standaloneDisplay(), readDismissed()),
  );
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const root = document.documentElement;
    const publish = () => root.style.setProperty('--banner-h', `${el?.offsetHeight ?? 0}px`);
    publish();
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.setProperty('--banner-h', '0px');
    };
  }, [online, hint]);

  if (online && !hint) return null;

  return (
    <div ref={ref} className="sys-banners">
      {!online ? (
        <p className="sys-banner sys-banner--offline" role="status">
          {copy('offline')}
        </p>
      ) : null}
      {hint ? (
        <div className="sys-banner sys-banner--install" role="region" aria-label="Install Mussel">
          <p>
            Install Mussel: tap{' '}
            <VectorIcon art={SHARE_ART} size={20} title="Share" className="sys-banner__share" />{' '}
            <strong>Share</strong>, then <strong>Add to Home Screen</strong>.
          </p>
          <button
            type="button"
            className="sys-banner__close"
            aria-label="Dismiss install hint"
            onClick={() => {
              writeDismissed();
              setHint(false);
            }}
          >
            ×
          </button>
        </div>
      ) : null}
    </div>
  );
}
