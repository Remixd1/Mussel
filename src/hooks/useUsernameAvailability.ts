import { useEffect, useState } from 'react';
import { isUsernameAvailable } from '../lib/db/usernames';
import { usernameKey, validateUsername } from '../lib/validation';

export type Availability = 'idle' | 'checking' | 'available' | 'taken' | 'unknown';

/** Debounced "is this username free?" for live feedback while typing. */
export function useUsernameAvailability(username: string, delayMs = 400): Availability {
  const key = usernameKey(username);
  const valid = validateUsername(username) === null;
  const [result, setResult] = useState<{ key: string; availability: Availability }>({
    key: '',
    availability: 'idle',
  });

  useEffect(() => {
    if (!valid) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      isUsernameAvailable(key)
        .then((free) => {
          if (!cancelled) setResult({ key, availability: free ? 'available' : 'taken' });
        })
        // Offline or rules not deployed: don't block sign-up; the transaction decides.
        .catch(() => {
          if (!cancelled) setResult({ key, availability: 'unknown' });
        });
    }, delayMs);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [key, valid, delayMs]);

  if (!valid) return 'idle';
  return result.key === key ? result.availability : 'checking';
}
