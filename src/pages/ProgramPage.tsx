import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BackGlyph, FolderGlyph } from '../components/icons';
import { Button, Card, Modal, TextField } from '../components/ui';
import { useUser } from '../hooks/useAuth';
import { useCopy } from '../hooks/useCopy';
import { useProfile } from '../hooks/useProfile';
import { usePrograms, useProgram } from '../hooks/usePrograms';
import { useToast } from '../hooks/useToast';
import type { CsvImport } from '../lib/csv/importFile';
import { updateProfile } from '../lib/db/profile';
import { deleteProgram, deleteWeek, renameProgram, repeatWeek } from '../lib/db/programs';
import { CsvPicker } from '../features/upload/CsvPicker';
import { DayList } from '../features/upload/DayList';
import { ImportPreview } from '../features/upload/ImportPreview';
import '../features/upload/upload.css';

type Dialog =
  { kind: 'rename' } | { kind: 'deleteWeek'; index: number } | { kind: 'deleteProgram' };

/** A program: its weeks as folders of days, plus week and program actions. */
export default function ProgramPage() {
  const { programId = '' } = useParams();
  const user = useUser();
  const profile = useProfile();
  const copy = useCopy();
  const toast = useToast();
  const navigate = useNavigate();
  const live = useProgram(programId);
  const all = usePrograms();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [newName, setNewName] = useState('');
  const [pending, setPending] = useState<CsvImport | null>(null);

  const fail = () =>
    toast.show("Couldn't save. Check your connection and try again.", { tone: 'alarm' });

  if (live.status === 'loading') return <p className="px-muted">Loading…</p>;
  if (live.status === 'error' || !live.data) {
    return (
      <div className="px-stack">
        <BackLink />
        <h1>Program not found</h1>
        <p>It may have been deleted.</p>
      </div>
    );
  }
  const program = live.data;
  const isActive = profile.activeProgramId === program.id;

  return (
    <div className="px-stack">
      <BackLink />
      <div>
        <h1 className="program-title">{program.name}</h1>
        <p className="px-muted">
          {program.weeks.length} {program.weeks.length === 1 ? 'week' : 'weeks'}
        </p>
      </div>

      <div className="px-row">
        {isActive ? (
          <span className="badge badge--lg">Active program</span>
        ) : (
          <Button
            onClick={() => {
              updateProfile(user.uid, { activeProgramId: program.id }).catch(fail);
              toast.show(copy('program.active'));
            }}
          >
            Set active
          </Button>
        )}
        <Button
          variant="secondary"
          onClick={() => {
            setNewName(program.name);
            setDialog({ kind: 'rename' });
          }}
        >
          Rename
        </Button>
      </div>

      {pending ? (
        <ImportPreview
          imp={pending}
          programs={all.status === 'ready' ? all.data : []}
          fixedProgram={program}
          onDone={() => setPending(null)}
        />
      ) : null}

      <section aria-labelledby="weeks-heading" className="px-stack">
        <h2 id="weeks-heading">Weeks</h2>
        <ul className="list">
          {program.weeks.map((week, i) => {
            const workouts = week.days.filter((d) => !d.rest).length;
            return (
              <li key={i}>
                <details className="week" open={program.weeks.length === 1}>
                  <summary className="list-row">
                    <span className="list-row__icon">
                      <FolderGlyph size={26} />
                    </span>
                    <span className="list-row__text">
                      <span className="list-row__title">{week.label}</span>
                      <span className="list-row__meta">
                        {workouts} workouts · {week.days.length - workouts} rest
                        {week.sourceFileName ? '' : ' · repeated'}
                      </span>
                    </span>
                  </summary>
                  <div className="week__body px-stack">
                    <DayList days={week.days} units={profile.units} />
                    <div className="px-row">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          repeatWeek(user.uid, program, i).catch(fail);
                          toast.show(copy('week.added'));
                        }}
                      >
                        Repeat this week
                      </Button>
                      {program.weeks.length > 1 ? (
                        <Button
                          variant="secondary"
                          onClick={() => setDialog({ kind: 'deleteWeek', index: i })}
                        >
                          Delete week
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      </section>

      <Card className="px-stack">
        <p className="px-display">Add a week</p>
        <Button
          block
          onClick={() => {
            repeatWeek(user.uid, program, program.weeks.length - 1).catch(fail);
            toast.show(copy('week.added'));
          }}
        >
          Repeat last week
        </Button>
        <CsvPicker label="Add week from CSV" variant="secondary" onImport={setPending} />
      </Card>

      <Button variant="danger" block onClick={() => setDialog({ kind: 'deleteProgram' })}>
        Delete program
      </Button>

      <Modal
        open={dialog?.kind === 'rename'}
        onClose={() => setDialog(null)}
        title="Rename program"
        actions={
          <>
            <Button variant="secondary" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              disabled={!newName.trim()}
              onClick={() => {
                renameProgram(user.uid, program.id, newName).catch(fail);
                setDialog(null);
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <TextField
          label="Program name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
      </Modal>

      <Modal
        open={dialog?.kind === 'deleteWeek'}
        onClose={() => setDialog(null)}
        title="Delete week"
        actions={
          <>
            <Button variant="secondary" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (dialog?.kind === 'deleteWeek')
                  deleteWeek(user.uid, program, dialog.index).catch(fail);
                setDialog(null);
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p>
          Delete {dialog?.kind === 'deleteWeek' ? program.weeks[dialog.index]?.label : 'this week'}?{' '}
          {copy('delete.confirm')}
        </p>
      </Modal>

      <Modal
        open={dialog?.kind === 'deleteProgram'}
        onClose={() => setDialog(null)}
        title="Delete program"
        actions={
          <>
            <Button variant="secondary" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                deleteProgram(user.uid, program.id).catch(fail);
                if (isActive) updateProfile(user.uid, { activeProgramId: null }).catch(fail);
                setDialog(null);
                navigate('/upload', { replace: true });
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p>
          Delete “{program.name}” and all its weeks? {copy('delete.confirm')}
        </p>
      </Modal>
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/upload" className="back-link">
      <BackGlyph size={20} /> Upload
    </Link>
  );
}
