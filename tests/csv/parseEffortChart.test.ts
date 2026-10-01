import { describe, expect, it } from 'vitest';
import { parseCsv } from '../../src/lib/csv/parseCsv';
import { parseEffortChart } from '../../src/lib/csv/parseEffortChart';
import { detectCsvKind } from '../../src/lib/csv/parseProgram';

const rowsOf = (text: string) => parseCsv(text).rows;

describe('parseEffortChart', () => {
  it('reads reps rows x RPE columns, as fractions, RPE descending', () => {
    const { chart, issues } = parseEffortChart(
      rowsOf('Reps,10,9.5,9\n1,100,97.8,95.5\n2,95.5,93.9,92.2'),
    );
    expect(issues).toEqual([]);
    expect(chart).toEqual({
      sourceScale: 'rpe',
      rpeValues: [10, 9.5, 9],
      rows: [
        { reps: 1, percents: [1, 0.978, 0.955] },
        { reps: 2, percents: [0.955, 0.939, 0.922] },
      ],
    });
  });

  it('accepts 87%, 0.87, and decimal commas', () => {
    expect(parseEffortChart(rowsOf('Reps,10,9\n1,100%,95%')).chart!.rows[0].percents).toEqual([
      1, 0.95,
    ]);
    expect(parseEffortChart(rowsOf('Reps,10,9\n1,1,0.95')).chart!.rows[0].percents).toEqual([
      1, 0.95,
    ]);
    expect(parseEffortChart(rowsOf('Reps;10;9\n1;100;95,5')).chart!.rows[0].percents).toEqual([
      1, 0.955,
    ]);
  });

  it('converts RIR columns to RPE', () => {
    const { chart } = parseEffortChart(rowsOf('Reps/RIR,0,1,2\n1,100,95.5,92.2'));
    expect(chart!.sourceScale).toBe('rir');
    expect(chart!.rpeValues).toEqual([10, 9, 8]);
  });

  it('transposes charts with effort rows', () => {
    const { chart } = parseEffortChart(rowsOf('RPE,1,2\n10,100,95.5\n9,95.5,92.2'));
    expect(chart!.rpeValues).toEqual([10, 9]);
    expect(chart!.rows).toEqual([
      { reps: 1, percents: [1, 0.955] },
      { reps: 2, percents: [0.955, 0.922] },
    ]);
  });

  it('sorts unordered headers', () => {
    const { chart } = parseEffortChart(rowsOf('Reps,8,10\n2,89.2,95.5\n1,92.2,100'));
    expect(chart!.rpeValues).toEqual([10, 8]);
    expect(chart!.rows.map((r) => r.reps)).toEqual([1, 2]);
    expect(chart!.rows[0].percents).toEqual([1, 0.922]);
  });

  it('keeps blank cells as null', () => {
    const { chart } = parseEffortChart(rowsOf('Reps,10,9\n1,100,\n2,95.5,92.2'));
    expect(chart!.rows[0].percents).toEqual([1, null]);
  });

  it('warns, without failing, when % rises with reps', () => {
    const { chart, issues } = parseEffortChart(rowsOf('Reps,10\n1,90\n2,95'));
    expect(chart).not.toBeNull();
    expect(issues[0].level).toBe('warning');
  });

  it.each([
    ['mixed styles', 'Reps,10,9\n1,100,0.95', /Mix of fractions/],
    ['over 100%', 'Reps,10\n1,104', /outside 0 to 100/],
    ['bad RPE', 'Reps,10,8.3\n1,100,90', /RPE values/],
    ['fractional reps', 'Reps,10\n1.5,100', /whole numbers/],
    ['duplicate reps', 'Reps,10\n1,100\n1,99', /appears twice/],
    ['text cell', 'Reps,10\n1,heavy', /isn't a percentage/],
    ['no grid', 'just one cell', /No chart grid/],
  ])('rejects %s', (_, text, message) => {
    const { chart, issues } = parseEffortChart(rowsOf(text));
    expect(chart).toBeNull();
    expect(issues.find((i) => i.level === 'error')?.message).toMatch(message);
  });

  it('points errors at a spreadsheet location', () => {
    const { issues } = parseEffortChart(rowsOf('Reps,10,9\n1,100,104'));
    expect(issues[0]).toMatchObject({ row: 2, col: 'C' });
  });
});

describe('detectCsvKind', () => {
  it('tells charts from programs and junk', () => {
    expect(detectCsvKind(rowsOf('Reps,10,9\n1,100,95.5'))).toBe('chart');
    expect(detectCsvKind(rowsOf('Day 1\n,Sets,Reps,RPE\nSquat,3,5,8'))).toBe('program');
    expect(detectCsvKind(rowsOf('hello,world'))).toBe('unknown');
  });
});
