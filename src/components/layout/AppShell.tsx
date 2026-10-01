import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from '../ui';
import './layout.css';

/** Routed content over the bottom dock, for signed-in screens. */
export function AppShell() {
  return (
    <>
      <main className="app-main">
        {/* Lazy pages suspend here, so the dock stays put while they load. */}
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </main>
      <BottomNav />
    </>
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
