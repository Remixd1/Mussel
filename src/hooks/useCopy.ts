import { createContext, useCallback, useContext } from 'react';
import { getCopy, type CopyKey } from '../copy/announcer';

/**
 * Whether themed announcer copy is on. Provided from the user profile
 * (Phase 1); defaults to on so screens render themed copy before sign-in.
 */
export const AnnouncerContext = createContext<boolean>(true);

export function useCopy(): (key: CopyKey) => string {
  const announcerOn = useContext(AnnouncerContext);
  return useCallback((key: CopyKey) => getCopy(key, announcerOn), [announcerOn]);
}
