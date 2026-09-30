import { useEffect } from 'react';
import { useCopy } from '../../hooks/useCopy';
import { isTouchDevice, tryLockPortrait, useOrientation } from '../../hooks/useOrientation';
import { MusselLogo } from '../icons';

/**
 * Mussel is portrait-only. Where the browser can't lock orientation (iOS),
 * cover the app while the phone is sideways.
 */
export function RotateOverlay() {
  const orientation = useOrientation();
  const copy = useCopy();

  useEffect(() => {
    tryLockPortrait();
  }, []);

  if (orientation !== 'landscape' || !isTouchDevice()) return null;

  return (
    <div className="rotate-overlay" role="alertdialog" aria-modal="true" aria-live="assertive">
      <div className="rotate-overlay__icon" aria-hidden="true">
        <MusselLogo size={64} title="" />
      </div>
      <p>{copy('rotate.prompt')}</p>
    </div>
  );
}
