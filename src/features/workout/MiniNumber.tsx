import { useId, useState } from 'react';
import { formatNumber } from '../../lib/calc/units';

/** A compact labelled number box for dense rows (reps, RPE, PR). Empty = null. */
export function MiniNumber({
  label,
  value,
  onChange,
  placeholder,
  min = 0,
  max = 9999,
  wide = false,
  hideLabel = false,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  wide?: boolean;
  hideLabel?: boolean;
}) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (value == null ? '' : formatNumber(value));
  return (
    <label className={`mini${wide ? ' mini--wide' : ''}`} htmlFor={id}>
      <span className={hideLabel ? 'visually-hidden' : 'mini__label'}>{label}</span>
      <input
        id={id}
        className="mini__input px-num"
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder={placeholder}
        value={shown}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          const text = e.target.value;
          setDraft(text);
          const t = text.trim().replace(',', '.');
          if (t === '') onChange(null);
          else if (/^\d*\.?\d+$/.test(t) || /^\d+\.$/.test(t)) {
            const n = Math.min(max, Math.max(min, Number(t)));
            if (Number.isFinite(n)) onChange(n);
          }
        }}
        onBlur={() => setDraft(null)}
      />
    </label>
  );
}
