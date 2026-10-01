import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarGlyph, FolderGlyph } from '../components/icons';
import { Card } from '../components/ui';
import { useCopy } from '../hooks/useCopy';
import { useProfile } from '../hooks/useProfile';
import { useCharts, usePrograms } from '../hooks/usePrograms';
import { DEFAULT_CHART_NAME } from '../lib/calc/effort';
import {
  chartTemplate,
  downloadText,
  PROGRAM_TEMPLATE,
  type CsvImport,
} from '../lib/csv/importFile';
import { CsvPicker } from '../features/upload/CsvPicker';
import { ImportPreview } from '../features/upload/ImportPreview';
import '../features/upload/upload.css';

/** Upload tab: import programs and RPE charts, and browse what's saved. */
export default function UploadPage() {
  const copy = useCopy();
  const profile = useProfile();
  const programs = usePrograms();
  const charts = useCharts();
  const [pending, setPending] = useState<CsvImport | null>(null);

  const programList = programs.status === 'ready' ? programs.data : [];
  const chartList = charts.status === 'ready' ? charts.data : [];

  return (
    <div className="px-stack">
      <h1>{copy('upload.title')}</h1>

      {pending ? (
        <ImportPreview imp={pending} programs={programList} onDone={() => setPending(null)} />
      ) : (
        <Card className="px-stack">
          <div>
            <p className="px-display">Import a CSV</p>
            <p className="upload-intro">
              Upload one week of your program (days, exercises, sets, reps, RPE), or an RPE-to-%1RM
              chart. Export it from Excel, Google Sheets, or Numbers as CSV.
            </p>
          </div>
          <CsvPicker onImport={setPending} />
          <div className="template-links">
            <span className="px-muted">Templates:</span>
            <button
              type="button"
              className="link-btn"
              onClick={() => downloadText('mussel-program-template.csv', PROGRAM_TEMPLATE)}
            >
              Program
            </button>
            <button
              type="button"
              className="link-btn"
              onClick={() => downloadText('mussel-chart-template.csv', chartTemplate())}
            >
              RPE chart
            </button>
          </div>
        </Card>
      )}

      <section aria-labelledby="programs-heading" className="px-stack">
        <h2 id="programs-heading">Programs</h2>
        {programs.status === 'loading' ? <p className="px-muted">Loading…</p> : null}
        {programs.status === 'ready' && !programList.length ? (
          <p className="px-muted">{copy('upload.empty')}</p>
        ) : null}
        <ul className="list">
          {programList.map((p) => {
            const days = p.weeks[0]?.days ?? [];
            const workouts = days.filter((d) => !d.rest).length;
            return (
              <li key={p.id}>
                <Link to={`/upload/programs/${p.id}`} className="list-row">
                  <span className="list-row__icon">
                    <FolderGlyph size={26} />
                  </span>
                  <span className="list-row__text">
                    <span className="list-row__title">{p.name}</span>
                    <span className="list-row__meta">
                      {p.weeks.length} {p.weeks.length === 1 ? 'week' : 'weeks'} · {workouts}{' '}
                      workouts/week
                    </span>
                  </span>
                  {profile.activeProgramId === p.id ? <span className="badge">Active</span> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="charts-heading" className="px-stack">
        <h2 id="charts-heading">RPE charts</h2>
        <ul className="list">
          <li>
            <Link to="/upload/charts/standard" className="list-row">
              <span className="list-row__icon">
                <CalendarGlyph size={26} />
              </span>
              <span className="list-row__text">
                <span className="list-row__title">{DEFAULT_CHART_NAME}</span>
                <span className="list-row__meta">Built in · formula approximation</span>
              </span>
              {!profile.activeChartId ? <span className="badge">Active</span> : null}
            </Link>
          </li>
          {chartList.map((c) => (
            <li key={c.id}>
              <Link to={`/upload/charts/${c.id}`} className="list-row">
                <span className="list-row__icon">
                  <CalendarGlyph size={26} />
                </span>
                <span className="list-row__text">
                  <span className="list-row__title">{c.name}</span>
                  <span className="list-row__meta">
                    {c.rows.length} reps × {c.rpeValues.length} {c.sourceScale.toUpperCase()}
                  </span>
                </span>
                {profile.activeChartId === c.id ? <span className="badge">Active</span> : null}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
