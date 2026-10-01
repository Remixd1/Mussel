import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ClipboardGlyph, HistoryGlyph } from '../../components/icons';
import { Button } from '../../components/ui';
import { useCopy } from '../../hooks/useCopy';
import { useProfile } from '../../hooks/useProfile';
import { useRoutines, useSessions } from '../../hooks/useWorkoutData';
import { formatWeight } from '../../lib/calc/units';
import { EmptyState } from './ProfileSection';

/** Profile > Workouts: the user's routines. */
export function RoutinesList() {
  const copy = useCopy();
  const routines = useRoutines();
  const list = routines.status === 'ready' ? routines.data : [];
  return (
    <div className="px-stack">
      {routines.status === 'ready' && !list.length ? (
        <EmptyState icon="squat" message={copy('profile.noWorkouts')} />
      ) : null}
      <ul className="list">
        {list.map((r) => (
          <li key={r.id}>
            <Link to={`/workout/routines/${r.id}`} className="list-row">
              <span className="list-row__icon">
                <ClipboardGlyph size={24} />
              </span>
              <span className="list-row__text">
                <span className="list-row__title">{r.name}</span>
                <span className="list-row__meta">
                  {r.entries.length} {r.entries.length === 1 ? 'exercise' : 'exercises'}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link to="/workout/routines/new" className="px-btn px-btn--secondary px-btn--block">
        + New routine
      </Link>
    </div>
  );
}

const PAGE = 20;

/** Profile > History: finished sessions, newest first, 20 at a time. */
export function HistoryList() {
  const copy = useCopy();
  const { units } = useProfile();
  const [count, setCount] = useState(PAGE);
  const sessions = useSessions(count);
  const list = sessions.status === 'ready' ? sessions.data : [];
  return (
    <div className="px-stack">
      {sessions.status === 'ready' && !list.length ? (
        <EmptyState icon="rest" message={copy('profile.noHistory')} />
      ) : null}
      <ul className="list">
        {list.map((s) => (
          <li key={s.id}>
            <Link to={`/workout/summary/${s.id}`} className="list-row">
              <span className="list-row__icon">
                <HistoryGlyph size={24} />
              </span>
              <span className="list-row__text">
                <span className="list-row__title">{s.title}</span>
                <span className="list-row__meta">
                  {format(s.startedAt.toDate(), 'EEE d MMM')} · {s.totals.setCount} sets ·{' '}
                  {formatWeight(s.totals.volumeKg, units)} {units}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {list.length === count ? (
        <Button variant="secondary" block onClick={() => setCount((c) => c + PAGE)}>
          Load more
        </Button>
      ) : null}
    </div>
  );
}
