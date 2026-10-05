import { useEffect, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useCopy } from '../../hooks/useCopy';
import { useToast } from '../../hooks/useToast';

const CHECK_EVERY_MS = 60 * 60 * 1000;

/**
 * Registers the service worker and, when a new version is waiting, asks
 * before reloading (CLAUDE.md §5.8), so an update never wipes a set mid-entry.
 */
export function UpdatePrompt() {
  const copy = useCopy();
  const toast = useToast();
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Installed apps can stay open for days; look for updates hourly.
      if (registration) setInterval(() => void registration.update(), CHECK_EVERY_MS);
    },
  });
  const shown = useRef(false);

  useEffect(() => {
    if (!needRefresh || shown.current) return;
    shown.current = true;
    toast.show(copy('update.ready'), {
      durationMs: 0,
      action: { label: 'Reload', onClick: () => void updateServiceWorker(true) },
    });
  }, [needRefresh, copy, toast, updateServiceWorker]);

  return null;
}
