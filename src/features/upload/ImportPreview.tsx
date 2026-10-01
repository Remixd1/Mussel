import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, SegmentedControl, TextField, Toggle } from '../../components/ui';
import { useUser } from '../../hooks/useAuth';
import { useCopy } from '../../hooks/useCopy';
import { useProfile } from '../../hooks/useProfile';
import { useToast } from '../../hooks/useToast';
import type { CsvImport } from '../../lib/csv/importFile';
import { createChart } from '../../lib/db/charts';
import { updateProfile } from '../../lib/db/profile';
import { addWeek, createProgram, nextWeekLabel, type WithId } from '../../lib/db/programs';
import type { Program } from '../../lib/types';
import { ChartTable } from './ChartTable';
import { DayList } from './DayList';
import { IssueList } from './IssueList';

type Target = 'new' | 'existing';

export interface ImportPreviewProps {
  imp: CsvImport;
  programs: readonly WithId<Program>[];
  /** Lock the target to this program (Add week from a program page). */
  fixedProgram?: WithId<Program>;
  onDone: () => void;
}

/** Shows what a CSV will import and saves it as a program, a week, or a chart. */
export function ImportPreview({ imp, programs, fixedProgram, onDone }: ImportPreviewProps) {
  const user = useUser();
  const profile = useProfile();
  const copy = useCopy();
  const toast = useToast();
  const navigate = useNavigate();

  const isProgram = imp.kind === 'program' && imp.days;
  const [target, setTarget] = useState<Target>(fixedProgram ? 'existing' : 'new');
  const [programId, setProgramId] = useState(fixedProgram?.id ?? programs[0]?.id ?? '');
  const existing = fixedProgram ?? programs.find((p) => p.id === programId);
  const [name, setName] = useState(imp.suggestedName);
  const [weekLabel, setWeekLabel] = useState<string | null>(null);
  const [saveChart, setSaveChart] = useState(true);

  const defaultWeek =
    target === 'existing' && existing
      ? (imp.weekFromName ?? nextWeekLabel(existing.weeks))
      : (imp.weekFromName ?? 'Week 1');
  const week = weekLabel ?? defaultWeek;

  const fail = () =>
    toast.show("Couldn't save. Check your connection and try again.", { tone: 'alarm' });

  const saveImportedChart = (chartName: string) => {
    if (!imp.chart) return;
    const { id, saved } = createChart(user.uid, chartName, imp.chart, imp.fileName);
    saved.catch(fail);
    if (!profile.activeChartId) updateProfile(user.uid, { activeChartId: id }).catch(fail);
  };

  const onSave = () => {
    if (isProgram) {
      const newWeek = {
        label: week.trim() || defaultWeek,
        sourceFileName: imp.fileName,
        days: imp.days!,
      };
      if (target === 'existing' && existing) {
        addWeek(user.uid, existing, newWeek).catch(fail);
        toast.show(copy('week.added'));
        if (imp.chart && saveChart) saveImportedChart(`${existing.name} chart`);
        onDone();
        navigate(`/upload/programs/${existing.id}`);
        return;
      }
      const { id, saved } = createProgram(user.uid, name.trim() || imp.suggestedName, newWeek);
      saved.catch(fail);
      if (!profile.activeProgramId) updateProfile(user.uid, { activeProgramId: id }).catch(fail);
      if (imp.chart && saveChart) saveImportedChart(`${name.trim() || imp.suggestedName} chart`);
      toast.show(copy('program.saved'));
      onDone();
      navigate(`/upload/programs/${id}`);
      return;
    }
    if (imp.kind === 'chart' && imp.chart) {
      saveImportedChart(name.trim() || imp.suggestedName);
      toast.show(copy('chart.saved'));
      onDone();
    }
  };

  const workouts = imp.days?.filter((d) => !d.rest).length ?? 0;
  const rests = (imp.days?.length ?? 0) - workouts;

  return (
    <Card className="px-stack import-preview">
      <div>
        <p className="px-display">
          {imp.kind === 'program'
            ? 'Program week'
            : imp.kind === 'chart'
              ? 'RPE chart'
              : 'Unreadable file'}
        </p>
        <p className="import-preview__file">{imp.fileName}</p>
        {isProgram ? (
          <p className="px-muted">
            {workouts} workouts · {rests} rest {rests === 1 ? 'day' : 'days'}
            {imp.chart ? ' · RPE chart found' : ''}
          </p>
        ) : null}
      </div>

      <IssueList issues={imp.issues} />

      {imp.canSave && isProgram ? (
        <>
          {!fixedProgram && programs.length ? (
            <SegmentedControl
              label="Save as"
              value={target}
              options={[
                { value: 'new', label: 'New program' },
                { value: 'existing', label: 'Add to program' },
              ]}
              onChange={(t) => {
                setTarget(t);
                setWeekLabel(null);
              }}
            />
          ) : null}
          {target === 'new' ? (
            <TextField
              label="Program name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          ) : !fixedProgram ? (
            <div className="px-field">
              <label className="px-field__label" htmlFor="import-program">
                Program
              </label>
              <select
                id="import-program"
                className="px-input"
                value={programId}
                onChange={(e) => {
                  setProgramId(e.target.value);
                  setWeekLabel(null);
                }}
              >
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <TextField label="Week" value={week} onChange={(e) => setWeekLabel(e.target.value)} />
          {imp.chart ? (
            <Toggle
              label="Also save the RPE chart"
              description="Found beside the program"
              checked={saveChart}
              onChange={setSaveChart}
            />
          ) : null}
          <DayList days={imp.days!} units={profile.units} openFirst />
        </>
      ) : null}

      {imp.canSave && imp.kind === 'chart' && imp.chart ? (
        <>
          <TextField label="Chart name" value={name} onChange={(e) => setName(e.target.value)} />
          <ChartTable chart={imp.chart} scale={imp.chart.sourceScale} />
        </>
      ) : null}

      <div className="px-row import-preview__actions">
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        {imp.canSave ? <Button onClick={onSave}>Save</Button> : null}
      </div>
    </Card>
  );
}
