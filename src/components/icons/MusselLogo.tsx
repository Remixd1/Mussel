import { useId } from 'react';
import { MUSSEL_BADGE, pointsAttr } from './mussel-art';

const { ring, shell, cutouts } = MUSSEL_BADGE;

export interface MusselLogoProps {
  size?: number;
  /** Accessible label. Pass "" when a visible wordmark sits next to it. */
  title?: string;
  className?: string;
}

/** The Mussel badge, in the current ink color. */
export function MusselLogo({ size = 64, title = 'Mussel', className }: MusselLogoProps) {
  const maskId = `mussel-cut-${useId().replace(/:/g, '')}`;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role={title ? 'img' : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <mask id={maskId}>
          <rect width="100" height="100" fill="white" />
          {cutouts.map((pts, i) => (
            <polygon key={i} points={pointsAttr(pts)} fill="black" />
          ))}
        </mask>
      </defs>
      <circle
        cx={ring.cx}
        cy={ring.cy}
        r={ring.r}
        fill="none"
        stroke="var(--ink)"
        strokeWidth={ring.width}
      />
      <polygon points={pointsAttr(shell)} fill="var(--ink)" mask={`url(#${maskId})`} />
    </svg>
  );
}
