import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

// Runs under `firebase emulators:exec` (npm run test:rules), which sets
// FIRESTORE_EMULATOR_HOST for us.
let env: RulesTestEnvironment;

const ALICE = 'alice';
const BOB = 'bob';

// A representative path in every user subcollection.
const SUB_PATHS = (uid: string) => [
  `users/${uid}/sessions/s1`,
  `users/${uid}/meta/activeSession`,
  `users/${uid}/charts/c1`,
  `users/${uid}/maxes/back-squat`,
];

const profile = (username: string) => ({
  username,
  usernameLower: username.toLowerCase(),
  subjectNumber: '0417',
  units: 'lb',
});

/** A test context's Firestore (the library's compat type). */
type TestDb = ReturnType<
  RulesTestEnvironment['unauthenticatedContext']
>['firestore'] extends () => infer D
  ? D
  : never;

/** Sign-up as the app does it: username claim + profile in one batch. */
function claimAndCreate(db: TestDb, uid: string, username: string) {
  const batch = writeBatch(db);
  batch.set(doc(db, `usernames/${username.toLowerCase()}`), { uid, username });
  batch.set(doc(db, `users/${uid}`), profile(username));
  return batch.commit();
}

const as = (uid: string) => env.authenticatedContext(uid).firestore();
const anon = () => env.unauthenticatedContext().firestore();

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-mussel',
    firestore: { rules: readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8') },
  });
});

afterAll(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  // Seed Bob's account with rules disabled so attempts hit real docs.
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'usernames/bob_lifts'), { uid: BOB, username: 'Bob_Lifts' });
    await setDoc(doc(db, `users/${BOB}`), profile('Bob_Lifts'));
    for (const path of SUB_PATHS(BOB)) await setDoc(doc(db, path), { seeded: true });
    await setDoc(doc(db, 'global/config'), { seeded: true });
  });
});

describe('sign-up: username claim + profile', () => {
  it('succeeds when both are written together', async () => {
    await assertSucceeds(claimAndCreate(as(ALICE), ALICE, 'Alice_01'));
  });

  it('rejects a profile without a username claim', async () => {
    await assertFails(setDoc(doc(as(ALICE), `users/${ALICE}`), profile('Alice_01')));
  });

  it('rejects a username claim without a matching profile', async () => {
    await assertFails(
      setDoc(doc(as(ALICE), 'usernames/alice_01'), { uid: ALICE, username: 'Alice_01' }),
    );
  });

  it('rejects a username that is already taken', async () => {
    await assertFails(claimAndCreate(as(ALICE), ALICE, 'bob_lifts'));
    await assertFails(claimAndCreate(as(ALICE), ALICE, 'BOB_LIFTS'));
  });

  it('rejects claiming a username for someone else', async () => {
    const db = as(ALICE);
    const batch = writeBatch(db);
    batch.set(doc(db, 'usernames/alice_01'), { uid: 'mallory', username: 'Alice_01' });
    batch.set(doc(db, `users/${ALICE}`), profile('Alice_01'));
    await assertFails(batch.commit());
  });

  it.each(['ab', 'a'.repeat(21), 'has space', 'dash-name', 'émile'])(
    'rejects invalid username %j',
    async (name) => {
      await assertFails(claimAndCreate(as(ALICE), ALICE, name));
    },
  );

  it('rejects a doc id that does not match the lowercased username', async () => {
    const db = as(ALICE);
    const batch = writeBatch(db);
    batch.set(doc(db, 'usernames/alice_01'), { uid: ALICE, username: 'Someone_Else' });
    batch.set(doc(db, `users/${ALICE}`), { ...profile('Alice_01') });
    await assertFails(batch.commit());
  });

  it('rejects extra fields on the claim', async () => {
    const db = as(ALICE);
    const batch = writeBatch(db);
    batch.set(doc(db, 'usernames/alice_01'), { uid: ALICE, username: 'Alice_01', admin: true });
    batch.set(doc(db, `users/${ALICE}`), profile('Alice_01'));
    await assertFails(batch.commit());
  });

  it('stops one user from holding a second username', async () => {
    await assertSucceeds(claimAndCreate(as(ALICE), ALICE, 'Alice_01'));
    await assertFails(
      setDoc(doc(as(ALICE), 'usernames/alice_02'), { uid: ALICE, username: 'Alice_02' }),
    );
  });
});

describe('username index', () => {
  it('lets anyone, even signed out, check a single username', async () => {
    await assertSucceeds(getDoc(doc(anon(), 'usernames/bob_lifts')));
    await assertSucceeds(getDoc(doc(anon(), 'usernames/nobody_here')));
  });

  it('never allows listing usernames', async () => {
    await assertFails(getDocs(collection(anon(), 'usernames')));
    await assertFails(getDocs(collection(as(ALICE), 'usernames')));
  });

  it('never allows changing a claim', async () => {
    await assertFails(updateDoc(doc(as(BOB), 'usernames/bob_lifts'), { username: 'BOB_LIFTS' }));
  });

  it('lets only the owner release their username', async () => {
    await assertFails(deleteDoc(doc(as(ALICE), 'usernames/bob_lifts')));
    await assertFails(deleteDoc(doc(anon(), 'usernames/bob_lifts')));
    await assertSucceeds(deleteDoc(doc(as(BOB), 'usernames/bob_lifts')));
  });
});

describe('profile', () => {
  it('owner can read, update settings, and delete', async () => {
    const db = as(BOB);
    await assertSucceeds(getDoc(doc(db, `users/${BOB}`)));
    await assertSucceeds(updateDoc(doc(db, `users/${BOB}`), { units: 'kg' }));
    await assertSucceeds(deleteDoc(doc(db, `users/${BOB}`)));
  });

  it('username is permanent', async () => {
    const db = as(BOB);
    await assertFails(updateDoc(doc(db, `users/${BOB}`), { username: 'Robert' }));
    await assertFails(updateDoc(doc(db, `users/${BOB}`), { usernameLower: 'robert' }));
  });

  it('other users and signed-out visitors get nothing', async () => {
    await assertFails(getDoc(doc(as(ALICE), `users/${BOB}`)));
    await assertFails(updateDoc(doc(as(ALICE), `users/${BOB}`), { units: 'kg' }));
    await assertFails(deleteDoc(doc(as(ALICE), `users/${BOB}`)));
    await assertFails(getDoc(doc(anon(), `users/${BOB}`)));
  });
});

describe('user subcollections', () => {
  it.each(SUB_PATHS(ALICE))('owner can write, read, and delete %s', async (path) => {
    const db = as(ALICE);
    await assertSucceeds(setDoc(doc(db, path), { value: 1 }));
    await assertSucceeds(getDoc(doc(db, path)));
    await assertSucceeds(deleteDoc(doc(db, path)));
  });

  it('owner can write deeply nested docs under their own tree', async () => {
    await assertSucceeds(setDoc(doc(as(ALICE), `users/${ALICE}/a/b/c/d`), { value: 1 }));
  });

  it.each(SUB_PATHS(BOB))("user cannot read or write another user's %s", async (path) => {
    const db = as(ALICE);
    await assertFails(getDoc(doc(db, path)));
    await assertFails(setDoc(doc(db, path), { hacked: true }));
    await assertFails(deleteDoc(doc(db, path)));
  });

  it.each(SUB_PATHS(BOB))('signed-out visitors cannot read or write %s', async (path) => {
    await assertFails(getDoc(doc(anon(), path)));
    await assertFails(setDoc(doc(anon(), path), { value: 1 }));
  });
});

describe('default deny', () => {
  it('denies collections outside users/ and usernames/ even when signed in', async () => {
    await assertFails(getDoc(doc(as(ALICE), 'global/config')));
    await assertFails(setDoc(doc(as(ALICE), 'global/other'), { value: 1 }));
  });
});
