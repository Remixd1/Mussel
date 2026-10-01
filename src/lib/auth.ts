/**
 * Account flows (CLAUDE.md §5.1): email + password with a unique username.
 * Sign-in persists on the device (see firebase.ts) until signOut().
 */
import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
} from 'firebase/auth';
import { createAccountRecords, deleteAccountRecords } from './db/account';
import { getFirebase } from './firebase';

// ---------------------------------------------------------------------------
// Sign-up in progress
//
// Firebase reports the new user as signed in the moment the Auth account
// exists, before the username + profile transaction has run. The auth
// provider hides the user until sign-up finishes, so guards never see a
// half-created account.
// ---------------------------------------------------------------------------

let signUpPending = false;
const pendingListeners = new Set<() => void>();

function setSignUpPending(value: boolean) {
  signUpPending = value;
  pendingListeners.forEach((fn) => fn());
}

export function isSignUpPending(): boolean {
  return signUpPending;
}

export function subscribeSignUpPending(fn: () => void): () => void {
  pendingListeners.add(fn);
  return () => pendingListeners.delete(fn);
}

// ---------------------------------------------------------------------------

export interface SignUpInput {
  email: string;
  username: string;
  password: string;
}

/**
 * Create the Auth account, then claim the username and create the profile in
 * one transaction. If that fails (e.g. the username was just taken), the Auth
 * account is deleted so the email can be used again, and the error rethrown.
 */
export async function signUp({ email, username, password }: SignUpInput): Promise<void> {
  const { auth } = getFirebase();
  setSignUpPending(true);
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    try {
      await createAccountRecords(cred.user.uid, username);
    } catch (err) {
      await deleteUser(cred.user).catch(() => undefined);
      throw err;
    }
  } finally {
    setSignUpPending(false);
  }
}

export async function signIn(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(getFirebase().auth, email.trim(), password);
}

export function signOut(): Promise<void> {
  return fbSignOut(getFirebase().auth);
}

export function sendPasswordReset(email: string): Promise<void> {
  return sendPasswordResetEmail(getFirebase().auth, email.trim());
}

/**
 * Permanently delete the signed-in account and all its data. Firebase needs a
 * recent sign-in to delete a user, so the password is confirmed first.
 */
export async function deleteAccount(password: string): Promise<void> {
  const user = getFirebase().auth.currentUser;
  if (!user?.email) throw new Error('Not signed in.');
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
  await deleteAccountRecords(user.uid);
  await deleteUser(user);
}
