import { describe, expect, it } from 'vitest';
import { columnName, detectDelimiter, parseCsv } from '../../src/lib/csv/parseCsv';

describe('parseCsv', () => {
  it('splits rows and fields', () => {
    expect(parseCsv('a,b,c\n1,2,3').rows).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
  });

  it('handles CRLF, a trailing newline, and empty fields', () => {
    expect(parseCsv('a,,c\r\n,,\r\n').rows).toEqual([
      ['a', '', 'c'],
      ['', '', ''],
    ]);
  });

  it('handles quoted fields with commas, escaped quotes, and line breaks', () => {
    const { rows } = parseCsv('"YOUR NOTES (pain, pros/cons)","say ""hi""","two\nlines"');
    expect(rows).toEqual([['YOUR NOTES (pain, pros/cons)', 'say "hi"', 'two\nlines']]);
  });

  it('strips a UTF-8 BOM', () => {
    expect(parseCsv('﻿Reps,10').rows[0][0]).toBe('Reps');
  });

  it('auto-detects semicolon (European Excel) and tab delimiters', () => {
    expect(parseCsv('Reps;10;9\n1;100;95,5').delimiter).toBe(';');
    expect(parseCsv('Reps;10;9\n1;100;95,5').rows[1]).toEqual(['1', '100', '95,5']);
    expect(parseCsv('Reps\t10\t9\n1\t100\t95').delimiter).toBe('\t');
  });

  it('ignores delimiters inside quotes when detecting', () => {
    expect(detectDelimiter('"a;b;c;d",x,y\n1,2,3')).toBe(',');
  });
});

describe('columnName', () => {
  it.each([
    [0, 'A'],
    [15, 'P'],
    [25, 'Z'],
    [26, 'AA'],
    [27, 'AB'],
  ])('%i -> %s', (i, name) => expect(columnName(i)).toBe(name));
});
