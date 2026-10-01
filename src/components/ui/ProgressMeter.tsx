import type { ReactNode } from 'react';

export interface ProgressMeterProps {
  /** 0..1 */
  value: number;
  label: string;
  tone?: 'tide' | 'signal';
  /** Text inside the pill. Defaults to the percentage; pass null to hide it. */
  valueText?: string | null;
  /** Optional icon after the pill (e.g. a calendar glyph). */
  icon?: ReactNode;
}

/** Rounded pill gauge with the reading printed inside. */
export function ProgressMeter({
  value,
  label,
  tone = 'tide',
  valueText,
  icon,
}: ProgressMeterProps) {
  const clamped = Math.min(1, Math.max(0, value));
  const pct = Math.round(clamped * 100);
  const text = valueText === undefined ? `${pct}%` : valueText;
  return (
    <div className={`px-meter${tone === 'signal' ? ' px-meter--signal' : ''}`}>
      <div
        className="px-meter__track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={text ?? `${pct}%`}
      >
        <div className="px-meter__fill" style={{ width: `${clamped * 100}%` }} />
        {text ? (
          <span className="px-meter__value" aria-hidden="true">
            {text}
          </span>
        ) : null}
      </div>
      {icon ? (
        <span className="px-meter__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
    </div>
  );
}
