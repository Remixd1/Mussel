import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseCsv } from '../../src/lib/csv/parseCsv';
import {
  detectCsvKind,
  parsePrescription,
  parseProgramSheet,
  parseReps,
} from '../../src/lib/csv/parseProgram';

const fixture = readFileSync(
  resolve(process.cwd(), 'tests/fixtures/five-day-split-week1.csv'),
  'utf8',
);

describe("reference program (owner's 5-day split, week 1)", () => {
  const { rows } = parseCsv(fixture);
  const result = parseProgramSheet(rows);
  const days = result.days!;
  const day = (label: string) => days.find((d) => d.label === label)!;

  it('is detected as a program', () => {
    expect(detectCsvKind(rows)).toBe('program');
  });

  it('imports 7 days: 5 workouts and 2 rest days, in order', () => {
    expect(days.map((d) => `${d.label}${d.rest ? ' rest' : ''}`)).toEqual([
      'Day 1',
      'Day 2',
      'Day 3 rest',
      'Day 4',
      'Day 5',
      'Day 6',
      'Day 7 rest',
    ]);
  });

  it('has no errors, and flags the repaired day labels', () => {
    expect(result.issues.filter((i) => i.level === 'error')).toEqual([]);
    const messages = result.issues.map((i) => i.message);
    expect(messages).toContain('Workout with no day label; called it Day 2.');
    expect(messages).toContain('"Day 3" appears again; renamed it Day 7.');
  });

  it('reads Day 1 exactly', () => {
    const d = day('Day 1');
    expect(d.exercises.map((e) => [e.name, e.sets, e.repsText, e.prescriptionText])).toEqual([
      ['Comp Bench', 3, '3', '5-6'],
      ['Comp Bench', 1, '1', '5'],
      ['machine row', 2, '6-8', '10'],
      ['db shoulder press', 2, '8-10', '7-8'],
      ['Lateral Raises', 2, '8-10', '10'],
      ['Lat Pulldown/Weighted Pullups', 2, '6-8', '9'],
      ['Curl Variation', 2, '6-10', '9-10'],
      ['Chest Fly', 2, '8-10', '9-10'],
      ['Single arm tricep extension', 3, '6-10', '8-9'],
    ]);
    expect(d.exercises[0].reps).toEqual({ min: 3, max: 3 });
    expect(d.exercises[0].prescription).toEqual({ kind: 'rpe', min: 5, max: 6 });
    expect(d.exercises[2].reps).toEqual({ min: 6, max: 8 });
  });

  it('counts exercises per day', () => {
    expect(days.map((d) => d.exercises.length)).toEqual([9, 8, 0, 8, 9, 8, 0]);
  });

  it('reads the -15% back-off as a percent drop', () => {
    const pause = day('Day 2').exercises.find((e) => e.name === 'pause squat')!;
    expect(pause.prescription).toEqual({ kind: 'percentDrop', percent: 15 });
  });

  it('keeps DROPSET as text reps without a warning', () => {
    const drop = day('Day 5').exercises.at(-1)!;
    expect(drop.name).toBe('cable curl');
    expect(drop.reps).toBeNull();
    expect(drop.repsText).toBe('DROPSET');
    expect(result.issues.some((i) => i.message.includes('DROPSET'))).toBe(false);
  });

  it('attaches the coach note beside an exercise, not the column headings', () => {
    const squat = day('Day 6').exercises[0];
    expect(squat.name).toBe('comp squat');
    expect(squat.note).toBe('7.5kg');
    const allNotes = days.flatMap((d) => d.exercises.map((e) => e.note)).filter(Boolean);
    expect(allNotes).toEqual(['7.5kg']);
  });

  it('matches main lifts to seed exercises and gives every exercise an icon', () => {
    const d1 = day('Day 1').exercises;
    expect(d1[0].exerciseId).toBe('bench-press');
    expect(d1[0].iconId).toBe('bench');
    expect(d1[5].exerciseId).toBe('lat-pulldown');
    const d2 = day('Day 2').exercises;
    expect(d2.find((e) => e.name === 'comp squat')!.exerciseId).toBe('back-squat');
    expect(d2.find((e) => e.name === 'Comp deadlift')!.exerciseId).toBe('deadlift');
    expect(d2.find((e) => e.name === 'bulg split squat')!.exerciseId).toBeNull();
    expect(d2.find((e) => e.name === 'bulg split squat')!.iconId).toBe('lunge');
    expect(day('Day 6').exercises.find((e) => e.name === 'rdl')!.exerciseId).toBe('rdl');
    for (const e of days.flatMap((d) => d.exercises)) expect(e.iconId).toBeTruthy();
  });

  it('warns that the RPE chart heading has no numbers (an image in the sheet)', () => {
    expect(result.chart).toBeNull();
    const warning = result.issues.find((i) => i.message.includes('RPE chart heading'));
    expect(warning).toMatchObject({ level: 'warning', row: 7, col: 'P' });
  });
});

describe('embedded chart', () => {
  it('imports a chart typed into cells beside the program', () => {
    const rows = parseCsv(
      [
        'Day 1,,,,,,RPE CHART',
        ',Sets,Reps,RPE,,,',
        'Squat,3,5,8,,,Reps,10,9,8',
        ',,,,,,1,100,95.5,92.2',
        ',,,,,,2,95.5,92.2,89.2',
      ].join('\n'),
    ).rows;
    const result = parseProgramSheet(rows);
    expect(result.chart?.rpeValues).toEqual([10, 9, 8]);
    expect(result.chart?.rows[1]).toEqual({ reps: 2, percents: [0.955, 0.922, 0.892] });
  });
});

describe('errors', () => {
  it('rejects a sheet without a Sets/Reps header', () => {
    const result = parseProgramSheet(parseCsv('a,b\nc,d').rows);
    expect(result.days).toBeNull();
    expect(result.issues[0]).toMatchObject({ level: 'error' });
  });

  it('rejects a header with no exercises', () => {
    const result = parseProgramSheet(parseCsv('Day 1\n,Sets,Reps,RPE\n').rows);
    expect(result.days).toBeNull();
    expect(result.issues.some((i) => i.level === 'error')).toBe(true);
  });

  it('skips rows whose sets are not a number, with a warning', () => {
    const result = parseProgramSheet(
      parseCsv('Day 1\n,Sets,Reps,RPE\nSquat,three,5,8\nBench,3,5,8').rows,
    );
    expect(result.days![0].exercises.map((e) => e.name)).toEqual(['Bench']);
    expect(result.issues[0]).toMatchObject({ level: 'warning', row: 3, col: 'B' });
  });
});

describe('parseReps', () => {
  it.each([
    ['3', { min: 3, max: 3 }],
    ['6-8', { min: 6, max: 8 }],
    ['8 – 12', { min: 8, max: 12 }],
    ['12-8', { min: 8, max: 12 }],
  ])('%j', (raw, expected) => expect(parseReps(raw)).toEqual(expected));

  it.each(['', 'DROPSET', 'AMRAP', '0', 'x'])('%j is not a number of reps', (raw) => {
    expect(parseReps(raw)).toBeNull();
  });
});

describe('parsePrescription', () => {
  it.each([
    ['8', { kind: 'rpe', min: 8, max: 8 }],
    ['5-6', { kind: 'rpe', min: 5, max: 6 }],
    ['9-10', { kind: 'rpe', min: 9, max: 10 }],
    ['7.5', { kind: 'rpe', min: 7.5, max: 7.5 }],
    ['7,5', { kind: 'rpe', min: 7.5, max: 7.5 }],
    ['@8', { kind: 'rpe', min: 8, max: 8 }],
    ['RPE 8', { kind: 'rpe', min: 8, max: 8 }],
    ['-15%', { kind: 'percentDrop', percent: 15 }],
    ['- 10 %', { kind: 'percentDrop', percent: 10 }],
    ['100kg', { kind: 'weight', weightKg: 100 }],
  ])('%j', (raw, expected) => expect(parsePrescription(raw)).toEqual(expected));

  it('converts pounds to kg', () => {
    const p = parsePrescription('225 lb');
    expect(p.kind).toBe('weight');
    expect(p.kind === 'weight' && p.weightKg).toBeCloseTo(102.058, 3);
  });

  it.each(['', '11', '8.3', 'heavy', '0'])('%j stays text', (raw) => {
    expect(parsePrescription(raw)).toEqual({ kind: 'text' });
  });
});
