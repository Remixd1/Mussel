import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';

// Runs under `firebase emulators:exec` (npm run test:rules), which sets
// FIRESTORE_EMULATOR_HOST for us.
let env: RulesTestEnvironment;

const ALICE = 'alice';
const BOB = 'bob';

// A representative path in every user collection, plus the profile doc.
const USER_PATHS = (uid: string) => [
  `users/${uid}`,
  `users/${uid}/sessions/s1`,
  `users/${uid}/meta/activeSession`,
  `users/${uid}/prs/back-squat`,
  `users/${uid}/exercises/custom1`,
  `users/${uid}/plans/p1`,
  `users/${uid}/bodyweight/2026-09-27`,
];

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
  // Seed Bob's data with rules disabled so read attempts hit real docs.
  await env.withSecurityRulesDisabled(async (ctx) => {
    for (const path of USER_PATHS(BOB)) await setDoc(doc(ctx.firestore(), path), { seeded: true });
    await setDoc(doc(ctx.firestore(), 'global/config'), { seeded: true });
  });
});

describe('owner access', () => {
  it.each(USER_PATHS(ALICE))('user can write, read, and delete own %s', async (path) => {
    const db = env.authenticatedContext(ALICE).firestore();
    await assertSucceeds(setDoc(doc(db, path), { value: 1 }));
    await assertSucceeds(getDoc(doc(db, path)));
    await assertSucceeds(deleteDoc(doc(db, path)));
  });

  it('user can write deeply nested docs under their own tree', async () => {
    const db = env.authenticatedContext(ALICE).firestore();
    await assertSucceeds(setDoc(doc(db, `users/${ALICE}/a/b/c/d`), { value: 1 }));
  });
});

describe('cross-user access', () => {
  it.each(USER_PATHS(BOB))("user cannot read another user's %s", async (path) => {
    const db = env.authenticatedContext(ALICE).firestore();
    await assertFails(getDoc(doc(db, path)));
  });

  it.each(USER_PATHS(BOB))("user cannot write another user's %s", async (path) => {
    const db = env.authenticatedContext(ALICE).firestore();
    await assertFails(setDoc(doc(db, path), { hacked: true }));
    await assertFails(deleteDoc(doc(db, path)));
  });
});

describe('unauthenticated access', () => {
  it.each(USER_PATHS(BOB))('is denied reading %s', async (path) => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, path)));
  });

  it.each(USER_PATHS(ALICE))('is denied writing %s', async (path) => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(db, path), { value: 1 }));
  });
});

describe('default deny', () => {
  it('denies collections outside users/ even when signed in', async () => {
    const db = env.authenticatedContext(ALICE).firestore();
    await assertFails(getDoc(doc(db, 'global/config')));
    await assertFails(setDoc(doc(db, 'global/other'), { value: 1 }));
  });
});
