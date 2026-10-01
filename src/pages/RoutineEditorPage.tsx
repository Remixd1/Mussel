import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AddGlyph, BackGlyph, DeleteGlyph, isPictogramId, MinusGlyph } from '../components/icons';
import { Button, Card, Modal, PictoTile, TextField } from '../components/ui';
import { useUser } from '../hooks/useAuth';
import { useCopy } from '../hooks/useCopy';
import { useProfile } from '../hooks/useProfile';
import { formatClock } from '../hooks/useRestTimer';
import { useToast } from '../hooks/useToast';
import { useRoutines } from '../hooks/useWorkoutData';
import { entryForExercise } from '../lib/calc/workout';
import { deleteRoutine, saveRoutine } from '../lib/db/routines';
import type { Routine, RoutineEntry } from '../lib/types';
import { EffortInput } from '../features/workout/EffortInput';
import { ExercisePicker } from '../features/workout/ExercisePicker';
import { MiniNumber } from '../features/workout/MiniNumber';
import '../features/upload/upload.css';
import '../features/workout/workout.css';

/** Build or edit a routine. Waits for the routine to load before showing the editor. */
export default function RoutineEditorPage() {
  const { routineId } = useParams();
  const routines = useRoutines();
  if (routineId && routines.status === 'loading') return <p className="px-muted">Loading…</p>;
  const existing =
    routineId && routines.status === 'ready'
      ? routines.data.find((r) => r.id === routineId)
      : undefined;
  if (routineId && !existing) {
    return (
      <div className="px-stack">
        <BackLink />
        <h1>Routine not found</h1>
      </div>
    );
  }
  return <Editor key={routineId ?? 'new'} id={routineId ?? null} existing={existing ?? null} />;
}

function Editor({ id, existing }: { id: string | null; existing: Routine | null }) {
  const user = useUser();
  const profile = useProfile();
  const copy = useCopy();
  const toast = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState(existing?.name ?? '');
  const [entries, setEntries] = useState<RoutineEntry[]>(existing?.entries ?? []);
  const [picker, setPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = (i: number, patch: Partial<RoutineEntry>) =>
    setEntries((list) => list.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  const move = (i: number, dir: -1 | 1) =>
    setEntries((list) => {
      const j = i + dir;
      if (j < 0 || j >= list.length) return list;
      const copyList = [...list];
      [copyList[i], copyList[j]] = [copyList[j], copyList[i]];
      return copyList;
    });

  const canSave = name.trim() !== '' && entries.length > 0;
  const onSave = () => {
    const { saved } = saveRoutine(user.uid, id, { name, entries });
    saved.catch(() => toast.show("Couldn't save the routine.", { tone: 'alarm' }));
    toast.show('Routine saved.');
    navigate('/workout');
  };

  return (
    <div className="px-stack">
      <BackLink />
      <h1>{id ? 'Edit routine' : 'New routine'}</h1>
      <TextField
        label="Routine name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Push day"
      />

      {entries.length === 0 ? (
        <p className="px-muted">Add exercises to build the routine.</p>
      ) : null}

      <ol className="routine-list">
        {entries.map((e, i) => (
          <li key={i}>
            <Card className="routine-entry">
              <div className="exercise-block__head">
                <PictoTile
                  icon={isPictogramId(e.iconId) ? e.iconId : 'machine'}
                  size={40}
                  title=""
                />
                <div className="exercise-block__title">
                  <h2>{e.exerciseName}</h2>
                  {e.note ? <p className="exercise-block__note">{e.note}</p> : null}
                </div>
                <div className="reorder">
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={`Move ${e.exerciseName} up`}
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={`Move ${e.exerciseName} down`}
                    disabled={i === entries.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    ↓
                  </button>
                </div>
              </div>
              <div className="routine-entry__fields">
                <MiniNumber
                  label="Sets"
                  value={e.sets}
                  min={1}
                  max={20}
                  onChange={(v) => set(i, { sets: v ?? 1 })}
                />
                <MiniNumber
                  label="Reps"
                  value={e.reps}
                  min={1}
                  max={100}
                  onChange={(v) => set(i, { reps: v })}
                />
                {e.dropPercent == null ? (
                  <EffortInput
                    scale={profile.effortScale}
                    rpe={e.rpe}
                    onChange={(rpe) => set(i, { rpe })}
                  />
                ) : (
                  <div className="mini">
                    <span className="mini__label">Drop</span>
                    <span className="mini__static">−{e.dropPercent}%</span>
                  </div>
                )}
                <div
                  className="rest-control"
                  role="group"
                  aria-label={`Rest for ${e.exerciseName}`}
                >
                  <span className="mini__label">Rest</span>
                  <div className="rest-control__row">
                    <button
                      type="button"
                      className="step-btn"
                      aria-label="15 seconds less rest"
                      onClick={() => set(i, { restSec: Math.max(0, e.restSec - 15) })}
                    >
                      <MinusGlyph size={18} />
                    </button>
                    <span className="rest-control__value px-num">{formatClock(e.restSec)}</span>
                    <button
                      type="button"
                      className="step-btn"
                      aria-label="15 seconds more rest"
                      onClick={() => set(i, { restSec: Math.min(900, e.restSec + 15) })}
                    >
                      <AddGlyph size={18} />
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="text-link danger-link"
                onClick={() => setEntries((list) => list.filter((_, j) => j !== i))}
              >
                <DeleteGlyph size={18} /> Remove
              </button>
            </Card>
          </li>
        ))}
      </ol>

      <Button block variant="secondary" onClick={() => setPicker(true)}>
        + Add exercise
      </Button>
      <Button block disabled={!canSave} onClick={onSave}>
        Save routine
      </Button>
      {id ? (
        <Button block variant="danger" onClick={() => setConfirmDelete(true)}>
          Delete routine
        </Button>
      ) : null}

      <ExercisePicker
        open={picker}
        onClose={() => setPicker(false)}
        onPick={(p) => {
          const e = entryForExercise(p, profile.defaultRestSec, null);
          setEntries((list) => [
            ...list,
            {
              exerciseId: e.exerciseId,
              exerciseName: e.exerciseName,
              iconId: e.iconId,
              sets: 3,
              reps: 8,
              rpe: 8,
              restSec: profile.defaultRestSec,
              dropPercent: null,
              note: null,
            },
          ]);
        }}
      />

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete routine"
        actions={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (id) deleteRoutine(user.uid, id).catch(() => undefined);
                navigate('/workout', { replace: true });
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p>{copy('delete.confirm')}</p>
      </Modal>
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/workout" className="back-link">
      <BackGlyph size={20} /> Workout
    </Link>
  );
}
