import { doc, getDoc } from 'firebase/firestore';
import { getFirebase } from '../firebase';
import { usernameKey } from '../validation';

export const USERNAMES = 'usernames';

export function usernameRef(username: string) {
  return doc(getFirebase().db, USERNAMES, usernameKey(username));
}

/**
 * Whether a username is free right now. Advisory only (for live feedback);
 * the sign-up transaction is what actually enforces uniqueness.
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const snap = await getDoc(usernameRef(username));
  return !snap.exists();
}
