import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { isSignUpPending, subscribeSignUpPending } from '../../lib/auth';
import { subscribeProfile, type ProfileState } from '../../lib/db/profile';
import { getFirebase, isFirebaseAvailable } from '../../lib/firebase';
import { AnnouncerContext } from '../../hooks/useCopy';
import { AuthContext, ProfileContext, type AuthState } from './contexts';

/**
 * Tracks the Firebase user (restored from this device's saved session) and
 * their live profile, and applies profile-driven settings app-wide.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const pending = useSyncExternalStore(subscribeSignUpPending, isSignUpPending);

  useEffect(() => {
    if (!isFirebaseAvailable) return;
    return onAuthStateChanged(getFirebase().auth, (u) => setUser(u));
  }, []);

  let auth: AuthState;
  if (!isFirebaseAvailable) auth = { status: 'unavailable' };
  else if (user === undefined) auth = { status: 'loading' };
  // Hide a half-created account until sign-up finishes (see lib/auth.ts).
  else if (user === null || pending) auth = { status: 'signedOut' };
  else auth = { status: 'signedIn', user };

  const uid = auth.status === 'signedIn' ? auth.user.uid : null;

  return (
    <AuthContext.Provider value={auth}>
      <ProfileProvider uid={uid}>{children}</ProfileProvider>
    </AuthContext.Provider>
  );
}

function ProfileProvider({ uid, children }: { uid: string | null; children: ReactNode }) {
  const [state, setState] = useState<{ uid: string | null; profile: ProfileState }>({
    uid: null,
    profile: { status: 'loading' },
  });

  useEffect(() => {
    if (!uid) return;
    return subscribeProfile(
      uid,
      (profile) => setState({ uid, profile }),
      // Permission errors etc. surface as "missing" so the user can sign out.
      () => setState({ uid, profile: { status: 'missing' } }),
    );
  }, [uid]);

  // Ignore a stale profile from a previous user while the new one loads.
  const profile: ProfileState = state.uid === uid ? state.profile : { status: 'loading' };
  const ready = profile.status === 'ready' ? profile.profile : null;

  useEffect(() => {
    const root = document.documentElement;
    const theme = ready?.theme ?? 'system';
    if (theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = theme;
  }, [ready?.theme]);

  return (
    <ProfileContext.Provider value={profile}>
      <AnnouncerContext.Provider value={ready?.announcerOn ?? true}>
        {children}
      </AnnouncerContext.Provider>
    </ProfileContext.Provider>
  );
}
