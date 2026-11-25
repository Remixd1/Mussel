import { Button, Modal } from '../../components/ui';
import { useCopy } from '../../hooks/useCopy';

/** Pop-up refusing a routine name that's already in use. Open while `name` is set. */
export function NameTakenModal({ name, onClose }: { name: string | null; onClose: () => void }) {
  const copy = useCopy();
  return (
    <Modal
      open={name != null}
      onClose={onClose}
      title={copy('routine.nameTaken')}
      actions={
        <Button block onClick={onClose}>
          OK
        </Button>
      }
    >
      <p>
        You already have a routine called <strong>{name}</strong>. Pick a different name.
      </p>
    </Modal>
  );
}
