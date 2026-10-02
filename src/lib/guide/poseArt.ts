/**
 * Turns a guide pose (a simple skeleton) into vector shapes in the pictogram
 * style, with targeted muscles highlighted as orange bands along the right
 * side of each body part. Pure; shared by the app and tests.
 *
 * Coordinates use the pictogram grid (figure ~ 48 tall, floor at y = 44);
 * guide canvases add headroom above (see GUIDE_VIEWBOX).
 */
import type { Shape } from '../../components/icons/art';

export type Pt = readonly [x: number, y: number];

export interface Pose {
  head: Pt;
  /** Also the shoulder. */
  neck: Pt;
  hip: Pt;
  elbow: Pt;
  hand: Pt;
  knee: Pt;
  ankle: Pt;
  toe?: Pt;
  /** Far arm / leg, drawn behind and faded (or solid for front views). */
  elbow2?: Pt;
  hand2?: Pt;
  knee2?: Pt;
  ankle2?: Pt;
  toe2?: Pt;
  /** 1 when the figure's front faces right (default); -1 when it faces the other way, e.g. lying face down. */
  facing?: 1 | -1;
  /** Draw the far limbs at full strength (front-on views). */
  solidPair?: boolean;
}

export interface GuideFrame {
  pose: Pose;
  /** Equipment drawn behind the figure (bench, seat, machine). */
  props?: Shape[];
  /** Equipment drawn in front (bar plates, handles). */
  front?: Shape[];
  /** Movement cues, drawn in blue. */
  arrows?: Shape[];
}

export type Muscle =
  | 'chest'
  | 'front-delts'
  | 'side-delts'
  | 'rear-delts'
  | 'triceps'
  | 'biceps'
  | 'forearms'
  | 'lats'
  | 'upper-back'
  | 'lower-back'
  | 'core'
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'calves';

export const MUSCLE_NAMES: Record<Muscle, string> = {
  chest: 'Chest',
  'front-delts': 'Front delts',
  'side-delts': 'Side delts',
  'rear-delts': 'Rear delts',
  triceps: 'Triceps',
  biceps: 'Biceps',
  forearms: 'Forearms',
  lats: 'Lats',
  'upper-back': 'Upper back',
  'lower-back': 'Lower back',
  core: 'Core',
  glutes: 'Glutes',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  calves: 'Calves',
};

/** Canvas for guide frames: the 48 grid plus 8 units of headroom for overhead lifts. */
export const GUIDE_VIEWBOX = '0 -8 48 56';

const LIMB = 4.4;
const BAND = 4.6;
const BAND_FULL = 8.4;
const BAND_OFFSET = 2.5;
const SECONDARY_OPACITY = 0.42;
const FAR_LIMB_OPACITY = 0.4;

type Segment = 'torso' | 'upperArm' | 'forearm' | 'thigh' | 'shin';
type Side = 'front' | 'back' | 'full';

interface BandSpec {
  seg: Segment;
  side: Side;
  from: number;
  to: number;
}

const BANDS: Record<Muscle, BandSpec[]> = {
  chest: [{ seg: 'torso', side: 'front', from: 0.05, to: 0.45 }],
  core: [{ seg: 'torso', side: 'front', from: 0.5, to: 0.95 }],
  lats: [{ seg: 'torso', side: 'back', from: 0.12, to: 0.6 }],
  'upper-back': [{ seg: 'torso', side: 'back', from: 0, to: 0.32 }],
  'lower-back': [{ seg: 'torso', side: 'back', from: 0.62, to: 0.98 }],
  'front-delts': [{ seg: 'upperArm', side: 'front', from: 0, to: 0.38 }],
  'side-delts': [{ seg: 'upperArm', side: 'full', from: 0, to: 0.36 }],
  'rear-delts': [{ seg: 'upperArm', side: 'back', from: 0, to: 0.38 }],
  biceps: [{ seg: 'upperArm', side: 'front', from: 0.35, to: 0.95 }],
  triceps: [{ seg: 'upperArm', side: 'back', from: 0.35, to: 0.95 }],
  forearms: [{ seg: 'forearm', side: 'full', from: 0.05, to: 0.65 }],
  glutes: [{ seg: 'thigh', side: 'back', from: 0, to: 0.32 }],
  quads: [{ seg: 'thigh', side: 'front', from: 0.12, to: 0.92 }],
  hamstrings: [{ seg: 'thigh', side: 'back', from: 0.36, to: 0.95 }],
  calves: [{ seg: 'shin', side: 'back', from: 0.1, to: 0.6 }],
};

interface Limbs {
  neck: Pt;
  hip: Pt;
  elbow?: Pt;
  hand?: Pt;
  knee?: Pt;
  ankle?: Pt;
}

function segmentPoints(l: Limbs, seg: Segment): [Pt, Pt] | null {
  switch (seg) {
    case 'torso':
      return [l.neck, l.hip];
    case 'upperArm':
      return l.elbow ? [l.neck, l.elbow] : null;
    case 'forearm':
      return l.elbow && l.hand ? [l.elbow, l.hand] : null;
    case 'thigh':
      return l.knee ? [l.hip, l.knee] : null;
    case 'shin':
      return l.knee && l.ankle ? [l.knee, l.ankle] : null;
  }
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** An orange band along part of a segment, offset to its front or back. */
function bandShape(
  [p, q]: [Pt, Pt],
  spec: BandSpec,
  facing: 1 | -1,
  opacity: number,
): Shape | null {
  const dx = q[0] - p[0];
  const dy = q[1] - p[1];
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return null;
  // The front of a right-facing figure is the segment direction turned -90 degrees.
  const nx = (facing * dy) / len;
  const ny = (facing * -dx) / len;
  const off = spec.side === 'full' ? 0 : spec.side === 'front' ? BAND_OFFSET : -BAND_OFFSET;
  const at = (t: number) => [r2(p[0] + dx * t + nx * off), r2(p[1] + dy * t + ny * off)];
  return {
    l: [...at(spec.from), ...at(spec.to)],
    w: spec.side === 'full' ? BAND_FULL : BAND,
    tone: 'signal',
    opacity,
  };
}

function muscleBands(
  limbs: Limbs,
  muscles: readonly Muscle[],
  facing: 1 | -1,
  opacity: number,
): Shape[] {
  return muscles.flatMap((m) =>
    BANDS[m].flatMap((spec) => {
      const seg = segmentPoints(limbs, spec.seg);
      const band = seg && bandShape(seg, spec, facing, opacity);
      return band ? [band] : [];
    }),
  );
}

const line = (pts: (Pt | undefined)[], opacity?: number): Shape | null => {
  const real = pts.filter((p): p is Pt => !!p);
  return real.length < 2
    ? null
    : { l: real.flatMap((p) => [p[0], p[1]]), w: LIMB, ...(opacity != null ? { opacity } : {}) };
};

const defaultToe = (ankle: Pt): Pt => [ankle[0] + 4, ankle[1]];

/** All shapes for one frame, back to front. */
export function frameShapes(
  frame: GuideFrame,
  primary: readonly Muscle[],
  secondary: readonly Muscle[],
): Shape[] {
  const p = frame.pose;
  const facing = p.facing ?? 1;
  const farOpacity = p.solidPair ? undefined : FAR_LIMB_OPACITY;
  const far: Limbs = {
    neck: p.neck,
    hip: p.hip,
    elbow: p.elbow2,
    hand: p.hand2,
    knee: p.knee2,
    ankle: p.ankle2,
  };
  const near: Limbs = {
    neck: p.neck,
    hip: p.hip,
    elbow: p.elbow,
    hand: p.hand,
    knee: p.knee,
    ankle: p.ankle,
  };
  // Far limbs only get arm/leg bands; the shared torso is banded once, below.
  const farOnly = (ms: readonly Muscle[]) =>
    ms.filter((m) => BANDS[m].every((b) => b.seg !== 'torso'));

  const shapes: (Shape | null)[] = [
    { l: [1, 44.6, 47, 44.6], w: 1.2, opacity: 0.3 },
    ...(frame.props ?? []),
    ...muscleBands(far, farOnly(primary), facing, p.solidPair ? 1 : 0.6),
    ...muscleBands(far, farOnly(secondary), facing, SECONDARY_OPACITY * 0.6),
    line([p.neck, p.elbow2, p.hand2], farOpacity),
    line([p.hip, p.knee2, p.ankle2, p.ankle2 && (p.toe2 ?? defaultToe(p.ankle2))], farOpacity),
    ...muscleBands(near, secondary, facing, SECONDARY_OPACITY),
    ...muscleBands(near, primary, facing, 1),
    line([p.neck, p.hip]),
    line([p.hip, p.knee, p.ankle, p.toe ?? defaultToe(p.ankle)]),
    line([p.neck, p.elbow, p.hand]),
    { c: [p.head[0], p.head[1], 4.2] },
    ...(frame.front ?? []),
    ...(frame.arrows ?? []).map((a) => ({ ...a, tone: a.tone ?? ('tide' as const) })),
  ];
  return shapes.filter((s): s is Shape => !!s);
}

// ---------------------------------------------------------------------------
// Equipment helpers
// ---------------------------------------------------------------------------

/** A barbell seen end-on: a plate around the bar at (x, y). */
export const plate = (x: number, y: number, r = 6): Shape[] => [
  { ring: [x, y, r], w: 2.2 },
  { c: [x, y, 1.5] },
];

/** A dumbbell seen end-on. */
export const dumbbell = (x: number, y: number): Shape[] => [
  { ring: [x, y, 3], w: 2 },
  { c: [x, y, 1.1] },
];

/** Flat bench: pad top at y, from x for w, with two legs to the floor. */
export const bench = (x: number, y: number, w: number): Shape[] => [
  { r: [x, y, w, 3, 1] },
  { r: [x + 2, y + 3, 2.4, 44 - y - 3] },
  { r: [x + w - 4.4, y + 3, 2.4, 44 - y - 3] },
];

/** A cable: thin line from a pulley to the hand, plus the pulley wheel. */
export const cable = (from: Pt, to: Pt): Shape[] => [
  { l: [from[0], from[1], to[0], to[1]], w: 1.3 },
  { ring: [from[0], from[1], 1.8], w: 1.6 },
];

/** A curved movement arrow: quadratic curve from a through control c to b, head at b. */
export function curve(a: Pt, c: Pt, b: Pt, w = 2.4): Shape[] {
  const angle = (Math.atan2(b[1] - c[1], b[0] - c[0]) * 180) / Math.PI;
  // Stop the stroke a little short so the cap hides under the head.
  const k = 0.88;
  const end: Pt = [c[0] + (b[0] - c[0]) * k, c[1] + (b[1] - c[1]) * k];
  return [
    { p: `M${a[0]} ${a[1]} Q${c[0]} ${c[1]} ${r2(end[0])} ${r2(end[1])}`, w, tone: 'tide' },
    { head: [b[0], b[1], r2(angle)], size: 5.4, tone: 'tide' },
  ];
}

/** A straight movement arrow. */
export const arrow = (a: Pt, b: Pt, w = 2.4): Shape => ({
  arrow: [a[0], a[1], b[0], b[1]],
  w,
  tone: 'tide',
});
