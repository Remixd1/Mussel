import { createContext, useContext, useEffect } from 'react';

/** Lets a screen hide the bottom dock while it is mounted (see AppShell). */
export const DockContext = createContext<{ hide: () => () => void } | null>(null);

/**
 * Hides the dock for as long as the calling component is mounted, e.g. the
 * live workout, which has its own way back.
 */
export function useHideDock(): void {
  const dock = useContext(DockContext);
  useEffect(() => dock?.hide(), [dock]);
}
