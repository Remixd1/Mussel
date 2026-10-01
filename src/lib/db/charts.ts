/** users/{uid}/charts: uploaded RPE/RIR -> %1RM charts. */
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
import type { ChartData, EffortChart } from '../types';
import { USERS } from './profile';
import type { WithId } from './programs';

const chartsCol = (uid: string) => collection(getFirebase().db, USERS, uid, 'charts');

export function subscribeCharts(
  uid: string,
  onData: (charts: WithId<EffortChart>[]) => void,
  onError: (err: Error) => void,
): () => void {
  return onSnapshot(
    query(chartsCol(uid), orderBy('updatedAt', 'desc')),
    (snap) =>
      onData(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data({ serverTimestamps: 'estimate' }) as EffortChart),
        })),
      ),
    onError,
  );
}

export function createChart(
  uid: string,
  name: string,
  chart: ChartData,
  sourceFileName: string,
): { id: string; saved: Promise<void> } {
  const ref = doc(chartsCol(uid));
  const saved = setDoc(ref, {
    name: name.trim(),
    sourceFileName,
    ...chart,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: ref.id, saved };
}

export function renameChart(uid: string, id: string, name: string): Promise<void> {
  return updateDoc(doc(chartsCol(uid), id), { name: name.trim(), updatedAt: serverTimestamp() });
}

export function deleteChart(uid: string, id: string): Promise<void> {
  return deleteDoc(doc(chartsCol(uid), id));
}
