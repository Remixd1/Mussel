import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, TextField } from '../../components/ui';
import { useUser } from '../../hooks/useAuth';
import { useCopy } from '../../hooks/useCopy';
import { useToast } from '../../hooks/useToast';
import { useRoutines } from '../../hooks/useWorkoutData';
import { nextRoutineName, routineEntriesFromSession } from '../../lib/calc/workout';
import { saveRoutine } from '../../lib/db/routines';
import type { Session } from '../../lib/types';

/**
 * Offer to keep a finished workout as a routine. The name is optional: left
 * blank, it becomes the next "Routine N".
 */
export function SaveAsRoutine({ session }: { session: Session }) {
  const { uid } = useUser();
  const copy = useCopy();
  const toast = useToast();
  const routines = useRoutines();
  const [name, setName] = useState('');
  const [saved, setSaved] = useState<{ id: string; name: string } | null>(null);

  if (!session.entries.length) return null;

  const fallback = nextRoutineName(
    routines.status === 'ready' ? routines.data.map((r) => r.name) : [],
  );

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    if (saved || routines.status === 'loading') return;
    const finalName = name.trim() || fallback;
    const { id, saved: done } = saveRoutine(uid, null, {
      name: finalName,
      entries: routineEntriesFromSession(session.entries),
    });
    setSaved({ id, name: finalName });
    toast.show(copy('routine.saved'), { tone: 'default' });
    done.catch(() =>
      toast.show("Couldn't save the routine. It will retry when you're back online.", {
        tone: 'alarm',
      }),
    );
  };

  if (saved) {
    return (
      <Card>
        <div className="save-routine">
          <h2 className="save-routine__title">Saved as routine</h2>
          <p>
            <strong>{saved.name}</strong> is in Your routines on the Workout tab.
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

  return (
    <Card>
      <form className="save-routine" onSubmit={submit}>
        <h2 className="save-routine__title">Save as routine?</h2>
        <p className="px-muted">
          Keep these exercises, sets, reps and RPE to start again later. Weights are remembered on
          their own.
        </p>
        <TextField
          label="Routine name"
          value={name}
          maxLength={60}
          placeholder={fallback}
          hint={`Leave blank to name it ${fallback}.`}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="submit" variant="secondary" disabled={routines.status === 'loading'}>
          Save as routine
        </Button>
      </form>
    </Card>
  );
}
