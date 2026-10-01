import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { useProfileState } from '../../hooks/useProfile';
import { MusselLogo } from '../icons';
import { BottomNav } from '../ui';
import './layout.css';

/** Header bar + routed content + bottom nav, for signed-in screens. */
export function AppShell() {
  const profile = useProfileState();
  const scanlines = profile.status === 'ready' && profile.profile.scanlinesOn;
  return (
    <>
      <header className={`app-header${scanlines ? ' px-scanlines' : ''}`}>
        <MusselLogo size={32} title="" />
        <span className="app-header__wordmark">MUSSEL</span>
        <span className="app-header__lab">
          {profile.status === 'ready' ? `#${profile.profile.subjectNumber}` : 'B.K.L.'}
        </span>
      </header>
      <main className="app-main">
        {/* Lazy pages suspend here, so the header and nav stay put while they load. */}
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </main>
      <BottomNav />
    </>
  );
}

/** Centered layout without nav, for sign-in, sign-up, and onboarding. */
export function BareShell() {
  return (
    <main className="app-main app-main--bare">
      <Suspense fallback={null}>
        <Outlet />
      </Suspense>
    </main>
  );
}
