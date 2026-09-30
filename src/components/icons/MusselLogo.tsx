import { MUSSEL_MAP, MUSSEL_PALETTE } from './mussel-art';

export type MusselSize = 32 | 64 | 96 | 128;

interface Run {
  x: number;
  y: number;
  w: number;
  fill: string;
}

// Merge horizontal runs of the same color so the SVG stays small.
const RUNS: Run[] = MUSSEL_MAP.flatMap((row, y) => {
  const runs: Run[] = [];
  for (let x = 0; x < row.length; x++) {
    const fill = MUSSEL_PALETTE[row[x]];
    if (!fill) continue;
    const last = runs[runs.length - 1];
    if (last && last.fill === fill && last.x + last.w === x) last.w++;
    else runs.push({ x, y, w: 1, fill });
  }
  return runs;
});

export function MusselLogo({
  size = 64,
  title = 'Mussel',
  className,
}: {
  size?: MusselSize;
  title?: string;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      shapeRendering="crispEdges"
      role={title ? 'img' : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {RUNS.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.fill} />
      ))}
    </svg>
  );
}
