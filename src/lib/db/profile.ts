import { doc, onSnapshot, serverTimestamp, updateDoc, type FieldValue } from 'firebase/firestore';
import { getFirebase } from '../firebase';
import type { UserProfile } from '../types';
import { generateSubjectNumber, usernameKey } from '../validation';

export const USERS = 'users';

export function profileRef(uid: string) {
  return doc(getFirebase().db, USERS, uid);
}

/** Fields that exist on a brand new profile (timestamps added at write time). */
export function newProfileFields(username: string) {
  return {
    username,
    usernameLower: usernameKey(username),
    subjectNumber: generateSubjectNumber(),
    units: 'lb',
    effortScale: 'rpe',
    defaultRestSec: 90,
    theme: 'system',
    announcerOn: true,
    soundOn: false,
    scanlinesOn: false,
    activeChartId: null,
    onboardedAt: null,
  } satisfies Omit<UserProfile, 'createdAt'>;
}

export type ProfileState =
  { status: 'loading' } | { status: 'missing' } | { status: 'ready'; profile: UserProfile };

/**
 * Live profile. A "doesn't exist" answer that came only from the offline
 * cache is treated as still loading, so a cold start never flashes onboarding.
 */
export function subscribeProfile(
  uid: string,
  onState: (state: ProfileState) => void,
  onError: (err: Error) => void,
): () => void {
  return onSnapshot(
    profileRef(uid),
    { includeMetadataChanges: true },
    (snap) => {
      // 'estimate' so a just-written serverTimestamp (e.g. onboardedAt) reads as
      // a date locally instead of null until the server confirms it.
      if (snap.exists()) {
        onState({
          status: 'ready',
          profile: snap.data({ serverTimestamps: 'estimate' }) as UserProfile,
        });
      } else if (snap.metadata.fromCache) onState({ status: 'loading' });
      else onState({ status: 'missing' });
    },
    onError,
  );
}

/** Settings the user may change after sign-up. Username is permanent. */
export type ProfilePatch = Partial<
  Pick<
    UserProfile,
    | 'units'
    | 'effortScale'
    | 'defaultRestSec'
    | 'theme'
    | 'announcerOn'
    | 'soundOn'
    | 'scanlinesOn'
    | 'activeChartId'
  >
> & { onboardedAt?: FieldValue };

/**
 * Update settings. Resolves when the server acknowledges, which never happens
 * offline, so UI handlers fire this without awaiting (CLAUDE.md §11). The
 * local snapshot updates immediately either way.
 */
export function updateProfile(uid: string, patch: ProfilePatch): Promise<void> {
  return updateDoc(profileRef(uid), patch);
}

export function completeOnboarding(
  uid: string,
  settings: Pick<UserProfile, 'units' | 'effortScale' | 'defaultRestSec'>,
): Promise<void> {
  return updateProfile(uid, { ...settings, onboardedAt: serverTimestamp() });
}
