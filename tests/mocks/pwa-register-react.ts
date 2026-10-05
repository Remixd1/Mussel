// Stand-in for the vite-plugin-pwa virtual module, which only exists inside a
// Vite build. Tests drive it through `pwaState`.
import { useState } from 'react';
import { vi } from 'vitest';

export const pwaState = { needRefresh: false, updateServiceWorker: vi.fn(async () => undefined) };

export function useRegisterSW() {
  const needRefresh = useState(pwaState.needRefresh);
  const offlineReady = useState(false);
  return { needRefresh, offlineReady, updateServiceWorker: pwaState.updateServiceWorker };
}
