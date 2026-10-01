import { subscribeCharts } from '../lib/db/charts';
import { subscribeProgram, subscribePrograms, type WithId } from '../lib/db/programs';
import type { EffortChart, Program } from '../lib/types';
import { useUser } from './useAuth';
import { useLive } from './useLive';

export function usePrograms() {
  const { uid } = useUser();
  return useLive<WithId<Program>[]>(`programs:${uid}`, (onData, onError) =>
    subscribePrograms(uid, onData, onError),
  );
}

export function useProgram(id: string) {
  const { uid } = useUser();
  return useLive<WithId<Program> | null>(`program:${uid}:${id}`, (onData, onError) =>
    subscribeProgram(uid, id, onData, onError),
  );
}

export function useCharts() {
  const { uid } = useUser();
  return useLive<WithId<EffortChart>[]>(`charts:${uid}`, (onData, onError) =>
    subscribeCharts(uid, onData, onError),
  );
}
