import { Suspense, useCallback, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from '../ui';
import { DockContext } from './dock';
import './layout.css';

/** Routed content over the bottom dock, for signed-in screens. */
export function AppShell() {
  // How many mounted screens want the dock hidden (normally 0 or 1).
  const [hiders, setHiders] = useState(0);
  const hide = useCallback(() => {
    setHiders((n) => n + 1);
    return () => setHiders((n) => n - 1);
  }, []);
  const dock = useMemo(() => ({ hide }), [hide]);
  const docked = hiders === 0;

  return (
    <DockContext.Provider value={dock}>
      <main className={docked ? 'app-main' : 'app-main app-main--no-dock'}>
        {/* Lazy pages suspend here, so the dock stays put while they load. */}
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </main>
      {docked ? <BottomNav /> : null}
    </DockContext.Provider>
  );
}

/** Centered layout without the dock, for sign-in, sign-up, and onboarding. */
export function BareShell() {
  return (
    <main className="app-main app-main--bare">
      <Suspense fallback={null}>
        <Outlet />
      </Suspense>
    </main>
  );
}
