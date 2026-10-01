import { useState } from 'react';
import { MusselLogo } from '../../components/icons';
import { Button } from '../../components/ui';
import { signOut } from '../../lib/auth';
import './auth.css';

/** Shown while a saved session or profile loads, so login never flashes. */
export function Splash() {
  return (
    <div className="auth-splash" role="status" aria-live="polite">
      <MusselLogo size={96} title="" />
      <span className="px-display px-pulse">Loading</span>
      <span className="visually-hidden">Loading Mussel</span>
    </div>
  );
}

/** Signed in, but no profile document (e.g. deleted elsewhere). */
export function ProfileMissing() {
  const [busy, setBusy] = useState(false);
  return (
    <div className="auth-splash">
      <MusselLogo size={96} title="" />
      <h1>Subject file missing</h1>
      <p>This account has no profile on record. Sign out and try again, or create a new account.</p>
      <Button
        disabled={busy}
        onClick={() => {
          setBusy(true);
          void signOut().finally(() => setBusy(false));
        }}
      >
        Log out
      </Button>
    </div>
  );
}
