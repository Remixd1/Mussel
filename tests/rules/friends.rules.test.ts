/**
 * Security rules for friends (CLAUDE.md §5.9, §7): requests, accepting,
 * removing, and what a friend can read.
 */
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
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

let env: RulesTestEnvironment;

const ALICE = 'alice';
const BOB = 'bob';
const CAROL = 'carol';

const profile = (username: string) => ({
  username,
  usernameLower: username.toLowerCase(),
  subjectNumber: '0417',
});

const request = (from: string, to: string, fromUsername: string, toUsername: string) => ({
  from,
  to,
  fromUsername,
  toUsername,
  createdAt: new Date(),
});

const as = (uid: string) => env.authenticatedContext(uid).firestore();
const anon = () => env.unauthenticatedContext().firestore();

/** Alice sends Bob a request, with rules on. */
const sendAliceToBob = () =>
  setDoc(
    doc(as(ALICE), `friendRequests/${ALICE}_${BOB}`),
    request(ALICE, BOB, 'Alice_01', 'Bob_Lifts'),
  );

/** Bob accepts: both friend docs + request delete, in one batch. */
function bobAccepts() {
  const db = as(BOB);
  const batch = writeBatch(db);
  batch.set(doc(db, `users/${BOB}/friends/${ALICE}`), { username: 'Alice_01', since: new Date() });
  batch.set(doc(db, `users/${ALICE}/friends/${BOB}`), { username: 'Bob_Lifts', since: new Date() });
  batch.delete(doc(db, `friendRequests/${ALICE}_${BOB}`));
  return batch.commit();
}

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
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, `users/${ALICE}`), profile('Alice_01'));
    await setDoc(doc(db, `users/${BOB}`), profile('Bob_Lifts'));
    await setDoc(doc(db, `users/${CAROL}`), profile('Carol'));
  });
});

describe('friend requests', () => {
  it('the real sender can send one with the real usernames', async () => {
    await assertSucceeds(sendAliceToBob());
  });

  it("cannot be sent on someone else's behalf", async () => {
    await assertFails(
      setDoc(
        doc(as(CAROL), `friendRequests/${ALICE}_${BOB}`),
        request(ALICE, BOB, 'Alice_01', 'Bob_Lifts'),
      ),
    );
  });

  it('must carry the real usernames', async () => {
    await assertFails(
      setDoc(
        doc(as(ALICE), `friendRequests/${ALICE}_${BOB}`),
        request(ALICE, BOB, 'Admin', 'Bob_Lifts'),
      ),
    );
    await assertFails(
      setDoc(
        doc(as(ALICE), `friendRequests/${ALICE}_${BOB}`),
        request(ALICE, BOB, 'Alice_01', 'Robert'),
      ),
    );
  });

  it('needs the "<from>_<to>" id, an existing user, and not yourself', async () => {
    await assertFails(
      setDoc(
        doc(as(ALICE), 'friendRequests/whatever'),
        request(ALICE, BOB, 'Alice_01', 'Bob_Lifts'),
      ),
    );
    await assertFails(
      setDoc(
        doc(as(ALICE), `friendRequests/${ALICE}_ghost`),
        request(ALICE, 'ghost', 'Alice_01', 'Ghost'),
      ),
    );
    await assertFails(
      setDoc(
        doc(as(ALICE), `friendRequests/${ALICE}_${ALICE}`),
        request(ALICE, ALICE, 'Alice_01', 'Alice_01'),
      ),
    );
  });

  it('only the two people involved can read it', async () => {
    await sendAliceToBob();
    await assertSucceeds(getDoc(doc(as(ALICE), `friendRequests/${ALICE}_${BOB}`)));
    await assertSucceeds(getDoc(doc(as(BOB), `friendRequests/${ALICE}_${BOB}`)));
    await assertFails(getDoc(doc(as(CAROL), `friendRequests/${ALICE}_${BOB}`)));
    await assertFails(getDoc(doc(anon(), `friendRequests/${ALICE}_${BOB}`)));
  });

  it('can be listed by recipient or sender, but not wholesale', async () => {
    await sendAliceToBob();
    await assertSucceeds(
      getDocs(query(collection(as(BOB), 'friendRequests'), where('to', '==', BOB))),
    );
    await assertSucceeds(
      getDocs(query(collection(as(ALICE), 'friendRequests'), where('from', '==', ALICE))),
    );
    await assertFails(getDocs(collection(as(BOB), 'friendRequests')));
    await assertFails(
      getDocs(query(collection(as(CAROL), 'friendRequests'), where('to', '==', BOB))),
    );
  });

  it('can be declined or cancelled, but never edited', async () => {
    await sendAliceToBob();
    await assertFails(
      updateDoc(doc(as(ALICE), `friendRequests/${ALICE}_${BOB}`), { toUsername: 'X' }),
    );
    await assertFails(deleteDoc(doc(as(CAROL), `friendRequests/${ALICE}_${BOB}`)));
    await assertSucceeds(deleteDoc(doc(as(BOB), `friendRequests/${ALICE}_${BOB}`)));
    await sendAliceToBob();
    await assertSucceeds(deleteDoc(doc(as(ALICE), `friendRequests/${ALICE}_${BOB}`)));
  });
});

describe('accepting', () => {
  it('the recipient accepts, writing both sides in one batch', async () => {
    await sendAliceToBob();
    await assertSucceeds(bobAccepts());
  });

  it('nobody can add themselves to a list without a pending request', async () => {
    await assertFails(
      setDoc(doc(as(BOB), `users/${ALICE}/friends/${BOB}`), {
        username: 'Bob_Lifts',
        since: new Date(),
      }),
    );
    await assertFails(
      setDoc(doc(as(CAROL), `users/${ALICE}/friends/${CAROL}`), {
        username: 'Carol',
        since: new Date(),
      }),
    );
  });

  it("the sender cannot accept on the recipient's behalf", async () => {
    await sendAliceToBob();
    await assertFails(
      setDoc(doc(as(ALICE), `users/${BOB}/friends/${ALICE}`), {
        username: 'Alice_01',
        since: new Date(),
      }),
    );
  });

  it('the self-added entry must carry the real username and nothing else', async () => {
    await sendAliceToBob();
    await assertFails(
      setDoc(doc(as(BOB), `users/${ALICE}/friends/${BOB}`), {
        username: 'Admin',
        since: new Date(),
      }),
    );
    await assertFails(
      setDoc(doc(as(BOB), `users/${ALICE}/friends/${BOB}`), {
        username: 'Bob_Lifts',
        since: new Date(),
        admin: true,
      }),
    );
  });

  it('existing friends cannot send another request', async () => {
    await sendAliceToBob();
    await bobAccepts();
    await assertFails(sendAliceToBob());
  });
});

describe('what friends can see', () => {
  beforeEach(async () => {
    await sendAliceToBob();
    await bobAccepts();
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, `users/${ALICE}/sessions/s1`), { title: 'Push' });
      await setDoc(doc(db, `users/${BOB}/sessions/s1`), { title: 'Pull' });
      await setDoc(doc(db, `users/${ALICE}/programs/p1`), { name: 'Block' });
    });
  });

  it("friends can read each other's finished sessions", async () => {
    await assertSucceeds(getDoc(doc(as(BOB), `users/${ALICE}/sessions/s1`)));
    await assertSucceeds(getDocs(collection(as(BOB), `users/${ALICE}/sessions`)));
    await assertSucceeds(getDocs(collection(as(ALICE), `users/${BOB}/sessions`)));
  });

  it('but cannot write them', async () => {
    await assertFails(setDoc(doc(as(BOB), `users/${ALICE}/sessions/s2`), { title: 'Fake' }));
    await assertFails(deleteDoc(doc(as(BOB), `users/${ALICE}/sessions/s1`)));
  });

  it('and see nothing else: profile, programs, active workout, friends list', async () => {
    await assertFails(getDoc(doc(as(BOB), `users/${ALICE}`)));
    await assertFails(getDoc(doc(as(BOB), `users/${ALICE}/programs/p1`)));
    await assertFails(getDoc(doc(as(BOB), `users/${ALICE}/meta/activeSession`)));
    await assertFails(getDocs(collection(as(BOB), `users/${ALICE}/friends`)));
  });

  it('strangers still see nothing', async () => {
    await assertFails(getDoc(doc(as(CAROL), `users/${ALICE}/sessions/s1`)));
    await assertFails(getDocs(collection(as(CAROL), `users/${ALICE}/sessions`)));
  });

  it('either side can remove the friendship, after which access ends', async () => {
    const db = as(BOB);
    const batch = writeBatch(db);
    batch.delete(doc(db, `users/${BOB}/friends/${ALICE}`));
    batch.delete(doc(db, `users/${ALICE}/friends/${BOB}`));
    await assertSucceeds(batch.commit());
    await assertFails(getDoc(doc(as(BOB), `users/${ALICE}/sessions/s1`)));
    await assertFails(getDoc(doc(as(ALICE), `users/${BOB}/sessions/s1`)));
  });

  it("a third person cannot remove someone else's friend", async () => {
    await assertFails(deleteDoc(doc(as(CAROL), `users/${ALICE}/friends/${BOB}`)));
  });
});
