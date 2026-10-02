import { useState } from 'react';
import { isPictogramId } from '../../components/icons';
import { PictoTile } from '../../components/ui';
import { guideFor } from '../../data/exerciseGuides';
import { ExerciseGuideModal } from './ExerciseGuideModal';

/**
 * An exercise's pictogram tile. For exercises with a guide it is a button
 * (marked with a small "?") that opens the how-to.
 */
export function GuideTile({
  exerciseId,
  name,
  iconId,
  size = 40,
}: {
  exerciseId: string | null;
  name: string;
  iconId: string;
  size?: number;
}) {
  const [open, setOpen] = useState(false);
  const tile = <PictoTile icon={isPictogramId(iconId) ? iconId : 'machine'} size={size} title="" />;
  if (!guideFor(exerciseId)) return tile;
  return (
    <>
      <button
        type="button"
        className="guide-btn"
        aria-label={`How to do ${name}`}
        onClick={() => setOpen(true)}
      >
        {tile}
        <span className="guide-btn__badge" aria-hidden="true">
          ?
        </span>
      </button>
      {open ? <ExerciseGuideModal exerciseId={exerciseId} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
