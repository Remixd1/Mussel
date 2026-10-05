import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import { Button, Modal } from '../../components/ui';
import { useUser } from '../../hooks/useAuth';
import { useCopy } from '../../hooks/useCopy';
import { useProfile } from '../../hooks/useProfile';
import { useRestTimer } from '../../hooks/useRestTimer';
import { useToast } from '../../hooks/useToast';
import { useActiveChart, useMaxes } from '../../hooks/useWorkoutData';
import { useNow } from '../../hooks/useNow';
import { entryForExercise, exerciseKey } from '../../lib/calc/workout';
import { buzz, playCue } from '../../lib/sound';
import { discardActiveSession, finishSession, saveActiveSession } from '../../lib/db/sessions';
import type { ActiveSession, SessionEntry } from '../../lib/types';
import { ExerciseBlock } from './ExerciseBlock';
import { ExercisePicker } from './ExercisePicker';
import { RestTimerBar } from './RestTimerBar';

const SAVE_DELAY_MS = 800;

/** The workout in progress. Edits are local first and saved (debounced) to activeSession. */
export function ActiveWorkout({ initial }: { initial: ActiveSession }) {
  const user = useUser();
  const profile = useProfile();
  const copy = useCopy();
  const toast = useToast();
  const navigate = useNavigate();
  const { chart } = useActiveChart();
  const maxes = useMaxes();
  const now = useNow(30_000);
  // Local state wins after mount: later snapshots are just our own saves echoing back.
  const [first] = useState(initial);
  const [session, setSession] = useState(initial);
  const [picker, setPicker] = useState(false);
  const [dialog, setDialog] = useState<'finish' | 'discard' | null>(null);
  const finished = useRef(false);

  // Debounced save; flush right away when the app is backgrounded.
  const latest = useRef(session);
  const dirty = useRef(false);
  const save = useCallback(() => {
    if (!dirty.current || finished.current) return;
    dirty.current = false;
    saveActiveSession(user.uid, latest.current).catch(() =>
      toast.show("Couldn't save your workout. It's kept on this device.", { tone: 'alarm' }),
    );
  }, [user.uid, toast]);

  useEffect(() => {
    latest.current = session;
    if (session === first) return;
    dirty.current = true;
    const id = window.setTimeout(save, SAVE_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [session, first, save]);

  useEffect(() => {
    const flush = () => document.visibilityState === 'hidden' && save();
    document.addEventListener('visibilitychange', flush);
    return () => {
      document.removeEventListener('visibilitychange', flush);
      save();
    };
  }, [save]);

  const update = (fn: (s: ActiveSession) => ActiveSession) => setSession((s) => fn(s));
  const setEntry = (i: number, entry: SessionEntry) =>
    update((s) => ({ ...s, entries: s.entries.map((e, j) => (j === i ? entry : e)) }));

  const storedMax = (key: string) =>
    maxes.status === 'ready' ? (maxes.data[key]?.e1rmKg ?? null) : null;

  // Rest timer.
  const endsAtMs = session.restTimer.endsAt?.toMillis() ?? null;
  const restView = useRestTimer(endsAtMs, session.restTimer.durationSec, () => {
    toast.show(copy('rest.done'), { tone: 'signal', icon: 'rest' });
    if (profile.soundOn) playCue('rest');
    buzz([200, 100, 200]);
  });
  const startRest = (entry: SessionEntry) => {
    if (entry.restSec <= 0) return;
    update((s) => ({
      ...s,
      restTimer: {
        endsAt: Timestamp.fromMillis(Date.now() + entry.restSec * 1000),
        durationSec: entry.restSec,
        exerciseName: entry.exerciseName,
      },
    }));
  };
  const adjustRest = (delta: number) =>
    update((s) => {
      const ends = s.restTimer.endsAt?.toMillis();
      if (ends == null) return s;
      return {
        ...s,
        restTimer: {
          ...s.restTimer,
          endsAt: Timestamp.fromMillis(Math.max(Date.now(), ends + delta * 1000)),
          durationSec: Math.max(1, s.restTimer.durationSec + delta),
        },
      };
    });
  const skipRest = () =>
    update((s) => ({ ...s, restTimer: { endsAt: null, durationSec: 0, exerciseName: null } }));

  const doneSets = session.entries.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);
  const elapsedMin = Math.max(
    0,
    Math.round((now.getTime() - session.startedAt.toMillis()) / 60000),
  );

  const onFinish = () => {
    finished.current = true;
    const { id, saved } = finishSession(user.uid, latest.current, chart, storedMax);
    saved.catch(() =>
      toast.show("Couldn't save. It will retry when you're back online.", { tone: 'alarm' }),
    );
    toast.show(copy('session.saved'));
    navigate(`/workout/summary/${id}`, { replace: true });
  };

  const onDiscard = () => {
    finished.current = true;
    discardActiveSession(user.uid).catch(() => undefined);
    setDialog(null);
  };

  return (
    <div className={`px-stack active-workout${restView.running ? ' active-workout--resting' : ''}`}>
      <div>
        <p className="px-display">Test in progress · {elapsedMin} min</p>
        <h1 className="active-workout__title">{session.title}</h1>
      </div>

      {session.entries.map((entry, i) => (
        <ExerciseBlock
          key={i}
          entries={session.entries}
          index={i}
          chart={chart}
          units={profile.units}
          scale={profile.effortScale}
          onChange={(e) => setEntry(i, e)}
          onRemove={() => update((s) => ({ ...s, entries: s.entries.filter((_, j) => j !== i) }))}
          onSetDone={() => {
            if (profile.soundOn) playCue('set');
            startRest(entry);
          }}
        />
      ))}

      <Button block variant="secondary" onClick={() => setPicker(true)}>
        + Add exercise
      </Button>

      <div className="px-field">
        <label className="px-field__label" htmlFor="session-notes">
          Notes
        </label>
        <textarea
          id="session-notes"
          className="px-input notes-input"
          rows={3}
          value={session.notes}
          onChange={(e) => {
            const notes = e.target.value;
            update((s) => ({ ...s, notes }));
          }}
          placeholder="How did it go?"
        />
      </div>

      <div className="px-row workout-actions">
        <Button variant="secondary" onClick={() => setDialog('discard')}>
          Discard
        </Button>
        <Button onClick={() => setDialog('finish')}>Finish workout</Button>
      </div>

      <RestTimerBar
        view={restView}
        exerciseName={session.restTimer.exerciseName}
        onAdjust={adjustRest}
        onSkip={skipRest}
      />

      <ExercisePicker
        open={picker}
        onClose={() => setPicker(false)}
        onPick={(p) =>
          update((s) => ({
            ...s,
            entries: [
              ...s.entries,
              entryForExercise(
                p,
                profile.defaultRestSec,
                storedMax(exerciseKey(p.exerciseId, p.name)),
              ),
            ],
          }))
        }
      />

      <Modal
        open={dialog === 'finish'}
        onClose={() => setDialog(null)}
        title="Finish workout"
        actions={
          <>
            <Button variant="secondary" onClick={() => setDialog(null)}>
              Keep going
            </Button>
            <Button onClick={onFinish}>Finish</Button>
          </>
        }
      >
        <p>
          {doneSets
            ? `${doneSets} ${doneSets === 1 ? 'set' : 'sets'} ticked done. Save this workout?`
            : 'No sets are ticked done yet. Save it anyway?'}
        </p>
      </Modal>

      <Modal
        open={dialog === 'discard'}
        onClose={() => setDialog(null)}
        title="Discard workout"
        actions={
          <>
            <Button variant="secondary" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={onDiscard}>
              Discard
            </Button>
          </>
        }
      >
        <p>{copy('session.discardConfirm')}</p>
      </Modal>
    </div>
  );
}
