import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, TextField } from '../../components/ui';
import { useUser } from '../../hooks/useAuth';
import { useCopy } from '../../hooks/useCopy';
import { useToast } from '../../hooks/useToast';
import { useRoutines } from '../../hooks/useWorkoutData';
import {
  nextRoutineName,
  routineChanged,
  routineEntriesFromSession,
  routineNameClash,
} from '../../lib/calc/workout';
import { saveRoutine } from '../../lib/db/routines';
import type { Session } from '../../lib/types';
import { NameTakenModal } from './NameTakenModal';

/**
 * Offer to keep a finished workout as a routine. The name is optional: left
 * blank, it becomes the next "Routine N"; a name already in use is refused.
 * A workout started from a routine and changed along the way can instead
 * update that routine. One left exactly as the routine was offers nothing.
 */
export function SaveAsRoutine({ session }: { session: Session }) {
  const { uid } = useUser();
  const copy = useCopy();
  const toast = useToast();
  const routines = useRoutines();
  const [name, setName] = useState('');
  const [taken, setTaken] = useState<string | null>(null);
  const [saved, setSaved] = useState<{ id: string; name: string; updated: boolean } | null>(null);

  if (!session.entries.length) return null;

  const list = routines.status === 'ready' ? routines.data : [];
  const entries = routineEntriesFromSession(session.entries);
  const source = session.routineId ? list.find((r) => r.id === session.routineId) : undefined;
  const fallback = nextRoutineName(list.map((r) => r.name));

  const store = (id: string | null, finalName: string) => {
    const { id: savedId, saved: done } = saveRoutine(uid, id, { name: finalName, entries });
    setSaved({ id: savedId, name: finalName, updated: id != null });
    toast.show(copy('routine.saved'), { tone: 'default' });
    done.catch(() =>
      toast.show("Couldn't save the routine. It will retry when you're back online.", {
        tone: 'alarm',
      }),
    );
  };

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    if (saved || routines.status === 'loading') return;
    const finalName = name.trim() || fallback;
    const clash = routineNameClash(list, finalName);
    if (clash) {
      setTaken(clash);
      return;
    }
    store(null, finalName);
  };

  if (saved) {
    return (
      <Card>
        <div className="save-routine">
          <h2 className="save-routine__title">
            {saved.updated ? 'Routine updated' : 'Saved as routine'}
          </h2>
          <p>
            <strong>{saved.name}</strong>{' '}
            {saved.updated
              ? 'now matches this workout.'
              : 'is in Your routines on the Workout tab.'}
          </p>
          <Link
            to={`/workout/routines/${saved.id}`}
            className="px-btn px-btn--secondary px-btn--block"
          >
            Edit routine
          </Link>
        </div>
      </Card>
    );
  }

  // Started from a routine and nothing changed: nothing to save.
  if (source && !routineChanged(source.entries, entries)) return null;

  return (
    <Card>
      <form className="save-routine" onSubmit={submit}>
        {source ? (
          <>
            <h2 className="save-routine__title">Save changes?</h2>
            <p className="px-muted">
              This workout differs from <strong>{source.name}</strong>. Update the routine to match
              it, or keep both by saving a new one.
            </p>
            <Button type="button" onClick={() => !saved && store(source.id, source.name)}>
              Update {source.name}
            </Button>
          </>
        ) : (
          <>
            <h2 className="save-routine__title">Save as routine?</h2>
            <p className="px-muted">
              Keep every exercise and set, with its reps, RPE and weight, to start again later.
            </p>
          </>
        )}
        <TextField
          label={source ? 'New routine name' : 'Routine name'}
          value={name}
          maxLength={60}
          placeholder={fallback}
          hint={`Leave blank to name it ${fallback}.`}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="submit" variant="secondary" disabled={routines.status === 'loading'}>
          {source ? 'Save as new routine' : 'Save as routine'}
        </Button>
      </form>
      <NameTakenModal name={taken} onClose={() => setTaken(null)} />
    </Card>
  );
}
