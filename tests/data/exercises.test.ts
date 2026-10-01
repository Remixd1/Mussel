import { describe, expect, it } from 'vitest';
import { PICTOGRAM_IDS } from '../../src/components/icons/art';
import { iconForExercise, matchExercise, SEED_EXERCISES } from '../../src/data/exercises';

describe('matchExercise', () => {
  it.each([
    ['Comp Bench', 'bench-press'],
    ['paused bench press', 'bench-press'],
    ['Incline Bench', 'incline-bench'],
    ['comp squat', 'back-squat'],
    ['pause squat', 'back-squat'],
    ['Front Squat', 'front-squat'],
    ['Comp deadlift', 'deadlift'],
    ['rdl', 'rdl'],
    ['Lat Pulldown/Weighted Pullups', 'lat-pulldown'],
    ['weighted pullups', 'pullup'],
    ['Leg press', 'leg-press'],
    ['OHP', 'ohp'],
  ])('%s -> %s', (name, id) => expect(matchExercise(name)).toBe(id));

  it.each([
    'bulg split squat',
    'Single leg hamstring curl',
    'db shoulder press',
    'Chest Fly',
    'paused incline db press',
  ])('%s has no confident match', (name) => expect(matchExercise(name)).toBeNull());
});

describe('iconForExercise', () => {
  it.each([
    ['machine row', 'row'],
    ['elbow flared row', 'row'],
    ['cable curl', 'curl'],
    ['Single leg hamstring curl', 'machine'],
    ['Leg Extension', 'machine'],
    ['Single arm tricep extension', 'machine'],
    ['Lateral Raises', 'ohp'],
    ['db shoulder press', 'ohp'],
    ['Chest Fly', 'bench'],
    ['lat pullover', 'pullup'],
    ['bulg split squat', 'lunge'],
    ['something unheard of', 'machine'],
  ])('%s -> %s', (name, icon) => expect(iconForExercise(name)).toBe(icon));

  it('only ever returns real pictograms', () => {
    for (const e of SEED_EXERCISES) expect(PICTOGRAM_IDS).toContain(e.icon);
  });
});
