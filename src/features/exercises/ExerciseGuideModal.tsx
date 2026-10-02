import { Button, Modal } from '../../components/ui';
import { SEED_EXERCISES } from '../../data/exercises';
import { guideFor } from '../../data/exerciseGuides';
import { ExerciseGuideView } from './ExerciseGuideView';

/** Read-only guide for an exercise already in a workout or routine. */
export function ExerciseGuideModal({
  exerciseId,
  onClose,
}: {
  exerciseId: string | null;
  onClose: () => void;
}) {
  const exercise = SEED_EXERCISES.find((e) => e.id === exerciseId);
  const guide = guideFor(exerciseId);
  if (!exercise || !guide) return null;
  return (
    <Modal open onClose={onClose} title={exercise.name}>
      <ExerciseGuideView
        exercise={exercise}
        guide={guide}
        footer={<Button onClick={onClose}>Close</Button>}
      />
    </Modal>
  );
}
