/**
 * Reads an RPE/RIR -> %1RM grid (CLAUDE.md §5.2b) from CSV rows: a label cell,
 * column headers, then a row header and percentages per row. Rows may be reps
 * (label "Reps", "Reps\RPE"...) or effort (label "RPE"/"RIR": transposed).
 */
import { isHalfStep, rirToRpe } from '../calc/effort';
import type { ChartData, EffortScale } from '../types';
import { issueAt, type ImportIssue } from './issues';

const MAX_REPS_ROWS = 30;
const MAX_EFFORT_COLS = 21;

export interface ChartParseResult {
  chart: ChartData | null;
  issues: ImportIssue[];
}

/** Number from a cell, accepting "87%", "0,87", and stray spaces. */
export function parseNumberCell(raw: string): number | null {
  const s = raw.trim().replace(/%$/, '').trim().replace(',', '.');
  if (s === '' || !/^-?\d+(\.\d+)?$|^-?\.\d+$/.test(s)) return null;
  return Number(s);
}

interface Cell {
  r: number;
  c: number;
  v: string;
}

/** Drop empty rows/columns, remembering original positions for messages. */
function compact(rows: string[][], rowOffset = 0, colOffset = 0): Cell[][] {
  const width = Math.max(0, ...rows.map((r) => r.length));
  const usedCols = Array.from({ length: width }, (_, c) =>
    rows.some((r) => (r[c] ?? '').trim() !== ''),
  );
  return rows
    .map((r, ri) =>
      usedCols
        .map((used, c) =>
          used ? { r: ri + rowOffset, c: c + colOffset, v: (r[c] ?? '').trim() } : null,
        )
        .filter((x): x is Cell => x !== null),
    )
    .filter((cells) => cells.some((cell) => cell.v !== ''));
}

export function parseEffortChart(
  rows: string[][],
  offset: { row: number; col: number } = { row: 0, col: 0 },
): ChartParseResult {
  const issues: ImportIssue[] = [];
  const grid = compact(rows, offset.row, offset.col);
  const fail = (message: string, r?: number, c?: number): ChartParseResult => ({
    chart: null,
    issues: [...issues, issueAt('error', message, r, c)],
  });

  if (grid.length < 2 || grid[0].length < 2) {
    return fail(
      'No chart grid found: expected a header row of effort values and rows of percentages.',
    );
  }

  const [head, ...body] = grid;
  const label = head[0].v.toLowerCase();
  const scale: EffortScale = label.includes('rir') ? 'rir' : 'rpe';
  // Rows are effort (transposed) when the label starts with RPE/RIR.
  const transposed = /^(rpe|rir)/.test(label);

  const colHeaders = head.slice(1).map((cell) => ({ ...cell, n: parseNumberCell(cell.v) }));
  const rowHeaders = body.map((row) => ({ ...row[0], n: parseNumberCell(row[0].v) }));
  for (const h of [...colHeaders, ...rowHeaders]) {
    if (h.n === null) return fail(`"${h.v}" isn't a number.`, h.r, h.c);
  }

  // Raw value grid aligned to [row][col].
  const values = body.map((row) =>
    colHeaders.map((h) => {
      const cell = row.find((x) => x.c === h.c);
      return { r: row[0].r, c: h.c, raw: cell?.v ?? '', n: cell ? parseNumberCell(cell.v) : null };
    }),
  );
  for (const row of values) {
    for (const v of row) {
      if (v.raw !== '' && v.n === null) return fail(`"${v.raw}" isn't a percentage.`, v.r, v.c);
    }
  }

  const effortHeaders = transposed ? rowHeaders : colHeaders;
  const repHeaders = transposed ? colHeaders : rowHeaders;

  for (const h of repHeaders) {
    if (!Number.isInteger(h.n) || h.n! < 1) {
      return fail(`Rep counts must be whole numbers of 1 or more ("${h.v}").`, h.r, h.c);
    }
  }
  for (const h of effortHeaders) {
    const ok = scale === 'rir' ? h.n! >= 0 && h.n! <= 9 : h.n! >= 1 && h.n! <= 10;
    if (!ok || !isHalfStep(h.n!)) {
      return fail(
        scale === 'rir'
          ? `RIR values must be 0 to 9 in steps of 0.5 ("${h.v}").`
          : `RPE values must be 1 to 10 in steps of 0.5 ("${h.v}").`,
        h.r,
        h.c,
      );
    }
  }
  const dupe = (hs: typeof repHeaders) => hs.find((h, i) => hs.findIndex((o) => o.n === h.n) !== i);
  const dupeRep = dupe(repHeaders);
  if (dupeRep) return fail(`${dupeRep.v} reps appears twice.`, dupeRep.r, dupeRep.c);
  const dupeEffort = dupe(effortHeaders);
  if (dupeEffort) return fail(`Effort ${dupeEffort.v} appears twice.`, dupeEffort.r, dupeEffort.c);

  if (repHeaders.length > MAX_REPS_ROWS) return fail(`At most ${MAX_REPS_ROWS} rep rows.`);
  if (effortHeaders.length > MAX_EFFORT_COLS)
    return fail(`At most ${MAX_EFFORT_COLS} effort columns.`);

  // Percent style: all fractions (<= 1) or all percents.
  const all = values.flat().filter((v) => v.n !== null);
  if (!all.length) return fail('The chart has no percentages.');
  const fractions = all.every((v) => v.n! <= 1);
  if (!fractions && all.some((v) => v.n! <= 1)) {
    const odd = all.find((v) => v.n! <= 1)!;
    return fail('Mix of fractions (0.87) and percents (87). Use one style.', odd.r, odd.c);
  }
  for (const v of all) {
    const pct = fractions ? v.n! * 100 : v.n!;
    if (!(pct > 0 && pct <= 100)) return fail(`${v.raw} is outside 0 to 100%.`, v.r, v.c);
  }

  // Normalize to reps rows x effort columns, as fractions.
  // Rounded to 6 places so 97.8% stores as 0.978, not 0.9780000000000001.
  const toFrac = (n: number | null) =>
    n === null ? null : Math.round((fractions ? n : n / 100) * 1e6) / 1e6;
  const repsList = repHeaders.map((h) => h.n!);
  const effortList = effortHeaders.map((h) => (scale === 'rir' ? rirToRpe(h.n!) : h.n!));
  const at = (ri: number, ei: number) =>
    transposed ? toFrac(values[ei][ri].n) : toFrac(values[ri][ei].n);

  // Columns sorted by RPE descending, rows by reps ascending.
  const effortOrder = effortList.map((rpe, i) => ({ rpe, i })).sort((a, b) => b.rpe - a.rpe);
  const repOrder = repsList.map((reps, i) => ({ reps, i })).sort((a, b) => a.reps - b.reps);
  const chart: ChartData = {
    sourceScale: scale,
    rpeValues: effortOrder.map((e) => e.rpe),
    rows: repOrder.map(({ reps, i }) => ({
      reps,
      percents: effortOrder.map((e) => at(i, e.i)),
    })),
  };

  // Soft checks: % should fall as reps rise, and as RPE falls.
  let warnedReps = false;
  let warnedRpe = false;
  chart.rows.forEach((row, ri) => {
    row.percents.forEach((p, ci) => {
      const below = chart.rows[ri + 1]?.percents[ci];
      if (!warnedReps && p != null && below != null && below > p) {
        warnedReps = true;
        issues.push(
          issueAt(
            'warning',
            `%1RM goes up from ${row.reps} to ${chart.rows[ri + 1].reps} reps somewhere in the chart.`,
          ),
        );
      }
      const right = row.percents[ci + 1];
      if (!warnedRpe && p != null && right != null && right > p) {
        warnedRpe = true;
        issues.push(issueAt('warning', `%1RM goes up as RPE falls at ${row.reps} reps.`));
      }
    });
  });

  return { chart, issues };
}
