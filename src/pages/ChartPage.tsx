import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BackGlyph } from '../components/icons';
import { Button, Modal, TextField } from '../components/ui';
import { useUser } from '../hooks/useAuth';
import { useCopy } from '../hooks/useCopy';
import { useProfile } from '../hooks/useProfile';
import { useCharts } from '../hooks/usePrograms';
import { useToast } from '../hooks/useToast';
import { DEFAULT_CHART_NAME, defaultChart } from '../lib/calc/effort';
import { deleteChart, renameChart } from '../lib/db/charts';
import { updateProfile } from '../lib/db/profile';
import { ChartTable } from '../features/upload/ChartTable';
import '../features/upload/upload.css';

const BUILT_IN = 'standard';

/** One RPE chart: the grid, plus set active / rename / delete. */
export default function ChartPage() {
  const { chartId = '' } = useParams();
  const user = useUser();
  const profile = useProfile();
  const copy = useCopy();
  const toast = useToast();
  const navigate = useNavigate();
  const charts = useCharts();
  const [dialog, setDialog] = useState<'rename' | 'delete' | null>(null);
  const [newName, setNewName] = useState('');

  const fail = () =>
    toast.show("Couldn't save. Check your connection and try again.", { tone: 'alarm' });
  const builtIn = chartId === BUILT_IN;
  const stored = charts.status === 'ready' ? charts.data.find((c) => c.id === chartId) : undefined;

  if (!builtIn && charts.status === 'loading') return <p className="px-muted">Loading…</p>;
  if (!builtIn && !stored) {
    return (
      <div className="px-stack">
        <BackLink />
        <h1>Chart not found</h1>
      </div>
    );
  }

  const chart = builtIn ? defaultChart() : stored!;
  const name = builtIn ? DEFAULT_CHART_NAME : stored!.name;
  const isActive = builtIn ? !profile.activeChartId : profile.activeChartId === chartId;

  return (
    <div className="px-stack">
      <BackLink />
      <div>
        <h1 className="program-title">{name}</h1>
        <p className="px-muted">
          {builtIn
            ? 'Built in. Formula approximation (Epley with reps in reserve).'
            : `From ${stored!.sourceFileName}`}
        </p>
      </div>
      <div className="px-row">
        {isActive ? (
          <span className="badge badge--lg">Active chart</span>
        ) : (
          <Button
            onClick={() => {
              updateProfile(user.uid, { activeChartId: builtIn ? null : chartId }).catch(fail);
              toast.show('Active chart set.');
            }}
          >
            Set active
          </Button>
        )}
        {!builtIn ? (
          <Button
            variant="secondary"
            onClick={() => {
              setNewName(name);
              setDialog('rename');
            }}
          >
            Rename
          </Button>
        ) : null}
      </div>

      <ChartTable chart={chart} scale={profile.effortScale} />

      {!builtIn ? (
        <Button variant="danger" block onClick={() => setDialog('delete')}>
          Delete chart
        </Button>
      ) : null}

      <Modal
        open={dialog === 'rename'}
        onClose={() => setDialog(null)}
        title="Rename chart"
        actions={
          <>
            <Button variant="secondary" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              disabled={!newName.trim()}
              onClick={() => {
                renameChart(user.uid, chartId, newName).catch(fail);
                setDialog(null);
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <TextField
          label="Chart name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
      </Modal>

      <Modal
        open={dialog === 'delete'}
        onClose={() => setDialog(null)}
        title="Delete chart"
        actions={
          <>
            <Button variant="secondary" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                deleteChart(user.uid, chartId).catch(fail);
                if (isActive) updateProfile(user.uid, { activeChartId: null }).catch(fail);
                setDialog(null);
                navigate('/upload', { replace: true });
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
    <Link to="/upload" className="back-link">
      <BackGlyph size={20} /> Upload
    </Link>
  );
}
