import { isPictogramId } from '../../components/icons';
import { PictoTile } from '../../components/ui';
import type { ProgramDay, Units } from '../../lib/types';
import { formatPrescription, formatSetsReps } from './format';

/** A week's days as expandable rows; each opens to its exercises. */
export function DayList({
  days,
  units,
  openFirst = false,
}: {
  days: readonly ProgramDay[];
  units: Units;
  openFirst?: boolean;
}) {
  const firstWorkout = days.findIndex((d) => !d.rest);
  return (
    <ul className="day-list">
      {days.map((day, i) => (
        <li key={i}>
          {day.rest ? (
            <div className="day day--rest">
              <span className="day__label">{day.label}</span>
              <span className="day__meta">Rest</span>
            </div>
          ) : (
            <details className="day" open={openFirst && i === firstWorkout}>
              <summary>
                <span className="day__label">{day.label}</span>
                <span className="day__meta">{day.exercises.length} exercises</span>
              </summary>
              <ol className="exercise-list">
                {day.exercises.map((e, j) => (
                  <li key={j} className="exercise">
                    <PictoTile
                      icon={isPictogramId(e.iconId) ? e.iconId : 'machine'}
                      size={32}
                      title=""
                    />
                    <span className="exercise__text">
                      <span className="exercise__name">{e.name}</span>
                      <span className="exercise__rx px-num">
                        {formatSetsReps(e)}
                        {e.prescriptionText ? <> · {formatPrescription(e, units)}</> : null}
                        {e.note ? <span className="exercise__note"> · {e.note}</span> : null}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </details>
          )}
        </li>
      ))}
    </ul>
  );
}
