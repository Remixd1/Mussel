import { createContext } from 'react';
import type { User } from 'firebase/auth';
import type { ProfileState } from '../../lib/db/profile';

export type AuthState =
  /** Restoring a cached session from this device. */
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; user: User }
  /** No Firebase config and no emulators: auth can't run at all. */
  | { status: 'unavailable' };

export const AuthContext = createContext<AuthState>({ status: 'loading' });

export const ProfileContext = createContext<ProfileState>({ status: 'loading' });
