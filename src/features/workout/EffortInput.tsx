import { rirToRpe, rpeToRir } from '../../lib/calc/effort';
import type { EffortScale } from '../../lib/types';
import { MiniNumber } from './MiniNumber';

/** RPE or RIR entry, per the user's preference; always stores canonical RPE. */
export function EffortInput({
  scale,
  rpe,
  onChange,
  hideLabel,
}: {
  scale: EffortScale;
  rpe: number | null;
  onChange: (rpe: number | null) => void;
  hideLabel?: boolean;
}) {
  const shown = rpe == null ? null : scale === 'rir' ? rpeToRir(rpe) : rpe;
  return (
    <MiniNumber
      label={scale === 'rir' ? 'RIR' : 'RPE'}
      value={shown}
      min={0}
      max={10}
      hideLabel={hideLabel}
      onChange={(v) => {
        if (v == null) return onChange(null);
        // Snap to the 0.5 grid.
        const snapped = Math.round(v * 2) / 2;
        onChange(scale === 'rir' ? rirToRpe(snapped) : snapped);
      }}
    />
  );
}
