/**
 * Friends (CLAUDE.md §5.9): requests by username, accept/decline/cancel,
 * remove, and reading friends' finished sessions. Rules enforce all of it.
 */
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { getFirebase } from '../firebase';
import type { Friend, FriendRequest, Session, UsernameClaim } from '../types';
import { usernameKey } from '../validation';
import { USERS } from './profile';
import type { WithId } from './programs';
import { USERNAMES } from './usernames';

export const FRIEND_REQUESTS = 'friendRequests';

const db = () => getFirebase().db;
const friendsCol = (uid: string) => collection(db(), USERS, uid, 'friends');
const requestRef = (from: string, to: string) => doc(db(), FRIEND_REQUESTS, `${from}_${to}`);

export class FriendError extends Error {}

export function subscribeFriends(
  uid: string,
  onData: (friends: WithId<Friend>[]) => void,
  onError: (err: Error) => void,
): () => void {
  return onSnapshot(
    query(friendsCol(uid), orderBy('username')),
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Friend) }))),
    onError,
  );
}

export function subscribeFriendRequests(
  uid: string,
  direction: 'incoming' | 'outgoing',
  onData: (requests: WithId<FriendRequest>[]) => void,
  onError: (err: Error) => void,
): () => void {
  return onSnapshot(
    query(
      collection(db(), FRIEND_REQUESTS),
      where(direction === 'incoming' ? 'to' : 'from', '==', uid),
    ),
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as FriendRequest) }))),
    onError,
  );
}

/** Look up a username and send them a request. Throws FriendError with a friendly message. */
export async function sendFriendRequest(
  me: { uid: string; username: string },
  targetUsername: string,
): Promise<void> {
  const name = targetUsername.trim().replace(/^@/, '');
  if (!name) throw new FriendError('Enter a username.');
  const claim = await getDoc(doc(db(), USERNAMES, usernameKey(name)));
  if (!claim.exists()) throw new FriendError(`No subject named "${name}".`);
  const { uid, username } = claim.data() as UsernameClaim;
  if (uid === me.uid) throw new FriendError("That's you.");
  if ((await getDoc(doc(friendsCol(me.uid), uid))).exists()) {
    throw new FriendError(`You and ${username} are already friends.`);
  }
  await setDoc(requestRef(me.uid, uid), {
    from: me.uid,
    to: uid,
    fromUsername: me.username,
    toUsername: username,
    createdAt: serverTimestamp(),
  });
}

/** Accept: both friend docs and the request delete, in one batch. */
export function acceptFriendRequest(me: string, req: FriendRequest): Promise<void> {
  const batch = writeBatch(db());
  batch.set(doc(friendsCol(me), req.from), {
    username: req.fromUsername,
    since: serverTimestamp(),
  });
  batch.set(doc(friendsCol(req.from), me), { username: req.toUsername, since: serverTimestamp() });
  batch.delete(requestRef(req.from, req.to));
  return batch.commit();
}

/** Decline (as recipient) or cancel (as sender). */
export function deleteFriendRequest(req: FriendRequest): Promise<void> {
  return deleteDoc(requestRef(req.from, req.to));
}

export function removeFriend(me: string, friendUid: string): Promise<void> {
  const batch = writeBatch(db());
  batch.delete(doc(friendsCol(me), friendUid));
  batch.delete(doc(friendsCol(friendUid), me));
  return batch.commit();
}

/** A friend's latest finished sessions. */
export function subscribeFriendSessions(
  friendUid: string,
  count: number,
  onData: (sessions: WithId<Session>[]) => void,
  onError: (err: Error) => void,
): () => void {
  return onSnapshot(
    query(
      collection(db(), USERS, friendUid, 'sessions'),
      orderBy('startedAt', 'desc'),
      limit(count),
    ),
    (snap) =>
      onData(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data({ serverTimestamps: 'estimate' }) as Session),
        })),
      ),
    onError,
  );
}
