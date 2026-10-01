import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useProfileState } from '../../hooks/useProfile';
import { ProfileMissing, Splash } from './Splash';

/**
 * Signed-in routes. Waits for the saved session and the profile, then sends
 * users who haven't finished Subject Intake to /onboarding (and finished ones
 * away from it).
 */
export function RequireAuth({ onboarding = false }: { onboarding?: boolean }) {
  const auth = useAuth();
  const profile = useProfileState();
  const location = useLocation();

  if (auth.status === 'loading') return <Splash />;
  if (auth.status !== 'signedIn') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (profile.status === 'loading') return <Splash />;
  if (profile.status === 'missing') return <ProfileMissing />;

  const onboarded = profile.profile.onboardedAt != null;
  if (!onboarded && !onboarding) return <Navigate to="/onboarding" replace />;
  if (onboarded && onboarding) return <Navigate to="/" replace />;
  return <Outlet />;
}

/** Sign-in and sign-up: signed-in users go back where they came from, or home. */
export function RequireGuest() {
  const auth = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  if (auth.status === 'loading') return <Splash />;
  if (auth.status === 'signedIn') return <Navigate to={from ?? '/'} replace />;
  return <Outlet />;
}
