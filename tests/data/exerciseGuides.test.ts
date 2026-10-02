import { describe, expect, it } from 'vitest';
import { SEED_EXERCISES } from '../../src/data/exercises';
import { EXERCISE_GUIDES, guideFor } from '../../src/data/exerciseGuides';
import { frameShapes, MUSCLE_NAMES, type Pose } from '../../src/lib/guide/poseArt';

const POINT_KEYS: (keyof Pose)[] = [
  'head',
  'neck',
  'hip',
  'elbow',
  'hand',
  'knee',
  'ankle',
  'toe',
  'elbow2',
  'hand2',
  'knee2',
  'ankle2',
  'toe2',
];

describe('exercise guides', () => {
  it('cover every seed exercise and nothing else', () => {
    expect(Object.keys(EXERCISE_GUIDES).sort()).toEqual(SEED_EXERCISES.map((e) => e.id).sort());
  });

  it.each(SEED_EXERCISES.map((e) => [e.id]))('%s is complete', (id) => {
    const g = EXERCISE_GUIDES[id];
    expect(g.summary.length).toBeGreaterThan(40);
    expect(g.steps.length).toBeGreaterThanOrEqual(3);
    expect(g.primary.length).toBeGreaterThan(0);
    for (const m of [...g.primary, ...g.secondary]) expect(MUSCLE_NAMES[m]).toBeTruthy();
    expect(g.primary.filter((m) => g.secondary.includes(m))).toEqual([]);
    expect(g.frames).toHaveLength(2);
    expect(g.frames[0]).not.toEqual(g.frames[1]);
  });

  it.each(SEED_EXERCISES.map((e) => [e.id]))('%s poses stay on the canvas', (id) => {
    for (const { pose } of EXERCISE_GUIDES[id].frames) {
      for (const k of POINT_KEYS) {
        const p = pose[k] as readonly [number, number] | undefined;
        if (!p) continue;
        expect(p[0], `${k}.x`).toBeGreaterThanOrEqual(0);
        expect(p[0], `${k}.x`).toBeLessThanOrEqual(48);
        expect(p[1], `${k}.y`).toBeGreaterThanOrEqual(-8);
        expect(p[1], `${k}.y`).toBeLessThanOrEqual(45);
      }
    }
  });

  it('every frame has movement arrows and highlighted muscles', () => {
    for (const g of Object.values(EXERCISE_GUIDES)) {
      for (const f of g.frames) {
        const shapes = frameShapes(f, g.primary, g.secondary);
        expect(shapes.some((s) => s.tone === 'tide')).toBe(true);
        expect(shapes.some((s) => s.tone === 'signal' && (s.opacity ?? 1) === 1)).toBe(true);
      }
    }
  });

  it('guideFor handles custom and missing ids', () => {
    expect(guideFor('bench-press')).toBe(EXERCISE_GUIDES['bench-press']);
    expect(guideFor(null)).toBeNull();
    expect(guideFor('my-custom-thing')).toBeNull();
  });
});

describe('frameShapes', () => {
  const pose: Pose = {
    head: [24, 7],
    neck: [24, 12],
    hip: [24, 25],
    elbow: [24, 19],
    hand: [24, 26],
    knee: [24, 34],
    ankle: [24, 43],
  };
  const bandFor = (muscle: Parameters<typeof frameShapes>[1][number], facing?: 1 | -1) =>
    frameShapes({ pose: { ...pose, facing } }, [muscle], []).find((s) => s.tone === 'signal') as {
      l: number[];
    };

  it('puts front muscles in front of a right-facing figure and back muscles behind', () => {
    expect(bandFor('quads').l[0]).toBeGreaterThan(24);
    expect(bandFor('hamstrings').l[0]).toBeLessThan(24);
    expect(bandFor('chest').l[0]).toBeGreaterThan(24);
    expect(bandFor('lats').l[0]).toBeLessThan(24);
  });

  it('mirrors bands when the figure faces left', () => {
    expect(bandFor('quads', -1).l[0]).toBeLessThan(24);
  });

  it('draws secondary muscles faded, below the primary ones', () => {
    const shapes = frameShapes({ pose }, ['quads'], ['glutes']);
    const bands = shapes.filter((s) => s.tone === 'signal');
    expect(bands.map((b) => b.opacity)).toEqual([0.42, 1]);
  });
});
