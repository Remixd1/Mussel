import { ProgressMeter } from '../../components/ui';
import { formatClock, type RestTimerView } from '../../hooks/useRestTimer';

/** Sticky countdown above the dock while resting. */
export function RestTimerBar({
  view,
  exerciseName,
  onAdjust,
  onSkip,
}: {
  view: RestTimerView;
  exerciseName: string | null;
  onAdjust: (deltaSec: number) => void;
  onSkip: () => void;
}) {
  if (!view.running) return null;
  return (
    // role=timer is not live, so the clock isn't read out every second; the
    // rest-done toast is announced instead.
    <div className="rest-bar" role="timer" aria-label="Recovery interval">
      <div className="rest-bar__top">
        <div>
          <p className="px-display">Recovery interval</p>
          {exerciseName ? <p className="rest-bar__exercise">{exerciseName}</p> : null}
        </div>
        <span className="rest-bar__clock px-num">{formatClock(view.remainingSec)}</span>
      </div>
      <ProgressMeter label="Rest remaining" tone="signal" value={view.fraction} valueText={null} />
      <div className="rest-bar__actions">
        <button type="button" className="rest-bar__btn" onClick={() => onAdjust(-15)}>
          −15s
        </button>
        <button type="button" className="rest-bar__btn" onClick={() => onAdjust(15)}>
          +15s
        </button>
        <button type="button" className="rest-bar__btn rest-bar__btn--skip" onClick={onSkip}>
          Skip
        </button>
      </div>
    </div>
  );
}
