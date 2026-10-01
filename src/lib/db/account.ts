import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { UsernameTakenError } from '../authErrors';
import { getFirebase } from '../firebase';
import type { UserProfile } from '../types';
import { usernameKey } from '../validation';
import { newProfileFields, profileRef, USERS } from './profile';
import { FRIEND_REQUESTS } from './friends';
import { USERNAMES } from './usernames';

/** Every subcollection under users/{uid}. Keep in sync with CLAUDE.md §6. */
export const USER_SUBCOLLECTIONS = [
  'sessions',
  'routines',
  'programs',
  'charts',
  'maxes',
  'meta',
  'friends',
] as const;

/**
 * Atomically claim the username and create the profile. Rules require both
 * writes to land together (CLAUDE.md §7). Throws UsernameTakenError if the
 * name is already claimed.
 */
export async function createAccountRecords(uid: string, username: string): Promise<void> {
  const { db } = getFirebase();
  const name = username.trim();
  const claimRef = doc(db, USERNAMES, usernameKey(name));
  await runTransaction(db, async (tx) => {
    const claim = await tx.get(claimRef);
    if (claim.exists()) throw new UsernameTakenError();
    tx.set(claimRef, { uid, username: name });
    tx.set(profileRef(uid), { ...newProfileFields(name), createdAt: serverTimestamp() });
  });
}

// Firestore batches cap at 500 writes; stay under it.
const BATCH_LIMIT = 450;

/**
 * Delete all of a user's documents, their username claim, and their profile,
 * plus their side of every friendship and any pending friend requests.
 */
export async function deleteAccountRecords(uid: string): Promise<void> {
  const { db } = getFirebase();

  // Remove me from my friends' lists, and drop requests to or from me.
  const friends = await getDocs(collection(db, USERS, uid, 'friends'));
  const requests = [
    ...(await getDocs(query(collection(db, FRIEND_REQUESTS), where('from', '==', uid)))).docs,
    ...(await getDocs(query(collection(db, FRIEND_REQUESTS), where('to', '==', uid)))).docs,
  ];
  const links = [
    ...friends.docs.map((f) => doc(db, USERS, f.id, 'friends', uid)),
    ...requests.map((r) => r.ref),
  ];
  for (let i = 0; i < links.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    links.slice(i, i + BATCH_LIMIT).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }

  for (const name of USER_SUBCOLLECTIONS) {
    const snap = await getDocs(collection(db, USERS, uid, name));
    for (let i = 0; i < snap.docs.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      snap.docs.slice(i, i + BATCH_LIMIT).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }

  const profile = await getDoc(profileRef(uid));
  const batch = writeBatch(db);
  if (profile.exists()) {
    const { usernameLower } = profile.data() as UserProfile;
    batch.delete(doc(db, USERNAMES, usernameLower));
    batch.delete(profile.ref);
  }
  await batch.commit();
}
