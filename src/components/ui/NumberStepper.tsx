import { useId, useState } from 'react';
import { formatNumber } from '../../lib/calc/units';

export interface NumberStepperProps {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  /** Increment for the -/+ buttons (5 lb, 2.5 kg, 1 rep). */
  step: number;
  min?: number;
  max?: number;
  /** Unit shown after the field, e.g. "lb". */
  suffix?: string;
  /** Hide the visible label (still announced to screen readers). */
  hideLabel?: boolean;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** Round to the step's precision so 0.1 + 0.2 style drift never shows up. */
function tidy(n: number) {
  return Math.round(n * 1000) / 1000;
}

/** Big numeric field with -/+ buttons. Empty input means null. */
export function NumberStepper({
  label,
  value,
  onChange,
  step,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  suffix,
  hideLabel = false,
}: NumberStepperProps) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (value == null ? '' : formatNumber(value));

  const bump = (dir: 1 | -1) => {
    setDraft(null);
    // Snap to the step grid, so 47.5 + 5 -> 50 and 47.5 - 5 -> 45. Rounding the
    // ratio first absorbs float noise from unit conversion (225.0000001 lb).
    const ratio = Math.round(((value ?? 0) / step) * 1e6) / 1e6;
    const next = dir === 1 ? (Math.floor(ratio) + 1) * step : (Math.ceil(ratio) - 1) * step;
    onChange(tidy(clamp(next, min, max)));
  };

  const commit = (text: string) => {
    const trimmed = text.trim().replace(',', '.');
    if (trimmed === '') {
      onChange(null);
      return;
    }
    const n = Number(trimmed);
    if (Number.isFinite(n)) onChange(tidy(clamp(n, min, max)));
  };

  return (
    <div className="px-field">
      <label htmlFor={id} className={hideLabel ? 'visually-hidden' : 'px-field__label'}>
        {label}
      </label>
      <div className="px-stepper">
        <button
          type="button"
          className="px-stepper__btn"
          aria-label={`Decrease ${label}`}
          disabled={value != null && value <= min}
          onClick={() => bump(-1)}
        >
          -
        </button>
        <input
          id={id}
          className="px-input px-stepper__input"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={shown}
          onChange={(e) => {
            setDraft(e.target.value);
            commit(e.target.value);
          }}
          onBlur={() => setDraft(null)}
          onFocus={(e) => e.target.select()}
        />
        <button
          type="button"
          className="px-stepper__btn"
          aria-label={`Increase ${label}`}
          disabled={value != null && value >= max}
          onClick={() => bump(1)}
        >
          +
        </button>
        {suffix ? <span className="px-stepper__suffix">{suffix}</span> : null}
      </div>
    </div>
  );
}
