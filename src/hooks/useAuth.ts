import { useContext } from 'react';
import type { User } from 'firebase/auth';
import { AuthContext, type AuthState } from '../features/auth/contexts';

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

/** The signed-in user. Only call beneath RequireAuth. */
export function useUser(): User {
  const auth = useAuth();
  if (auth.status !== 'signedIn') throw new Error('useUser must be used beneath RequireAuth');
  return auth.user;
}
