import { PICTOGRAMS, type PictogramId } from './art';
import { VectorIcon } from './VectorIcon';

/** Pictograms are vector art and scale to any size; 24 to 96px is typical. */
export type PictogramSize = number;

export interface PictogramProps {
  size?: PictogramSize;
  title?: string;
  className?: string;
}

function pictogram(id: PictogramId, defaultTitle: string) {
  function Pictogram({ size = 48, title = defaultTitle, className }: PictogramProps) {
    return <VectorIcon art={PICTOGRAMS[id]} size={size} title={title} className={className} />;
  }
  Pictogram.displayName = `Pictogram(${id})`;
  return Pictogram;
}

export const SquatIcon = pictogram('squat', 'Squat');
export const BenchIcon = pictogram('bench', 'Bench press');
export const DeadliftIcon = pictogram('deadlift', 'Deadlift');
export const OhpIcon = pictogram('ohp', 'Overhead press');
export const PullupIcon = pictogram('pullup', 'Pull-up');
export const RowIcon = pictogram('row', 'Row');
export const CurlIcon = pictogram('curl', 'Curl');
export const PushupIcon = pictogram('pushup', 'Push-up');
export const LungeIcon = pictogram('lunge', 'Lunge');
export const PlankIcon = pictogram('plank', 'Plank');
export const RunIcon = pictogram('run', 'Run');
export const CycleIcon = pictogram('cycle', 'Cycle');
export const CoreIcon = pictogram('core', 'Core');
export const StretchIcon = pictogram('stretch', 'Stretch');
export const MachineIcon = pictogram('machine', 'Machine');
export const RestIcon = pictogram('rest', 'Rest');
export const PrIcon = pictogram('pr', 'Personal record');
export const FormWarningIcon = pictogram('form-warning', 'Form warning');
export const BodyweightIcon = pictogram('bodyweight', 'Bodyweight');
