/**
 * The workout in progress (users/{uid}/meta/activeSession), finished
 * sessions (users/{uid}/sessions), and maxes (users/{uid}/maxes).
 */
import {
  collection,
  deleteDoc,
  doc,
  FieldPath,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { exerciseKey, maxUpdates, memoryFromEntry, sessionTotals } from '../calc/workout';
import { getFirebase } from '../firebase';
import type {
  ActiveSession,
  ChartData,
  EstimatedMax,
  ExerciseMemory,
  Session,
  SessionEntry,
} from '../types';
import { USERS } from './profile';
import type { WithId } from './programs';

const activeRef = (uid: string) => doc(getFirebase().db, USERS, uid, 'meta', 'activeSession');
const sessionsCol = (uid: string) => collection(getFirebase().db, USERS, uid, 'sessions');
const maxesCol = (uid: string) => collection(getFirebase().db, USERS, uid, 'maxes');
const memoryCol = (uid: string) => collection(getFirebase().db, USERS, uid, 'exerciseMemory');

// ---------------------------------------------------------------------------
// Active session
// ---------------------------------------------------------------------------

export function subscribeActiveSession(
  uid: string,
  onData: (session: ActiveSession | null) => void,
  onError: (err: Error) => void,
): () => void {
  return onSnapshot(
    activeRef(uid),
    (snap) => onData(snap.exists() ? (snap.data() as ActiveSession) : null),
    onError,
  );
}

export function newActiveSession(
  title: string,
  entries: SessionEntry[],
  chartId: string | null,
): ActiveSession {
  return {
    title,
    // Client time, so ordering works offline (CLAUDE.md §11).
    startedAt: Timestamp.fromDate(new Date()),
    chartId,
    notes: '',
    entries,
    restTimer: { endsAt: null, durationSec: 0, exerciseName: null },
  };
}

/** Save the whole in-progress session (callers debounce). */
export function saveActiveSession(uid: string, session: ActiveSession): Promise<void> {
  return setDoc(activeRef(uid), session);
}

export function discardActiveSession(uid: string): Promise<void> {
  return deleteDoc(activeRef(uid));
}

/**
 * Finish: one batch writes the session, updates maxes, remembers each
 * exercise's sets for next time, and deletes the active session. Returns the new session id immediately (works offline).
 */
export function finishSession(
  uid: string,
  active: ActiveSession,
  chart: ChartData,
  storedMax: (key: string) => number | null,
): { id: string; saved: Promise<void> } {
  const { db } = getFirebase();
  const ref = doc(sessionsCol(uid));
  const endedAt = new Date();
  const session: Omit<Session, 'createdAt' | 'updatedAt'> = {
    title: active.title,
    startedAt: active.startedAt,
    endedAt: Timestamp.fromDate(endedAt),
    chartId: active.chartId,
    notes: active.notes,
    entries: active.entries,
    totals: sessionTotals(active.entries, active.startedAt.toDate(), endedAt),
  };
  const batch = writeBatch(db);
  batch.set(ref, { ...session, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  for (const m of maxUpdates(active.entries, chart, storedMax)) {
    batch.set(doc(maxesCol(uid), m.key), {
      exerciseName: m.exerciseName,
      e1rmKg: m.e1rmKg,
      source: m.source,
      sessionId: ref.id,
      updatedAt: serverTimestamp(),
    });
  }
  // Remember what was lifted. lastSets is replaced; weightByEffort merges, so
  // reps + RPE combinations from older workouts are kept.
  const remembered = new Map<
    string,
    { name: string; mem: NonNullable<ReturnType<typeof memoryFromEntry>> }
  >();
  for (const e of active.entries) {
    const mem = memoryFromEntry(e);
    if (!mem) continue;
    const key = exerciseKey(e.exerciseId, e.exerciseName);
    const prev = remembered.get(key);
    // The same exercise twice in one workout (e.g. top set + back-offs): keep both.
    remembered.set(
      key,
      prev
        ? {
            name: e.exerciseName,
            mem: {
              lastSets: [...prev.mem.lastSets, ...mem.lastSets],
              weightByEffort: { ...prev.mem.weightByEffort, ...mem.weightByEffort },
            },
          }
        : { name: e.exerciseName, mem },
    );
  }
  for (const [key, { name, mem }] of remembered) {
    batch.set(
      doc(memoryCol(uid), key),
      {
        exerciseName: name,
        lastSets: mem.lastSets,
        weightByEffort: mem.weightByEffort,
        updatedAt: serverTimestamp(),
      },
      {
        mergeFields: [
          'exerciseName',
          'lastSets',
          'updatedAt',
          ...Object.keys(mem.weightByEffort).map((k) => new FieldPath('weightByEffort', k)),
        ],
      },
    );
  }
  batch.delete(activeRef(uid));
  return { id: ref.id, saved: batch.commit() };
}

// ---------------------------------------------------------------------------
// Finished sessions + maxes
// ---------------------------------------------------------------------------

export function subscribeSessions(
  uid: string,
  count: number,
  onData: (sessions: WithId<Session>[]) => void,
  onError: (err: Error) => void,
): () => void {
  return onSnapshot(
    query(sessionsCol(uid), orderBy('startedAt', 'desc'), limit(count)),
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

export function subscribeSession(
  uid: string,
  id: string,
  onData: (session: WithId<Session> | null) => void,
  onError: (err: Error) => void,
): () => void {
  return onSnapshot(
    doc(sessionsCol(uid), id),
    (snap) =>
      onData(
        snap.exists()
          ? { id: snap.id, ...(snap.data({ serverTimestamps: 'estimate' }) as Session) }
          : null,
      ),
    onError,
  );
}

export function deleteSession(uid: string, id: string): Promise<void> {
  return deleteDoc(doc(sessionsCol(uid), id));
}

export function subscribeExerciseMemory(
  uid: string,
  onData: (memory: Record<string, ExerciseMemory>) => void,
  onError: (err: Error) => void,
): () => void {
  return onSnapshot(
    memoryCol(uid),
    (snap) => onData(Object.fromEntries(snap.docs.map((d) => [d.id, d.data() as ExerciseMemory]))),
    onError,
  );
}

export function subscribeMaxes(
  uid: string,
  onData: (maxes: Record<string, EstimatedMax>) => void,
  onError: (err: Error) => void,
): () => void {
  return onSnapshot(
    maxesCol(uid),
    (snap) => onData(Object.fromEntries(snap.docs.map((d) => [d.id, d.data() as EstimatedMax]))),
    onError,
  );
}
