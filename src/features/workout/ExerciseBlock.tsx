import { CheckGlyph, DeleteGlyph, MinusGlyph, AddGlyph } from '../../components/icons';
import { formatClock } from '../../hooks/useRestTimer';
import { formatWeight, fromKg, toKg, WEIGHT_STEP } from '../../lib/calc/units';
import { nextSet, suggestedWeightKg } from '../../lib/calc/workout';
import type { ChartData, EffortScale, SessionEntry, SetRow, Units } from '../../lib/types';
import { GuideTile } from '../exercises/GuideTile';
import { EffortInput } from './EffortInput';
import { MiniNumber } from './MiniNumber';

export interface ExerciseBlockProps {
  entries: readonly SessionEntry[];
  index: number;
  chart: ChartData;
  units: Units;
  scale: EffortScale;
  onChange: (entry: SessionEntry) => void;
  onRemove: () => void;
  /** A set was ticked done: start this exercise's rest timer. */
  onSetDone: () => void;
}

const REST_STEP = 15;

/** One exercise in a workout: PR, rest timer, and its sets. */
export function ExerciseBlock({
  entries,
  index,
  chart,
  units,
  scale,
  onChange,
  onRemove,
  onSetDone,
}: ExerciseBlockProps) {
  const entry = entries[index];
  const set = (si: number, patch: Partial<SetRow>) =>
    onChange({ ...entry, sets: entry.sets.map((s, i) => (i === si ? { ...s, ...patch } : s)) });

  return (
    <section className="px-card exercise-block" aria-label={entry.exerciseName}>
      <header className="exercise-block__head">
        <GuideTile exerciseId={entry.exerciseId} name={entry.exerciseName} iconId={entry.iconId} />
        <div className="exercise-block__title">
          <h2>{entry.exerciseName}</h2>
          {entry.note ? <p className="exercise-block__note">{entry.note}</p> : null}
          {entry.dropPercent != null ? (
            <p className="exercise-block__note">
              Back-off: −{entry.dropPercent}% from the previous exercise
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className="icon-btn"
          aria-label={`Remove ${entry.exerciseName}`}
          onClick={onRemove}
        >
          <DeleteGlyph size={22} />
        </button>
      </header>

      <div className="exercise-block__controls">
        {entry.dropPercent == null ? (
          <MiniNumber
            label={`PR (${units})`}
            wide
            value={entry.maxKg == null ? null : Math.round(fromKg(entry.maxKg, units) * 10) / 10}
            placeholder="1RM"
            onChange={(v) => onChange({ ...entry, maxKg: v == null ? null : toKg(v, units) })}
          />
        ) : null}
        <div
          className="rest-control"
          role="group"
          aria-label={`Rest timer for ${entry.exerciseName}`}
        >
          <span className="mini__label">Rest</span>
          <div className="rest-control__row">
            <button
              type="button"
              className="step-btn"
              aria-label="15 seconds less rest"
              onClick={() =>
                onChange({ ...entry, restSec: Math.max(0, entry.restSec - REST_STEP) })
              }
            >
              <MinusGlyph size={18} />
            </button>
            <span className="rest-control__value px-num">{formatClock(entry.restSec)}</span>
            <button
              type="button"
              className="step-btn"
              aria-label="15 seconds more rest"
              onClick={() =>
                onChange({ ...entry, restSec: Math.min(900, entry.restSec + REST_STEP) })
              }
            >
              <AddGlyph size={18} />
            </button>
          </div>
        </div>
      </div>

      <ol className="set-list">
        {entry.sets.map((s, si) => {
          const suggested = suggestedWeightKg(entries, index, si, chart, units);
          const shownWeight = s.weightKg ?? suggested;
          const step = WEIGHT_STEP[units];
          const bump = (dir: 1 | -1) => {
            const base = fromKg(shownWeight ?? 0, units);
            const next = Math.max(0, Math.round((base + dir * step) / step) * step);
            set(si, { weightKg: toKg(next, units) });
          };
          return (
            <li key={si} className={`set-row${s.done ? ' set-row--done' : ''}`}>
              <div className="set-row__line">
                <span className="set-row__num" aria-label={`Set ${si + 1}`}>
                  {si + 1}
                </span>
                <MiniNumber
                  label="Reps"
                  value={s.reps}
                  min={0}
                  max={100}
                  onChange={(reps) => set(si, { reps })}
                />
                <EffortInput scale={scale} rpe={s.rpe} onChange={(rpe) => set(si, { rpe })} />
                <div className="set-row__suggested">
                  <span className="mini__label">Suggested</span>
                  <span className="set-row__suggested-value px-num">
                    {suggested == null ? '—' : `${formatWeight(suggested, units)} ${units}`}
                  </span>
                </div>
              </div>
              <div className="set-row__line">
                <div
                  className="weight-control"
                  role="group"
                  aria-label={`Weight for set ${si + 1}`}
                >
                  <button
                    type="button"
                    className="step-btn"
                    aria-label="Less weight"
                    onClick={() => bump(-1)}
                  >
                    <MinusGlyph size={18} />
                  </button>
                  <MiniNumber
                    label={`Weight (${units})`}
                    hideLabel
                    wide
                    value={
                      s.weightKg == null ? null : Math.round(fromKg(s.weightKg, units) * 10) / 10
                    }
                    placeholder={shownWeight == null ? units : formatWeight(shownWeight, units)}
                    onChange={(v) => set(si, { weightKg: v == null ? null : toKg(v, units) })}
                  />
                  <button
                    type="button"
                    className="step-btn"
                    aria-label="More weight"
                    onClick={() => bump(1)}
                  >
                    <AddGlyph size={18} />
                  </button>
                  <span className="weight-control__unit">{units}</span>
                </div>
                <button
                  type="button"
                  className="done-btn"
                  aria-pressed={s.done}
                  aria-label={s.done ? `Set ${si + 1} done` : `Mark set ${si + 1} done`}
                  onClick={() => {
                    const nowDone = !s.done;
                    // Ticking a set locks in the suggestion as the weight used.
                    set(si, {
                      done: nowDone,
                      weightKg: s.weightKg ?? (nowDone ? suggested : null),
                    });
                    if (nowDone) onSetDone();
                  }}
                >
                  <CheckGlyph size={22} />
                </button>
                {entry.sets.length > 1 ? (
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={`Remove set ${si + 1}`}
                    onClick={() =>
                      onChange({ ...entry, sets: entry.sets.filter((_, i) => i !== si) })
                    }
                  >
                    <DeleteGlyph size={20} />
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        className="add-set-btn"
        onClick={() => onChange({ ...entry, sets: [...entry.sets, nextSet(entry.sets.at(-1))] })}
      >
        + Add set
      </button>
    </section>
  );
}
