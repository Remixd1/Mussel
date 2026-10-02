import type { ReactNode } from 'react';
import { isPictogramId } from '../../components/icons';
import { PictoTile } from '../../components/ui';
import type { SeedExercise } from '../../data/exercises';
import type { ExerciseGuide } from '../../data/exerciseGuides';
import { MUSCLE_NAMES } from '../../lib/guide/poseArt';
import { ExerciseAnimation } from './ExerciseAnimation';
import './guide.css';

/** Full how-to for one exercise, with a sticky action bar at the bottom. */
export function ExerciseGuideView({
  exercise,
  guide,
  footer,
}: {
  exercise: SeedExercise;
  guide: ExerciseGuide;
  footer: ReactNode;
}) {
  return (
    <article className="guide" aria-label={`${exercise.name} guide`}>
      <header className="guide__head">
        <PictoTile
          icon={isPictogramId(exercise.icon) ? exercise.icon : 'machine'}
          size={40}
          title=""
        />
        <div>
          <p className="guide__cat">{exercise.category}</p>
          <p className="guide__summary">{guide.summary}</p>
        </div>
      </header>

      <ExerciseAnimation name={exercise.name} guide={guide} />

      <section aria-label="Muscles worked" className="guide__muscles">
        <h3>Muscles worked</h3>
        <ul className="guide__chips">
          {guide.primary.map((m) => (
            <li key={m} className="guide__chip guide__chip--primary">
              {MUSCLE_NAMES[m]}
            </li>
          ))}
          {guide.secondary.map((m) => (
            <li key={m} className="guide__chip">
              {MUSCLE_NAMES[m]}
            </li>
          ))}
        </ul>
        <p className="guide__legend">
          <span className="guide__swatch guide__swatch--primary" aria-hidden="true" /> Primary
          <span className="guide__swatch" aria-hidden="true" /> Secondary
          <span className="guide__swatch guide__swatch--move" aria-hidden="true" /> Movement
        </p>
      </section>

      <section aria-label="How to do it">
        <h3>How to do it</h3>
        <ol className="guide__steps">
          {guide.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </section>

      {guide.tips.length ? (
        <section aria-label="Tips">
          <h3>Tips</h3>
          <ul className="guide__tips">
            {guide.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="guide__footer">{footer}</div>
    </article>
  );
}
