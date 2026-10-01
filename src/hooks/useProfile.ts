import { useContext } from 'react';
import type { ProfileState } from '../lib/db/profile';
import type { UserProfile } from '../lib/types';
import { ProfileContext } from '../features/auth/contexts';

export function useProfileState(): ProfileState {
  return useContext(ProfileContext);
}

/** The loaded profile. Only call beneath RequireAuth, which waits for it. */
export function useProfile(): UserProfile {
  const state = useProfileState();
  if (state.status !== 'ready') throw new Error('useProfile must be used beneath RequireAuth');
  return state.profile;
}
