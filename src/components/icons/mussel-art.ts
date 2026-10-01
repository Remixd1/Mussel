/**
 * Mussel badge: an original logo. A flat mussel shell tilted up to the right
 * (hinge at the lower left, valves slightly parted at the rim) inside a thin
 * ring, drawn in one color with negative-space details.
 *
 * Geometry is computed here so the <MusselLogo> SVG and the PNG app icons
 * (scripts/generate-icons.mjs) come from the same shapes. Dependency-free.
 * Coordinates are in a 100x100 box.
 */

export type Point = readonly [x: number, y: number];

export interface MusselBadge {
  ring: { cx: number; cy: number; r: number; width: number };
  /** Solid shell outline. */
  shell: Point[];
  /** Shapes cut out of the shell: the opening, the seam, and a highlight. */
  cutouts: Point[][];
}

const CX = 50;
const CY = 52;
const HALF_LENGTH = 33;
const WIDTH = 52;
const TILT = (-32 * Math.PI) / 180;

/** Shell half-width at t (0 = hinge, 1 = rim): pointed hinge, rounded rim. */
function halfWidth(t: number): number {
  if (t <= 0 || t >= 1) return 0;
  return (WIDTH / 2) * Math.pow(t, 0.85) * Math.sqrt(1 - Math.pow(t, 5));
}

/** Gentle banana curve of the shell's spine. */
function spine(t: number): number {
  return -0.22 * WIDTH * (t - 0.55) * (t - 0.55) + 0.6;
}

/** Shell-local (t, v) to badge coordinates. v runs across the shell, negative = upper valve. */
function place(t: number, v: number): Point {
  const u = -HALF_LENGTH + 2 * HALF_LENGTH * t;
  const x = CX + u * Math.cos(TILT) - v * Math.sin(TILT);
  const y = CY + u * Math.sin(TILT) + v * Math.cos(TILT);
  return [Math.round(x * 100) / 100, Math.round(y * 100) / 100];
}

function range(from: number, to: number, steps: number): number[] {
  return Array.from({ length: steps + 1 }, (_, i) => from + ((to - from) * i) / steps);
}

/** Band between two edge functions of t, as a closed polygon. */
function band(
  from: number,
  to: number,
  upper: (t: number) => number,
  lower: (t: number) => number,
  steps = 48,
): Point[] {
  const ts = range(from, to, steps);
  return [
    ...ts.map((t) => place(t, upper(t))),
    ...[...ts].reverse().map((t) => place(t, lower(t))),
  ];
}

const SEAM = (t: number) => spine(t) + 0.06 * WIDTH;

function buildBadge(): MusselBadge {
  const shell = band(
    0,
    1,
    (t) => spine(t) - halfWidth(t),
    (t) => spine(t) + halfWidth(t),
    96,
  );

  // Valves part toward the rim. Runs past t = 1 so the gap opens to the outside.
  const gap = (t: number) => Math.max(0, (t - 0.58) * 0.42 * WIDTH * 0.5);
  const opening = band(
    0.58,
    1.04,
    (t) => SEAM(t) - gap(t),
    (t) => SEAM(t) + gap(t),
  );

  // Thin seam line along the closed part of the shell, tapering to the hinge.
  const seamHalf = (t: number) => 0.9 * Math.min(1, (t - 0.16) / 0.25);
  const seam = band(
    0.16,
    0.6,
    (t) => SEAM(t) - seamHalf(t),
    (t) => SEAM(t) + seamHalf(t),
  );

  // Highlight stripe on the upper valve, following its curve.
  const highlight = band(
    0.2,
    0.74,
    (t) => spine(t) - halfWidth(t) * 0.72,
    (t) => spine(t) - halfWidth(t) * 0.6,
  );

  return {
    ring: { cx: 50, cy: 50, r: 45.5, width: 4 },
    shell,
    cutouts: [opening, seam, highlight],
  };
}

export const MUSSEL_BADGE: MusselBadge = buildBadge();

/** Polygon points as an SVG `points` string. */
export function pointsAttr(points: readonly Point[]): string {
  return points.map(([x, y]) => `${x},${y}`).join(' ');
}
