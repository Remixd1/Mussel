/**
 * Friends and workouts end to end against the Auth + Firestore emulators,
 * through the app's db layer and the real rules.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { collection, doc, getDoc, getDocs, Timestamp } from 'firebase/firestore';
import { deleteAccount, signIn, signOut, signUp } from '../../src/lib/auth';
import { defaultChart } from '../../src/lib/calc/effort';
import { blankSet } from '../../src/lib/calc/workout';
import {
  acceptFriendRequest,
  FriendError,
  removeFriend,
  sendFriendRequest,
} from '../../src/lib/db/friends';
import { finishSession, newActiveSession, saveActiveSession } from '../../src/lib/db/sessions';
import { DEMO_PROJECT_ID, getFirebase } from '../../src/lib/firebase';
import type { EstimatedMax, FriendRequest, Session } from '../../src/lib/types';

const { auth, db } = getFirebase();
const PASSWORD = 'correct-horse-9';
const users = {
  alice: { email: 'alice@example.com', username: 'Alice_01', uid: '' },
  bob: { email: 'bob@example.com', username: 'Bob_Lifts', uid: '' },
  carol: { email: 'carol@example.com', username: 'Carol', uid: '' },
};

async function reset() {
  await signOut().catch(() => undefined);
  await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${DEMO_PROJECT_ID}/accounts`, {
    method: 'DELETE',
  });
  await fetch(
    `http://127.0.0.1:8080/emulator/v1/projects/${DEMO_PROJECT_ID}/databases/(default)/documents`,
    { method: 'DELETE' },
  );
}

async function as(who: keyof typeof users) {
  await signOut();
  await signIn(users[who].email, PASSWORD);
  return users[who];
}

/** Log and finish a one-exercise workout as the signed-in user. */
async function logWorkout(title: string) {
  const uid = auth.currentUser!.uid;
  const active = newActiveSession(
    title,
    [
      {
        exerciseId: 'back-squat',
        exerciseName: 'Back Squat',
        iconId: 'squat',
        maxKg: 200,
        restSec: 120,
        dropPercent: null,
        note: null,
        sets: [
          { reps: 5, rpe: 8, weightKg: 160, done: true },
          { ...blankSet(5, 8), weightKg: 170, rpe: 9, done: true },
        ],
      },
    ],
    null,
  );
  active.startedAt = Timestamp.fromDate(new Date(Date.now() - 50 * 60 * 1000));
  await saveActiveSession(uid, active);
  const { id, saved } = finishSession(uid, active, defaultChart(), () => 200);
  await saved;
  return id;
}

beforeAll(async () => {
  await reset();
  for (const u of Object.values(users)) {
    await signUp({ email: u.email, username: u.username, password: PASSWORD });
    u.uid = auth.currentUser!.uid;
    await signOut();
  }
});
afterAll(reset);

describe('finishing a workout', () => {
  it('writes the session, raises the max, and clears the active workout', async () => {
    const me = await as('alice');
    const id = await logWorkout('Leg Day');

    const session = (await getDoc(doc(db, 'users', me.uid, 'sessions', id))).data() as Session;
    expect(session.title).toBe('Leg Day');
    expect(session.totals.setCount).toBe(2);
    expect(session.totals.volumeKg).toBe(5 * 160 + 5 * 170);
    expect(session.totals.durationSec).toBeGreaterThanOrEqual(50 * 60 - 5);

    const max = (
      await getDoc(doc(db, 'users', me.uid, 'maxes', 'back-squat'))
    ).data() as EstimatedMax;
    // 170 kg x 5 @ 9 on the built-in chart beats the 200 kg PR.
    expect(max.e1rmKg).toBeGreaterThan(200);
    expect(max.source).toBe('session');
    expect(max.sessionId).toBe(id);

    const active = await getDoc(doc(db, 'users', me.uid, 'meta', 'activeSession'));
    expect(active.exists()).toBe(false);
  });
});

describe('friends', () => {
  it('rejects unknown names, yourself, and sends a real request', async () => {
    const me = await as('alice');
    await expect(sendFriendRequest(me, 'nobody_here')).rejects.toBeInstanceOf(FriendError);
    await expect(sendFriendRequest(me, 'alice_01')).rejects.toThrow("That's you.");
    await sendFriendRequest(me, '@bob_lifts');
    const req = await getDoc(doc(db, 'friendRequests', `${me.uid}_${users.bob.uid}`));
    expect(req.data()).toMatchObject({ fromUsername: 'Alice_01', toUsername: 'Bob_Lifts' });
  });

  it('strangers cannot read workouts before accepting', async () => {
    await as('bob');
    await expect(
      getDocs(collection(db, 'users', users.alice.uid, 'sessions')),
    ).rejects.toMatchObject({
      code: 'permission-denied',
    });
  });

  it("accepting lets both read each other's workouts", async () => {
    const bob = await as('bob');
    const req = (
      await getDoc(doc(db, 'friendRequests', `${users.alice.uid}_${bob.uid}`))
    ).data() as FriendRequest;
    await acceptFriendRequest(bob.uid, req);
    await logWorkout('Bench Day');

    const aliceSessions = await getDocs(collection(db, 'users', users.alice.uid, 'sessions'));
    expect(aliceSessions.docs.map((d) => d.data().title)).toEqual(['Leg Day']);

    await as('alice');
    const bobSessions = await getDocs(collection(db, 'users', bob.uid, 'sessions'));
    expect(bobSessions.docs.map((d) => d.data().title)).toEqual(['Bench Day']);
    await expect(sendFriendRequest(users.alice, 'Bob_Lifts')).rejects.toThrow(/already friends/);
  });

  it('a third person still sees nothing', async () => {
    await as('carol');
    await expect(
      getDocs(collection(db, 'users', users.alice.uid, 'sessions')),
    ).rejects.toMatchObject({
      code: 'permission-denied',
    });
  });

  it('removing the friendship ends access both ways', async () => {
    const alice = await as('alice');
    await removeFriend(alice.uid, users.bob.uid);
    await expect(getDocs(collection(db, 'users', users.bob.uid, 'sessions'))).rejects.toMatchObject(
      {
        code: 'permission-denied',
      },
    );
  });

  it('deleting an account removes its friend links and requests', async () => {
    const carol = await as('carol');
    await sendFriendRequest(carol, 'Alice_01');
    const alice = await as('alice');
    await acceptFriendRequest(alice.uid, {
      from: carol.uid,
      to: alice.uid,
      fromUsername: 'Carol',
      toUsername: 'Alice_01',
    } as FriendRequest);
    await sendFriendRequest(alice, 'Bob_Lifts');

    await deleteAccount(PASSWORD);

    const adminGet = async (path: string) =>
      (
        await fetch(
          `http://127.0.0.1:8080/v1/projects/${DEMO_PROJECT_ID}/databases/(default)/documents/${path}`,
          { headers: { Authorization: 'Bearer owner' } },
        )
      ).status;
    expect(await adminGet(`users/${carol.uid}/friends/${alice.uid}`)).toBe(404);
    expect(await adminGet(`friendRequests/${alice.uid}_${users.bob.uid}`)).toBe(404);
    expect(await adminGet(`users/${alice.uid}`)).toBe(404);
  });
});
