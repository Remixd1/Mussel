import type { CSSProperties } from 'react';

export interface ProgressMeterProps {
  /** 0..1 */
  value: number;
  segments?: number;
  label: string;
  tone?: 'tide' | 'signal';
}

/** Segmented block bar that fills in whole steps. */
export function ProgressMeter({ value, segments = 10, label, tone = 'tide' }: ProgressMeterProps) {
  const clamped = Math.min(1, Math.max(0, value));
  const lit = Math.round(clamped * segments);
  return (
    <div
      className={`px-meter${tone === 'signal' ? ' px-meter--signal' : ''}`}
      style={{ '--segments': segments } as CSSProperties}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
    >
      {Array.from({ length: segments }, (_, i) => (
        <span key={i} className={`px-meter__seg${i < lit ? ' px-meter__seg--on' : ''}`} />
      ))}
    </div>
  );
}
