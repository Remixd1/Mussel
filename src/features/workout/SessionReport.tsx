import { format } from 'date-fns';
import { Printout, PrintoutRow, PrintoutRule } from '../../components/ui';
import { useProfile } from '../../hooks/useProfile';
import { formatWeight } from '../../lib/calc/units';
import type { WithId } from '../../lib/db/programs';
import type { Session } from '../../lib/types';
import { formatDuration, formatSet } from './format';

/** Printout of a finished session: done sets per exercise and totals. */
export function SessionReport({ session }: { session: WithId<Session> }) {
  const { units, effortScale } = useProfile();
  const started = session.startedAt.toDate();
  return (
    <Printout
      title={session.title}
      subtitle={format(started, "EEE d MMM yyyy 'at' h:mm a")}
      code={session.id}
    >
      {session.entries.map((e, i) => {
        const done = e.sets.filter((s) => s.done);
        return (
          <div key={i} className="report-entry">
            <p className="report-entry__name">{e.exerciseName}</p>
            {done.length ? (
              <ul className="report-entry__sets px-num">
                {done.map((s, j) => (
                  <li key={j}>{formatSet(s, units, effortScale)}</li>
                ))}
              </ul>
            ) : (
              <p className="px-muted">No sets completed</p>
            )}
          </div>
        );
      })}
      <PrintoutRule />
      <PrintoutRow label="Sets" value={session.totals.setCount} />
      <PrintoutRow
        label="Volume"
        value={`${formatWeight(session.totals.volumeKg, units).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} ${units}`}
      />
      <PrintoutRow label="Duration" value={formatDuration(session.totals.durationSec)} />
      {session.notes ? (
        <>
          <PrintoutRule />
          <p className="report-notes">{session.notes}</p>
        </>
      ) : null}
    </Printout>
  );
}
