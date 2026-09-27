import type { PixelArt, Tone } from './art';

const TONE_FILL: Record<Tone, string> = {
  ink: 'var(--ink)',
  signal: 'var(--signal)',
  surface: 'var(--surface)',
};

export interface PixelIconProps {
  /** Rendered edge in px. Must be an integer multiple of the art's grid. */
  size: number;
  /** Accessible label. Omit for purely decorative icons (hidden from AT). */
  title?: string;
  className?: string;
}

/** Renders pixel art as crisp-edged inline SVG rects. */
export function PixelIcon({ art, size, title, className }: PixelIconProps & { art: PixelArt }) {
  if (import.meta.env.DEV && size % art.grid !== 0) {
    console.warn(`PixelIcon: size ${size} is not a multiple of grid ${art.grid}`);
  }
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={`0 0 ${art.grid} ${art.grid}`}
      shapeRendering="crispEdges"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {art.px.map(([x, y, w, h, tone = 'ink'], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={TONE_FILL[tone]} />
      ))}
    </svg>
  );
}
