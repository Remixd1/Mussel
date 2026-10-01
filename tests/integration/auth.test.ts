/**
 * End-to-end account flows against the Auth + Firestore emulators, using the
 * app's own lib code and the real security rules.
 */
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { deleteAccount, sendPasswordReset, signIn, signOut, signUp } from '../../src/lib/auth';
import { authErrorMessage, USERNAME_TAKEN } from '../../src/lib/authErrors';
import { completeOnboarding, updateProfile } from '../../src/lib/db/profile';
import { isUsernameAvailable } from '../../src/lib/db/usernames';
import { DEMO_PROJECT_ID, getFirebase } from '../../src/lib/firebase';
import type { UserProfile } from '../../src/lib/types';

const AUTH_EMULATOR = 'http://127.0.0.1:9099';
const FIRESTORE_EMULATOR = 'http://127.0.0.1:8080';

async function resetEmulators() {
  await signOut().catch(() => undefined);
  await fetch(`${AUTH_EMULATOR}/emulator/v1/projects/${DEMO_PROJECT_ID}/accounts`, {
    method: 'DELETE',
  });
  await fetch(
    `${FIRESTORE_EMULATOR}/emulator/v1/projects/${DEMO_PROJECT_ID}/databases/(default)/documents`,
    { method: 'DELETE' },
  );
}

/** Read a doc as the emulator admin ("Bearer owner" skips security rules). */
async function adminDocExists(path: string): Promise<boolean> {
  const res = await fetch(
    `${FIRESTORE_EMULATOR}/v1/projects/${DEMO_PROJECT_ID}/databases/(default)/documents/${path}`,
    { headers: { Authorization: 'Bearer owner' } },
  );
  return res.status === 200;
}

const { auth, db } = getFirebase();
const PASSWORD = 'correct-horse-9';

async function codeOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (err) {
    return (err as { code?: string }).code ?? 'no-code';
  }
  throw new Error('expected the promise to reject');
}

beforeEach(resetEmulators);
afterAll(resetEmulators);

describe('sign up', () => {
  it('creates the account, claims the username, and creates the profile', async () => {
    await signUp({ email: ' alice@example.com ', username: ' Alice_01 ', password: PASSWORD });

    const user = auth.currentUser;
    expect(user?.email).toBe('alice@example.com');

    const claim = await getDoc(doc(db, 'usernames/alice_01'));
    expect(claim.data()).toEqual({ uid: user!.uid, username: 'Alice_01' });

    const profile = (await getDoc(doc(db, `users/${user!.uid}`))).data() as UserProfile;
    expect(profile.username).toBe('Alice_01');
    expect(profile.usernameLower).toBe('alice_01');
    expect(profile.subjectNumber).toMatch(/^\d{4}$/);
    expect(profile.onboardedAt).toBeNull();
    expect(profile.createdAt).toBeDefined();
    expect(profile).not.toHaveProperty('email');
  });

  it('rejects a taken username (any case) and leaves no orphaned account', async () => {
    await signUp({ email: 'alice@example.com', username: 'Alice_01', password: PASSWORD });
    await signOut();

    const code = await codeOf(
      signUp({ email: 'mallory@example.com', username: 'ALICE_01', password: PASSWORD }),
    );
    expect(code).toBe(USERNAME_TAKEN);
    expect(auth.currentUser).toBeNull();

    // The rolled-back email is free again.
    await signUp({ email: 'mallory@example.com', username: 'Mallory', password: PASSWORD });
    expect(auth.currentUser?.email).toBe('mallory@example.com');
  });

  it('rejects an email that is already registered', async () => {
    await signUp({ email: 'alice@example.com', username: 'Alice_01', password: PASSWORD });
    await signOut();
    const code = await codeOf(
      signUp({ email: 'alice@example.com', username: 'Other', password: PASSWORD }),
    );
    expect(code).toBe('auth/email-already-in-use');
    expect(authErrorMessage({ code })).toMatch(/already exists/);
    // The username that was never claimed is still free.
    expect(await isUsernameAvailable('Other')).toBe(true);
  });
});

describe('username availability', () => {
  it('is readable while signed out', async () => {
    await signUp({ email: 'alice@example.com', username: 'Alice_01', password: PASSWORD });
    await signOut();
    expect(await isUsernameAvailable('alice_01')).toBe(false);
    expect(await isUsernameAvailable('ALICE_01')).toBe(false);
    expect(await isUsernameAvailable('someone_new')).toBe(true);
  });
});

describe('sign in / out', () => {
  beforeEach(async () => {
    await signUp({ email: 'alice@example.com', username: 'Alice_01', password: PASSWORD });
    await signOut();
  });

  it('signs in with email and password, and out again', async () => {
    await signIn('alice@example.com', PASSWORD);
    expect(auth.currentUser?.email).toBe('alice@example.com');
    await signOut();
    expect(auth.currentUser).toBeNull();
  });

  it('gives one message for a wrong password or unknown email', async () => {
    const wrongPassword = await codeOf(signIn('alice@example.com', 'nope-nope-nope'));
    const unknownEmail = await codeOf(signIn('nobody@example.com', PASSWORD));
    expect(authErrorMessage({ code: wrongPassword })).toBe('Email or password is incorrect.');
    expect(authErrorMessage({ code: unknownEmail })).toBe('Email or password is incorrect.');
  });

  it('sends a password reset email', async () => {
    await expect(sendPasswordReset('alice@example.com')).resolves.toBeUndefined();
  });
});

describe('profile', () => {
  it('saves settings and onboarding, but never a new username', async () => {
    await signUp({ email: 'alice@example.com', username: 'Alice_01', password: PASSWORD });
    const uid = auth.currentUser!.uid;

    await updateProfile(uid, { units: 'kg', theme: 'dark', announcerOn: false });
    await completeOnboarding(uid, { units: 'kg', effortScale: 'rir', defaultRestSec: 120 });

    const profile = (await getDoc(doc(db, `users/${uid}`))).data() as UserProfile;
    expect(profile).toMatchObject({
      units: 'kg',
      theme: 'dark',
      announcerOn: false,
      effortScale: 'rir',
      defaultRestSec: 120,
    });
    expect(profile.onboardedAt).not.toBeNull();

    const code = await codeOf(updateDoc(doc(db, `users/${uid}`), { username: 'Hacker' }));
    expect(code).toBe('permission-denied');
  });
});

describe('delete account', () => {
  it('requires the correct password', async () => {
    await signUp({ email: 'alice@example.com', username: 'Alice_01', password: PASSWORD });
    const code = await codeOf(deleteAccount('wrong-password'));
    expect(authErrorMessage({ code })).toBe('Email or password is incorrect.');
    expect(auth.currentUser).not.toBeNull();
  });

  it('erases the account, username, profile, and user data', async () => {
    await signUp({ email: 'alice@example.com', username: 'Alice_01', password: PASSWORD });
    const uid = auth.currentUser!.uid;
    await setDoc(doc(db, `users/${uid}/charts/c1`), { name: 'My chart' });
    await setDoc(doc(db, `users/${uid}/meta/activeSession`), { notes: '' });

    await deleteAccount(PASSWORD);
    expect(auth.currentUser).toBeNull();

    // Old docs are gone (checked as the emulator admin, bypassing rules).
    for (const path of [
      `users/${uid}`,
      `users/${uid}/charts/c1`,
      `users/${uid}/meta/activeSession`,
    ]) {
      expect(await adminDocExists(path), path).toBe(false);
    }

    // Username is released and the email can sign up again.
    expect(await isUsernameAvailable('Alice_01')).toBe(true);
    await signUp({ email: 'alice@example.com', username: 'Alice_01', password: PASSWORD });
    expect(auth.currentUser!.uid).not.toBe(uid);
  });
});
