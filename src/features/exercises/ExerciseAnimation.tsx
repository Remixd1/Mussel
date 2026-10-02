import { createElement } from 'react';
import { artToElements } from '../../components/icons/render';
import type { ExerciseGuide } from '../../data/exerciseGuides';
import { frameShapes, GUIDE_VIEWBOX } from '../../lib/guide/poseArt';

function reactProps(attrs: Record<string, string | number>) {
  return Object.fromEntries(
    Object.entries(attrs).map(([k, v]) => [k.replace(/-([a-z])/g, (_, c) => c.toUpperCase()), v]),
  );
}

const LABELS = ['Start', 'Finish'] as const;

/**
 * Two-frame demo of an exercise: the start and finish positions alternate.
 * With reduced motion both frames sit side by side instead (see guide.css).
 */
export function ExerciseAnimation({ name, guide }: { name: string; guide: ExerciseGuide }) {
  return (
    <div
      className="guide-anim"
      role="img"
      aria-label={`${name}: start and finish positions, target muscles highlighted in orange`}
    >
      {guide.frames.map((frame, i) => (
        <figure key={i} className={`guide-anim__frame guide-anim__frame--${i}`} aria-hidden="true">
          <svg viewBox={GUIDE_VIEWBOX} focusable="false">
            {artToElements({
              grid: 48,
              stroke: 4,
              shapes: frameShapes(frame, guide.primary, guide.secondary),
            }).map(({ tag, attrs }, k) => createElement(tag, { key: k, ...reactProps(attrs) }))}
          </svg>
          <figcaption>{LABELS[i]}</figcaption>
        </figure>
      ))}
    </div>
  );
}
