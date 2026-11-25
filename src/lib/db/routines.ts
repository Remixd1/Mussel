/** users/{uid}/routines: user-built and program-imported routines. */
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { routineEntriesFromDay, routineNameKey } from '../calc/workout';
import { getFirebase } from '../firebase';
import type { Program, Routine, RoutineEntry } from '../types';
import { USERS } from './profile';
import type { WithId } from './programs';

const routinesCol = (uid: string) => collection(getFirebase().db, USERS, uid, 'routines');

/** Newest first; routines saved together (a program import) sort by name. */
export function sortRoutines<T extends Pick<Routine, 'name' | 'updatedAt'>>(list: T[]): T[] {
  return [...list].sort(
    (x, y) =>
      (y.updatedAt?.toMillis() ?? 0) - (x.updatedAt?.toMillis() ?? 0) ||
      x.name.localeCompare(y.name, undefined, { numeric: true }),
  );
}

export function subscribeRoutines(
  uid: string,
  onData: (routines: WithId<Routine>[]) => void,
  onError: (err: Error) => void,
): () => void {
  return onSnapshot(
    query(routinesCol(uid), orderBy('updatedAt', 'desc')),
    (snap) =>
      onData(
        sortRoutines(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data({ serverTimestamps: 'estimate' }) as Routine),
          })),
        ),
      ),
    onError,
  );
}

export function saveRoutine(
  uid: string,
  id: string | null,
  data: { name: string; entries: RoutineEntry[] },
): { id: string; saved: Promise<void> } {
  if (id) {
    return {
      id,
      saved: updateDoc(doc(routinesCol(uid), id), {
        name: data.name.trim(),
        entries: data.entries,
        updatedAt: serverTimestamp(),
      }),
    };
  }
  const ref = doc(routinesCol(uid));
  return {
    id: ref.id,
    saved: setDoc(ref, {
      name: data.name.trim(),
      entries: data.entries,
      source: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  };
}

export function deleteRoutine(uid: string, id: string): Promise<void> {
  return deleteDoc(doc(routinesCol(uid), id));
}

/**
 * One routine per workout day of a program week ("<program> · <week> <day>").
 * Days whose routine name is already in use are skipped and listed.
 */
export function importProgramWeekAsRoutines(
  uid: string,
  program: WithId<Program>,
  weekIndex: number,
  restSec: number,
  existingNames: readonly string[] = [],
): { count: number; skipped: string[]; saved: Promise<void> } {
  const week = program.weeks[weekIndex];
  const batch = writeBatch(getFirebase().db);
  const taken = new Set(existingNames.map(routineNameKey));
  const nameFor = (label: string) => `${program.name} · ${week.label} ${label}`;
  const workoutDays = week.days.filter((d) => !d.rest && d.exercises.length);
  const skipped = workoutDays
    .map((d) => nameFor(d.label))
    .filter((n) => taken.has(routineNameKey(n)));
  const days = workoutDays.filter((d) => !taken.has(routineNameKey(nameFor(d.label))));
  for (const day of days) {
    batch.set(doc(routinesCol(uid)), {
      name: nameFor(day.label),
      entries: routineEntriesFromDay(day, restSec),
      source: { programId: program.id, week: week.label, day: day.label },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  return { count: days.length, skipped, saved: days.length ? batch.commit() : Promise.resolve() };
}
