import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardGlyph, FolderGlyph, PlayGlyph } from '../../components/icons';
import { Button, Card, SegmentedControl } from '../../components/ui';
import { useUser } from '../../hooks/useAuth';
import { useCopy } from '../../hooks/useCopy';
import { useProfile } from '../../hooks/useProfile';
import { usePrograms } from '../../hooks/usePrograms';
import { useToast } from '../../hooks/useToast';
import { useActiveChart, useMaxes, useRoutines } from '../../hooks/useWorkoutData';
import { entriesFromRoutine, routineEntriesFromDay } from '../../lib/calc/workout';
import { newActiveSession, saveActiveSession } from '../../lib/db/sessions';
import type { RoutineEntry } from '../../lib/types';

/** Workout tab with nothing in progress: start empty, from a routine, or from the program. */
export function WorkoutStart() {
  const user = useUser();
  const profile = useProfile();
  const copy = useCopy();
  const toast = useToast();
  const routines = useRoutines();
  const programs = usePrograms();
  const maxes = useMaxes();
  const { id: chartId } = useActiveChart();
  const [weekIndex, setWeekIndex] = useState<number | null>(null);

  const maxFor = (key: string) =>
    maxes.status === 'ready' ? (maxes.data[key]?.e1rmKg ?? null) : null;
  const start = (title: string, entries: RoutineEntry[]) => {
    saveActiveSession(
      user.uid,
      newActiveSession(title, entriesFromRoutine(entries, maxFor), chartId),
    ).catch(() => toast.show("Couldn't start the workout.", { tone: 'alarm' }));
    toast.show(copy('session.start'));
  };

  const program =
    programs.status === 'ready'
      ? (programs.data.find((p) => p.id === profile.activeProgramId) ?? null)
      : null;
  const wi = Math.min(weekIndex ?? 0, Math.max(0, (program?.weeks.length ?? 1) - 1));
  const week = program?.weeks[wi];

  return (
    <div className="px-stack">
      <h1>Test Session</h1>

      <Button block icon={<PlayGlyph size={20} />} onClick={() => start('Workout', [])}>
        Start empty workout
      </Button>

      <section aria-labelledby="routines-heading" className="px-stack">
        <div className="section-head">
          <h2 id="routines-heading">Your routines</h2>
          <Link to="/workout/routines/new" className="text-link">
            + New routine
          </Link>
        </div>
        {routines.status === 'ready' && !routines.data.length ? (
          <p className="px-muted">
            No routines yet. Build one, or import your program's days as routines.
          </p>
        ) : null}
        <ul className="list">
          {(routines.status === 'ready' ? routines.data : []).map((r) => (
            <li key={r.id} className="list-row list-row--split">
              <span className="list-row__icon">
                <ClipboardGlyph size={24} />
              </span>
              <Link to={`/workout/routines/${r.id}`} className="list-row__text list-row__link">
                <span className="list-row__title">{r.name}</span>
                <span className="list-row__meta">
                  {r.entries.length} {r.entries.length === 1 ? 'exercise' : 'exercises'} · Edit
                </span>
              </Link>
              <button
                type="button"
                className="start-btn"
                aria-label={`Start ${r.name}`}
                onClick={() => start(r.name, r.entries)}
              >
                <PlayGlyph size={20} />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {program ? (
        <Card className="px-stack">
          <div className="section-head">
            <div>
              <p className="px-display">From your program</p>
              <p className="program-name">{program.name}</p>
            </div>
            <Link to={`/upload/programs/${program.id}`} className="text-link">
              Open
            </Link>
          </div>
          {program.weeks.length > 1 && program.weeks.length <= 4 ? (
            <SegmentedControl
              label="Week"
              value={wi}
              options={program.weeks.map((w, i) => ({
                value: i,
                label: w.label.replace('Week ', 'W'),
              }))}
              onChange={setWeekIndex}
            />
          ) : program.weeks.length > 4 ? (
            <div className="px-field">
              <label className="px-field__label" htmlFor="week-pick">
                Week
              </label>
              <select
                id="week-pick"
                className="px-input"
                value={wi}
                onChange={(e) => setWeekIndex(Number(e.target.value))}
              >
                {program.weeks.map((w, i) => (
                  <option key={i} value={i}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <ul className="list">
            {week?.days.map((day, di) =>
              day.rest ? (
                <li key={di} className="day day--rest">
                  <span className="day__label">{day.label}</span>
                  <span className="day__meta">Rest</span>
                </li>
              ) : (
                <li key={di} className="list-row list-row--split">
                  <span className="list-row__icon">
                    <FolderGlyph size={24} />
                  </span>
                  <span className="list-row__text">
                    <span className="list-row__title">{day.label}</span>
                    <span className="list-row__meta">
                      {day.exercises
                        .slice(0, 3)
                        .map((e) => e.name)
                        .join(', ')}
                      {day.exercises.length > 3 ? '…' : ''}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="start-btn"
                    aria-label={`Start ${day.label}`}
                    onClick={() =>
                      start(
                        `${program.name} · ${week.label} ${day.label}`,
                        routineEntriesFromDay(day, profile.defaultRestSec),
                      )
                    }
                  >
                    <PlayGlyph size={20} />
                  </button>
                </li>
              ),
            )}
          </ul>
        </Card>
      ) : (
        <Card>
          <p className="px-display">From your program</p>
          <p>
            Upload your program on the <Link to="/upload">Upload</Link> tab to start its days here.
          </p>
        </Card>
      )}
    </div>
  );
}
