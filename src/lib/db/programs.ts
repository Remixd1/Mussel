/**
 * users/{uid}/programs. Writes are fired without awaiting in UI handlers
 * (CLAUDE.md §11): the local snapshot updates at once, even offline.
 */
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
} from 'firebase/firestore';
import { getFirebase } from '../firebase';
import type { Program, ProgramDay, ProgramWeek } from '../types';
import { USERS } from './profile';

export type WithId<T> = T & { id: string };

const programsCol = (uid: string) => collection(getFirebase().db, USERS, uid, 'programs');
const programRef = (uid: string, id: string) => doc(programsCol(uid), id);

export function subscribePrograms(
  uid: string,
  onData: (programs: WithId<Program>[]) => void,
  onError: (err: Error) => void,
): () => void {
  return onSnapshot(
    query(programsCol(uid), orderBy('updatedAt', 'desc')),
    (snap) =>
      onData(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data({ serverTimestamps: 'estimate' }) as Program),
        })),
      ),
    onError,
  );
}

export function subscribeProgram(
  uid: string,
  id: string,
  onData: (program: WithId<Program> | null) => void,
  onError: (err: Error) => void,
): () => void {
  return onSnapshot(
    programRef(uid, id),
    (snap) =>
      onData(
        snap.exists()
          ? { id: snap.id, ...(snap.data({ serverTimestamps: 'estimate' }) as Program) }
          : null,
      ),
    onError,
  );
}

/** Create a program with its first week. Returns the new id immediately. */
export function createProgram(
  uid: string,
  name: string,
  week: ProgramWeek,
): { id: string; saved: Promise<void> } {
  const ref = doc(programsCol(uid));
  const saved = setDoc(ref, {
    name: name.trim(),
    weeks: [week],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: ref.id, saved };
}

/** Replace the weeks list (append, repeat, delete all go through here). */
function writeWeeks(uid: string, id: string, weeks: ProgramWeek[]): Promise<void> {
  return updateDoc(programRef(uid, id), { weeks, updatedAt: serverTimestamp() });
}

export function addWeek(uid: string, program: WithId<Program>, week: ProgramWeek): Promise<void> {
  return writeWeeks(uid, program.id, [...program.weeks, week]);
}

/** Copy a week as the next week (the "repeat one week" workflow). */
export function repeatWeek(uid: string, program: WithId<Program>, index: number): Promise<void> {
  const source = program.weeks[index];
  const copy: ProgramWeek = {
    label: nextWeekLabel(program.weeks),
    sourceFileName: null,
    days: structuredClone(source.days) as ProgramDay[],
  };
  return writeWeeks(uid, program.id, [...program.weeks, copy]);
}

export function deleteWeek(uid: string, program: WithId<Program>, index: number): Promise<void> {
  return writeWeeks(
    uid,
    program.id,
    program.weeks.filter((_, i) => i !== index),
  );
}

export function renameProgram(uid: string, id: string, name: string): Promise<void> {
  return updateDoc(programRef(uid, id), { name: name.trim(), updatedAt: serverTimestamp() });
}

export function deleteProgram(uid: string, id: string): Promise<void> {
  return deleteDoc(programRef(uid, id));
}

/** "Week N" following the highest existing week number. */
export function nextWeekLabel(weeks: readonly ProgramWeek[]): string {
  const numbers = weeks.map((w) => Number(w.label.match(/(\d+)/)?.[1] ?? 0));
  return `Week ${Math.max(weeks.length, ...numbers) + 1}`;
}
