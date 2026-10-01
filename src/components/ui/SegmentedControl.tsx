import { useId } from 'react';

export interface SegmentOption<T extends string | number> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string | number> {
  label: string;
  value: T;
  options: readonly SegmentOption<T>[];
  onChange: (value: T) => void;
}

/**
 * Pick one of a few options (units, theme, rest time). Native radio inputs
 * underneath, so keyboard and screen-reader behavior come for free.
 */
export function SegmentedControl<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: SegmentedControlProps<T>) {
  const name = useId();
  return (
    <fieldset className="px-segmented">
      <legend className="px-field__label">{label}</legend>
      <div
        className="px-segmented__track"
        style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
      >
        {options.map((opt) => (
          <label key={String(opt.value)} className="px-segmented__option">
            <input
              type="radio"
              name={name}
              value={String(opt.value)}
              checked={opt.value === value}
              onChange={() => onChange(opt.value)}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
