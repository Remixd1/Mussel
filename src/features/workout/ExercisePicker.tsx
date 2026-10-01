import { useMemo, useState } from 'react';
import { isPictogramId } from '../../components/icons';
import { Modal, PictoTile, TextField } from '../../components/ui';
import { CATEGORIES, SEED_EXERCISES } from '../../data/exercises';

export interface ExercisePick {
  exerciseId: string | null;
  name: string;
}

/** Search the exercise list or add a custom name. */
export function ExercisePicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (pick: ExercisePick) => void;
}) {
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();
  const matches = useMemo(
    () => SEED_EXERCISES.filter((e) => !term || e.name.toLowerCase().includes(term)),
    [term],
  );
  const exact = SEED_EXERCISES.some((e) => e.name.toLowerCase() === term);

  const pick = (p: ExercisePick) => {
    onPick(p);
    setQ('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add exercise">
      <div className="px-stack">
        <TextField
          label="Search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Bench, squat, row…"
          autoComplete="off"
        />
        {term && !exact ? (
          <button
            type="button"
            className="pick-row pick-row--custom"
            onClick={() => pick({ exerciseId: null, name: q.trim() })}
          >
            <span className="pick-row__plus" aria-hidden="true">
              +
            </span>
            <span>Add “{q.trim()}” as a custom exercise</span>
          </button>
        ) : null}
        {CATEGORIES.map((cat) => {
          const items = matches.filter((e) => e.category === cat);
          if (!items.length) return null;
          return (
            <section key={cat} aria-label={cat}>
              <p className="px-display pick-cat">{cat}</p>
              <ul className="pick-list">
                {items.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      className="pick-row"
                      onClick={() => pick({ exerciseId: e.id, name: e.name })}
                    >
                      <PictoTile
                        icon={isPictogramId(e.icon) ? e.icon : 'machine'}
                        size={32}
                        title=""
                      />
                      <span>{e.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </Modal>
  );
}
