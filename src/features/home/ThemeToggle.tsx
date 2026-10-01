import { useSyncExternalStore } from 'react';
import { MoonGlyph, SunGlyph } from '../../components/icons';
import { useUser } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { updateProfile } from '../../lib/db/profile';

const DARK_QUERY = '(prefers-color-scheme: dark)';

/** null where matchMedia is unavailable (old browsers, tests). */
const darkQuery = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(DARK_QUERY)
    : null;

function useSystemDark(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = darkQuery();
      mq?.addEventListener('change', cb);
      return () => mq?.removeEventListener('change', cb);
    },
    () => darkQuery()?.matches ?? false,
    () => false,
  );
}

/** One tap flips the whole app between black-on-white and white-on-black. */
export function ThemeToggle() {
  const user = useUser();
  const { theme } = useProfile();
  const systemDark = useSystemDark();
  const dark = theme === 'dark' || (theme === 'system' && systemDark);
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={dark}
      onClick={() => {
        updateProfile(user.uid, { theme: dark ? 'light' : 'dark' }).catch(() => undefined);
      }}
    >
      {dark ? <SunGlyph size={26} /> : <MoonGlyph size={26} />}
    </button>
  );
}
