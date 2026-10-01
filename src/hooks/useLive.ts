import { useEffect, useState } from 'react';

export type Live<T> =
  { status: 'loading' } | { status: 'ready'; data: T } | { status: 'error'; error: Error };

type Subscribe<T> = (onData: (data: T) => void, onError: (err: Error) => void) => () => void;

/**
 * Live Firestore data from a db-layer subscribe function. `key` identifies
 * the query; when it changes, the hook resubscribes and reports loading.
 */
export function useLive<T>(key: string | null, subscribe: Subscribe<T>): Live<T> {
  const [state, setState] = useState<{ key: string | null; live: Live<T> }>({
    key: null,
    live: { status: 'loading' },
  });

  useEffect(() => {
    if (key === null) return;
    return subscribe(
      (data) => setState({ key, live: { status: 'ready', data } }),
      (error) => setState({ key, live: { status: 'error', error } }),
    );
    // `subscribe` is recreated each render; `key` captures what it reads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state.key === key ? state.live : { status: 'loading' };
}
