/**
 * Vector data for every pictogram and UI glyph. Original artwork for the
 * Remixd Kinetics Laboratory in a clinical safety-signage style
 * (CLAUDE.md §3.5): solid round heads, thick round-capped limbs, simple
 * block equipment, one motion cue per sign.
 *
 * Kept dependency-free (no imports) so Node scripts and tests can read it too.
 */

/**
 * Ink is the default tone; `signal` is the accent (orange: PRs, warnings,
 * targeted muscles); `tide` is blue (guide arrows); `surface` cuts out.
 */
export type Tone = 'ink' | 'signal' | 'tide' | 'surface';

export type Shape =
  /** Filled circle. */
  | { c: readonly [cx: number, cy: number, r: number]; tone?: Tone; opacity?: number }
  /** Stroked circle outline. */
  | {
      ring: readonly [cx: number, cy: number, r: number];
      w?: number;
      tone?: Tone;
      opacity?: number;
    }
  /** Round-capped polyline through x,y pairs. */
  | { l: readonly number[]; w?: number; tone?: Tone; opacity?: number }
  /** Filled rectangle, optional corner radius. */
  | {
      r: readonly [x: number, y: number, w: number, h: number, rx?: number];
      tone?: Tone;
      opacity?: number;
    }
  /** Raw SVG path, filled by default or stroked when `w` is set. */
  | { p: string; w?: number; tone?: Tone; opacity?: number }
  /** Straight arrow from (x1,y1) to (x2,y2) with a solid head. */
  | {
      arrow: readonly [x1: number, y1: number, x2: number, y2: number];
      w?: number;
      tone?: Tone;
      opacity?: number;
    }
  /** Solid arrowhead with its tip at (x,y), pointing along `angle` degrees (0 = right, 90 = down). */
  | {
      head: readonly [x: number, y: number, angle: number];
      size?: number;
      tone?: Tone;
      opacity?: number;
    };

export interface VectorArt {
  /** viewBox edge. */
  grid: number;
  /** Default stroke width for `l`, `ring`, and stroked `p` shapes. */
  stroke: number;
  shapes: readonly Shape[];
}

// ---------------------------------------------------------------------------
// Pictograms (48x48)
// ---------------------------------------------------------------------------

export const PICTOGRAM_IDS = [
  'squat',
  'bench',
  'deadlift',
  'ohp',
  'pullup',
  'row',
  'curl',
  'pushup',
  'lunge',
  'plank',
  'run',
  'cycle',
  'core',
  'stretch',
  'machine',
  'rest',
  'pr',
  'form-warning',
  'bodyweight',
] as const;

export type PictogramId = (typeof PICTOGRAM_IDS)[number];

const P = 48;
const LIMB = 4.4;
const THIN = 2.4;

export const PICTOGRAMS: Record<PictogramId, VectorArt> = {
  // Deep squat, bar across the shoulders, down arrow beside.
  squat: {
    grid: P,
    stroke: LIMB,
    shapes: [
      { r: [5, 15.5, 31, 3, 1] }, // bar
      { r: [7, 9, 4, 15, 1.5] }, // plate
      { r: [30, 9, 4, 15, 1.5] }, // plate
      { c: [21, 10.5, 4.2] }, // head
      { l: [20, 18, 15, 29] }, // torso, leaning forward
      { l: [15, 29, 27, 29.5, 25.5, 41, 31, 41] }, // thigh, shin, foot
      { l: [19.5, 19.5, 25, 21.5, 26.5, 17.5] }, // arm to the bar
      { arrow: [42, 11, 42, 36] },
    ],
  },

  // Lying on a flat bench, bar above the chest, up arrow.
  bench: {
    grid: P,
    stroke: LIMB,
    shapes: [
      { r: [4, 30.5, 28, 3, 1] }, // bench pad
      { r: [7, 33, 3, 9] }, // bench leg
      { r: [26, 33, 3, 9] }, // bench leg
      { c: [8.5, 25.5, 4.2] }, // head
      { l: [13, 27.5, 25, 27.5] }, // torso
      { l: [25, 27.5, 32.5, 24, 33.5, 41, 38, 41] }, // leg, foot on floor
      { l: [16, 27, 16, 13.5] }, // arms locked out
      { r: [4, 11, 25, 3, 1] }, // bar
      { r: [6, 5.5, 4, 14, 1.5] }, // plate
      { r: [23, 5.5, 4, 14, 1.5] }, // plate
      { arrow: [42, 34, 42, 9] },
    ],
  },

  // Hinged at the hips, bar at the shins, up arrow.
  deadlift: {
    grid: P,
    stroke: LIMB,
    shapes: [
      { c: [28.5, 10.5, 4.2] }, // head
      { l: [26, 15.5, 14, 23.5] }, // torso, hinged
      { l: [14, 23.5, 20, 31.5, 18, 41, 23, 41] }, // leg
      { l: [24, 17, 24, 33] }, // arm hanging to the bar
      { r: [5, 33, 31, 3, 1] }, // bar
      { r: [7, 27, 4, 15, 1.5] }, // plate
      { r: [30, 27, 4, 15, 1.5] }, // plate
      { arrow: [42, 38, 42, 11] },
    ],
  },

  // Standing, bar locked out overhead, up arrow.
  ohp: {
    grid: P,
    stroke: LIMB,
    shapes: [
      { r: [4, 5, 33, 3, 1] }, // bar
      { r: [6, 0.5, 4, 12, 1.5] }, // plate
      { r: [31, 0.5, 4, 12, 1.5] }, // plate
      { l: [13, 7, 16.5, 20.5, 24.5, 20.5, 28, 7] }, // arms + shoulders
      { c: [20.5, 14.5, 4.2] }, // head
      { l: [20.5, 21, 20.5, 31] }, // torso
      { l: [16.5, 42, 20.5, 31, 24.5, 42] }, // legs
      { arrow: [42, 40, 42, 17] },
    ],
  },

  // Hanging from a bar, up arrow.
  pullup: {
    grid: P,
    stroke: LIMB,
    shapes: [
      { r: [3, 5, 34, 3, 1] }, // bar
      { l: [11, 7.5, 15, 20, 26, 20, 30, 7.5] }, // arms + shoulders
      { c: [20.5, 13.5, 4.2] }, // head
      { l: [20.5, 20.5, 20.5, 31] }, // torso
      { l: [18, 41, 20.5, 31, 23, 41] }, // legs
      { arrow: [42, 36, 42, 12] },
    ],
  },

  // Seated cable row, pulling toward the torso, arrow toward the body.
  row: {
    grid: P,
    stroke: LIMB,
    shapes: [
      { r: [40, 5, 4, 37, 1] }, // stack
      { l: [26, 20.5, 40, 20.5], w: 1.6 }, // cable
      { c: [10.5, 11, 4.2] }, // head
      { l: [10.5, 16.5, 10.5, 29] }, // torso
      { r: [3, 30.5, 15, 3, 1] }, // seat
      { r: [8.5, 33, 4, 9] }, // seat post
      { l: [11, 28, 26, 28] }, // legs
      { r: [26.5, 21, 3, 12, 1] }, // foot plate
      { l: [11.5, 19, 22, 20.5] }, // arms
      { r: [22, 16.5, 3.5, 8, 1] }, // handle
      { arrow: [36, 40, 17, 40], w: THIN + 0.6 },
    ],
  },

  // Dumbbell curl, forearm raised, curved arrow.
  curl: {
    grid: P,
    stroke: LIMB,
    shapes: [
      { c: [15, 9.5, 4.2] }, // head
      { l: [15, 15, 15, 28.5] }, // torso
      { l: [11, 42, 15, 28.5, 19, 42] }, // legs
      { l: [16, 17, 18, 26, 25.5, 18.5] }, // upper arm + forearm, curled
      { r: [23.5, 12.5, 3.5, 10, 1.2] }, // dumbbell plate
      { r: [30.5, 12.5, 3.5, 10, 1.2] }, // dumbbell plate
      { r: [26, 16, 5, 3] }, // dumbbell handle
      { p: 'M25 35 Q37 35 37 25', w: THIN + 0.6 }, // curved arrow
      { head: [37, 23, -90] },
    ],
  },

  // Push-up plank on hands, up/down double arrow.
  pushup: {
    grid: P,
    stroke: LIMB,
    shapes: [
      { l: [6, 37, 31, 25.5] }, // body, toes to shoulders
      { c: [36.5, 21.5, 4.2] }, // head
      { l: [31, 25.5, 31, 38, 34, 38] }, // arm + hand
      { l: [12, 10, 12, 21], w: THIN + 0.6 }, // double arrow shaft
      { head: [12, 6.5, -90] },
      { head: [12, 24.5, 90] },
    ],
  },

  // Split stance, back knee low.
  lunge: {
    grid: P,
    stroke: LIMB,
    shapes: [
      { c: [23, 8.5, 4.2] }, // head
      { l: [23, 14, 23, 26] }, // torso
      { l: [23, 17, 18.5, 24.5] }, // arm
      { l: [23, 26, 32.5, 27, 32.5, 41, 37, 41] }, // front leg
      { l: [23, 26, 15.5, 37.5, 7, 39] }, // back leg, knee low
    ],
  },

  // Forearm plank, tick marks above for time.
  plank: {
    grid: P,
    stroke: LIMB,
    shapes: [
      { l: [5, 37, 29, 28.5] }, // body
      { c: [34.5, 26, 4.2] }, // head
      { l: [29, 28.5, 29, 37, 38.5, 37] }, // upper arm + forearm
      { p: 'M9 16 A15 15 0 0 1 39 16', w: THIN }, // time arc
      { l: [9, 16, 9, 12], w: THIN },
      { l: [16.5, 7.5, 18, 11], w: THIN },
      { l: [24, 5, 24, 9], w: THIN },
      { l: [31.5, 7.5, 30, 11], w: THIN },
      { l: [39, 16, 39, 12], w: THIN },
      { l: [24, 16, 29, 11.5], w: THIN }, // hand of the clock
    ],
  },

  // Mid-stride with speed lines behind.
  run: {
    grid: P,
    stroke: LIMB,
    shapes: [
      { c: [29, 8.5, 4.2] }, // head
      { l: [27.5, 14, 23, 25.5] }, // torso, leaning into the stride
      { l: [26.5, 17, 31.5, 22, 36, 18] }, // front arm
      { l: [25.5, 17, 20, 21.5, 16, 18.5] }, // back arm
      { l: [23, 25.5, 32, 30, 29, 39] }, // front leg
      { l: [23, 25.5, 17.5, 33.5, 9, 35.5] }, // back leg
      { l: [2, 13, 10, 13], w: THIN }, // speed lines
      { l: [0.5, 20, 8, 20], w: THIN },
      { l: [3, 27, 9, 27], w: THIN },
    ],
  },

  // Riding a bike, speed lines.
  cycle: {
    grid: P,
    stroke: LIMB,
    shapes: [
      { ring: [11.5, 36, 7], w: 2.6 }, // rear wheel
      { ring: [36.5, 36, 7], w: 2.6 }, // front wheel
      { l: [11.5, 36, 21, 36, 30, 26, 17, 26, 21, 36], w: 2.4 }, // frame
      { l: [30, 26, 36.5, 36], w: 2.4 }, // fork
      { l: [30, 26, 31, 21.5, 35, 21.5], w: 2.4 }, // stem + bar
      { l: [14, 22.5, 20, 22.5], w: 2.8 }, // saddle
      { c: [30, 8.5, 4.2] }, // head
      { l: [18, 21, 27, 13.5] }, // torso
      { l: [27, 14.5, 32, 21] }, // arm
      { l: [18, 21, 26.5, 26, 22.5, 33] }, // leg on the pedal
      { l: [1, 12, 8, 12], w: THIN }, // speed lines
      { l: [2.5, 18, 9.5, 18], w: THIN },
    ],
  },

  // Crunch, curved arrow at the torso.
  core: {
    grid: P,
    stroke: LIMB,
    shapes: [
      { c: [9.5, 26.5, 4.2] }, // head
      { l: [14.5, 30.5, 24, 38] }, // torso, curling up
      { l: [24, 38, 31, 28, 37, 38, 41, 38] }, // legs, knees up
      { l: [16, 30, 26, 27] }, // arms reaching to the knees
      { p: 'M27 20 Q18 11 8 17', w: THIN + 0.6 }, // curved arrow
      { head: [6.5, 18.5, 145] },
    ],
  },

  // Forward fold, reaching to the toes.
  stretch: {
    grid: P,
    stroke: LIMB,
    shapes: [
      { l: [15, 21, 16.5, 41, 21.5, 41] }, // leg + foot
      { l: [15, 21, 26.5, 30] }, // torso, folded forward
      { c: [30, 34, 4.2] }, // head
      { l: [25, 30.5, 21.5, 39.5] }, // arm to the toes
      { arrow: [40, 10, 40, 32] },
    ],
  },

  // Seated at a cable stack.
  machine: {
    grid: P,
    stroke: LIMB,
    shapes: [
      { r: [39, 4, 4, 38, 1] }, // upright
      { r: [13, 4, 30, 3, 1] }, // top beam
      { r: [31, 22, 6, 4, 0.8] }, // weight plates
      { r: [31, 27.5, 6, 4, 0.8] },
      { r: [31, 33, 6, 4, 0.8] },
      { l: [21, 7, 21, 15], w: 1.6 }, // cable
      { r: [14, 14.5, 14, 3, 1] }, // handle
      { c: [9, 21, 4.2] }, // head
      { l: [9.5, 26.5, 9.5, 34] }, // torso
      { l: [10.5, 27, 17.5, 17] }, // arm up to the handle
      { r: [2, 35, 15, 3, 1] }, // seat
      { l: [10, 34, 23, 34, 23, 42] }, // thigh + shin
    ],
  },

  // Seated, hourglass beside.
  rest: {
    grid: P,
    stroke: LIMB,
    shapes: [
      { c: [11, 11.5, 4.2] }, // head
      { l: [11, 17, 11, 29] }, // torso
      { l: [11, 19.5, 19, 27] }, // arm resting on the knee
      { l: [11, 29, 21, 29, 21, 41] }, // thigh + shin
      { r: [3, 30.5, 13, 3, 1] }, // stool
      { r: [7.5, 33, 4, 9] },
      // hourglass
      { r: [28, 8, 15, 2.6, 1] },
      { r: [28, 38.5, 15, 2.6, 1] },
      { p: 'M30.5 11 L40.5 11 L35.5 24 L40.5 38 L30.5 38 L35.5 24 Z', w: 2.2 },
      { p: 'M32.5 37 L38.5 37 L35.5 31 Z' }, // sand, bottom
      { p: 'M32.5 13.5 L38.5 13.5 L35.5 19 Z' }, // sand, top
    ],
  },

  // Both arms raised, signal burst around.
  pr: {
    grid: P,
    stroke: LIMB,
    shapes: [
      { c: [24, 13.5, 4.2] }, // head
      { l: [15, 8, 19.5, 19.5, 28.5, 19.5, 33, 8] }, // arms raised
      { l: [24, 20, 24, 31] }, // torso
      { l: [19.5, 42, 24, 31, 28.5, 42] }, // legs
      // burst
      { l: [24, 1, 24, 5], w: THIN + 0.4, tone: 'signal' },
      { l: [8, 4, 11, 7.5], w: THIN + 0.4, tone: 'signal' },
      { l: [40, 4, 37, 7.5], w: THIN + 0.4, tone: 'signal' },
      { l: [3.5, 18, 8, 18], w: THIN + 0.4, tone: 'signal' },
      { l: [44.5, 18, 40, 18], w: THIN + 0.4, tone: 'signal' },
      { l: [6, 31, 10, 28.5], w: THIN + 0.4, tone: 'signal' },
      { l: [42, 31, 38, 28.5], w: THIN + 0.4, tone: 'signal' },
    ],
  },

  // Rounded spine, signal warning triangle.
  'form-warning': {
    grid: P,
    stroke: LIMB,
    shapes: [
      { l: [12, 25, 12.5, 41, 17, 41] }, // leg + foot
      { p: 'M12 25 Q13 12 24 14', w: LIMB }, // rounded spine
      { c: [27, 19.5, 4.2] }, // head, drooping forward
      { l: [21.5, 15.5, 20.5, 28] }, // arm hanging
      { p: 'M38.5 2.5 L47 17.5 L30 17.5 Z', tone: 'signal' }, // warning triangle
      { r: [37.4, 7.5, 2.2, 5.6, 1] }, // exclamation
      { c: [38.5, 15, 1.2] },
    ],
  },

  // Bathroom scale with a figure standing on it.
  bodyweight: {
    grid: P,
    stroke: LIMB,
    shapes: [
      { c: [24, 8, 4.2] }, // head
      { l: [24, 13.5, 24, 24] }, // torso
      { l: [19, 23, 24, 15.5, 29, 23] }, // arms
      { l: [20, 33, 24, 24, 28, 33] }, // legs
      { r: [7, 34, 34, 8, 2] }, // scale
      { r: [19, 36, 10, 3.5, 1], tone: 'surface' }, // display window
    ],
  },
};

// ---------------------------------------------------------------------------
// UI glyphs (24x24, line style, no tile)
// ---------------------------------------------------------------------------

export const GLYPH_IDS = [
  'home',
  'workout',
  'upload',
  'profile',
  'friends',
  'clipboard',
  'calendar',
  'folder',
  'sun',
  'moon',
  'play',
  'minus',
  'add',
  'delete',
  'edit',
  'history',
  'chart',
  'settings',
  'check',
  'timer',
  'back',
] as const;

export type GlyphId = (typeof GLYPH_IDS)[number];

const G = 24;
const GS = 2.2;

/** Eight gear teeth around (12,12). */
const gearTeeth: Shape[] = Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4;
  const [c, s] = [Math.cos(a), Math.sin(a)];
  return { l: [12 + 6.5 * c, 12 + 6.5 * s, 12 + 9.5 * c, 12 + 9.5 * s], w: 2.6 };
});

export const GLYPHS: Record<GlyphId, VectorArt> = {
  // Bottom nav
  home: {
    grid: G,
    stroke: GS,
    shapes: [
      { l: [3, 11.5, 12, 3.5, 21, 11.5] },
      { l: [5.5, 9.5, 5.5, 20.5, 18.5, 20.5, 18.5, 9.5] },
      { l: [10, 20.5, 10, 14.5, 14, 14.5, 14, 20.5] },
    ],
  },
  workout: {
    grid: G,
    stroke: GS,
    shapes: [
      { r: [2, 9, 2.5, 6, 0.8] },
      { r: [4.5, 6.5, 3, 11, 1] },
      { r: [16.5, 6.5, 3, 11, 1] },
      { r: [19.5, 9, 2.5, 6, 0.8] },
      { l: [7.5, 12, 16.5, 12], w: 2.4 },
    ],
  },
  upload: {
    grid: G,
    stroke: GS,
    shapes: [
      { l: [12, 15.5, 12, 4] },
      { l: [7, 9, 12, 4, 17, 9] },
      { l: [4, 14, 4, 20, 20, 20, 20, 14] },
    ],
  },
  profile: {
    grid: G,
    stroke: GS,
    shapes: [{ c: [12, 7.5, 4] }, { p: 'M4 21 C4 14.5 20 14.5 20 21 Z' }],
  },

  friends: {
    grid: G,
    stroke: GS,
    shapes: [
      { ring: [9, 8, 3.2] },
      { p: 'M2.5 20 C2.5 14.5 15.5 14.5 15.5 20', w: GS },
      { ring: [16.5, 7, 2.6] },
      { p: 'M15 13.2 C19 12.6 21.5 15 21.5 18.5', w: GS },
    ],
  },
  clipboard: {
    grid: G,
    stroke: GS,
    shapes: [
      { l: [8, 4.5, 5, 4.5, 5, 21, 19, 21, 19, 4.5, 16, 4.5] },
      { r: [8.5, 2.5, 7, 4, 1] },
      { l: [8.5, 11, 15.5, 11] },
      { l: [8.5, 15, 15.5, 15] },
    ],
  },
  sun: {
    grid: G,
    stroke: GS,
    shapes: [
      { c: [12, 12, 4.2] },
      { l: [18.6, 12, 21.4, 12] },
      { l: [16.67, 16.67, 18.65, 18.65] },
      { l: [12, 18.6, 12, 21.4] },
      { l: [7.33, 16.67, 5.35, 18.65] },
      { l: [5.4, 12, 2.6, 12] },
      { l: [7.33, 7.33, 5.35, 5.35] },
      { l: [12, 5.4, 12, 2.6] },
      { l: [16.67, 7.33, 18.65, 5.35] },
    ],
  },
  moon: {
    grid: G,
    stroke: GS,
    shapes: [{ p: 'M15.5 3.5 A8.5 8.5 0 1 0 20.5 15.5 A6.6 6.6 0 0 1 15.5 3.5 Z' }],
  },
  play: {
    grid: G,
    stroke: GS,
    shapes: [{ p: 'M7 4.5 L19.5 12 L7 19.5 Z' }],
  },
  minus: {
    grid: G,
    stroke: GS,
    shapes: [{ l: [5, 12, 19, 12] }],
  },
  folder: {
    grid: G,
    stroke: GS,
    shapes: [
      { l: [3, 19.5, 3, 5, 9.5, 5, 11.5, 7.5, 21, 7.5, 21, 19.5, 3, 19.5] },
      { l: [3, 10.5, 21, 10.5] },
    ],
  },
  calendar: {
    grid: G,
    stroke: GS,
    shapes: [
      { l: [4, 6, 20, 6, 20, 20.5, 4, 20.5, 4, 6] },
      { l: [4, 10, 20, 10] },
      { l: [8, 3.5, 8, 7.5] },
      { l: [16, 3.5, 16, 7.5] },
      { r: [7, 13, 3, 3, 0.5] },
    ],
  },

  add: {
    grid: G,
    stroke: GS,
    shapes: [{ l: [12, 5, 12, 19] }, { l: [5, 12, 19, 12] }],
  },
  delete: {
    grid: G,
    stroke: GS,
    shapes: [
      { l: [4, 6.5, 20, 6.5] },
      { l: [9, 6.5, 9, 3.5, 15, 3.5, 15, 6.5] },
      { l: [6.5, 6.5, 7.5, 20.5, 16.5, 20.5, 17.5, 6.5] },
      { l: [10, 10.5, 10, 16.5], w: 1.6 },
      { l: [14, 10.5, 14, 16.5], w: 1.6 },
    ],
  },
  edit: {
    grid: G,
    stroke: GS,
    shapes: [{ p: 'M4 20 L5 15 L15.5 4.5 L19.5 8.5 L9 19 Z', w: GS }, { l: [13, 7, 17, 11] }],
  },
  history: {
    grid: G,
    stroke: GS,
    shapes: [
      { p: 'M4.5 12 A7.5 7.5 0 1 0 7 6.4', w: GS },
      { head: [7.6, 5.8, -40], size: 3.6 },
      { l: [12, 8, 12, 12, 15, 14] },
    ],
  },
  chart: {
    grid: G,
    stroke: GS,
    shapes: [
      { l: [4, 3, 4, 20, 21, 20] },
      { l: [9, 16.5, 9, 12], w: 2.6 },
      { l: [13.5, 16.5, 13.5, 7], w: 2.6 },
      { l: [18, 16.5, 18, 10], w: 2.6 },
    ],
  },
  settings: {
    grid: G,
    stroke: GS,
    shapes: [{ ring: [12, 12, 6] }, { ring: [12, 12, 2.4] }, ...gearTeeth],
  },
  check: {
    grid: G,
    stroke: 2.4,
    shapes: [{ l: [4, 12.5, 9.5, 18, 20, 6.5] }],
  },
  timer: {
    grid: G,
    stroke: GS,
    shapes: [
      { ring: [12, 13.5, 7.5] },
      { l: [12, 13.5, 12, 9] },
      { l: [9.5, 3, 14.5, 3] },
      { l: [12, 3, 12, 6] },
    ],
  },
  back: {
    grid: G,
    stroke: GS,
    shapes: [{ l: [20, 12, 5, 12] }, { l: [11, 6, 5, 12, 11, 18] }],
  },
};
