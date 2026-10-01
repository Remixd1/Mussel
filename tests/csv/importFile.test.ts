import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  chartTemplate,
  importCsvText,
  nameFromFile,
  PROGRAM_TEMPLATE,
  weekFromFile,
} from '../../src/lib/csv/importFile';
import { defaultChart } from '../../src/lib/calc/effort';

describe('names from file names', () => {
  it.each([
    ['Strength Block - 5 Day Split(Week 1).csv', 'Strength Block - 5 Day Split'],
    ['Strength Block (Week 2).csv', 'Strength Block'],
    ['Hypertrophy week 3.csv', 'Hypertrophy'],
    ['my-chart.csv', 'my-chart'],
    ['Week 1.csv', 'Week 1'],
  ])('%s -> %s', (file, name) => expect(nameFromFile(file)).toBe(name));

  it('reads the week number', () => {
    expect(weekFromFile('Block(Week 1).csv')).toBe('Week 1');
    expect(weekFromFile('Block week 12.csv')).toBe('Week 12');
    expect(weekFromFile('Block.csv')).toBeNull();
  });
});

describe('importCsvText', () => {
  it('imports the reference program, ready to save', () => {
    const text = readFileSync(
      resolve(process.cwd(), 'tests/fixtures/five-day-split-week1.csv'),
      'utf8',
    );
    const imp = importCsvText(text, 'Five Day Split(Week 1).csv');
    expect(imp.kind).toBe('program');
    expect(imp.canSave).toBe(true);
    expect(imp.days).toHaveLength(7);
    expect(imp.suggestedName).toBe('Five Day Split');
    expect(imp.weekFromName).toBe('Week 1');
  });

  it('round-trips the program template', () => {
    const imp = importCsvText(PROGRAM_TEMPLATE, 'template.csv');
    expect(imp.canSave).toBe(true);
    expect(imp.issues).toEqual([]);
    expect(imp.days!.map((d) => [d.label, d.rest, d.exercises.length])).toEqual([
      ['Day 1', false, 3],
      ['Day 2', false, 3],
      ['Day 3', true, 0],
    ]);
    expect(imp.days![1].exercises[1].note).toBe('back-off');
  });

  it('round-trips the chart template to the built-in chart', () => {
    const imp = importCsvText(chartTemplate(), 'chart.csv');
    expect(imp.kind).toBe('chart');
    expect(imp.canSave).toBe(true);
    const original = defaultChart();
    expect(imp.chart!.rpeValues).toEqual(original.rpeValues);
    imp.chart!.rows.forEach((row, i) => {
      row.percents.forEach((p, j) => expect(p).toBeCloseTo(original.rows[i].percents[j]!, 3));
    });
  });

  it('refuses files that are neither', () => {
    const imp = importCsvText('hello,world\nfoo,bar', 'notes.csv');
    expect(imp.kind).toBe('unknown');
    expect(imp.canSave).toBe(false);
  });
});
