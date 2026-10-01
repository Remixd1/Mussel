import { createElement } from 'react';
import type { VectorArt } from './art';
import { artToElements, type SvgElement } from './render';

/** SVG attribute names (stroke-width) to React prop names (strokeWidth). */
function reactProps(attrs: SvgElement['attrs']) {
  return Object.fromEntries(
    Object.entries(attrs).map(([k, v]) => [k.replace(/-([a-z])/g, (_, c) => c.toUpperCase()), v]),
  );
}

export interface VectorIconProps {
  /** Rendered edge in px. */
  size: number;
  /** Accessible label. Omit (or pass "") for decorative icons, hidden from AT. */
  title?: string;
  className?: string;
}

/** Renders vector art as inline SVG in the current theme colors. */
export function VectorIcon({ art, size, title, className }: VectorIconProps & { art: VectorArt }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={`0 0 ${art.grid} ${art.grid}`}
      role={title ? 'img' : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {artToElements(art).map(({ tag, attrs }, i) =>
        createElement(tag, { key: i, ...reactProps(attrs) }),
      )}
    </svg>
  );
}
