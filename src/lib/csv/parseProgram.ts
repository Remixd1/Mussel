/**
 * Reads one week of a training program from a coaching spreadsheet exported
 * as CSV (CLAUDE.md §5.2a). Layout: "Day N" labels, a header row with Sets /
 * Reps / a prescribed-RPE column, then exercise rows. Repairs common sheet
 * quirks (missing or repeated day labels) with warnings, and picks up an RPE
 * chart typed into plain cells beside the program.
 */
import { iconForExercise, matchExercise } from '../../data/exercises';
import { isHalfStep } from '../calc/effort';
import { toKg } from '../calc/units';
import type { ChartData, Prescription, ProgramDay, ProgramExercise } from '../types';
import { issueAt, type ImportIssue } from './issues';
import { parseEffortChart, parseNumberCell } from './parseEffortChart';

export interface ProgramParseResult {
  days: ProgramDay[] | null;
  chart: ChartData | null;
  issues: ImportIssue[];
}

const NOTE_MAX = 60;
const SPECIAL_REPS = /^(amrap|dropset|drop set|max|failure|to failure|myo|myoreps|rest-?pause)$/i;

const clean = (s: string | undefined) => (s ?? '').trim();

// ---------------------------------------------------------------------------
// Cell readers (exported for tests)
// ---------------------------------------------------------------------------

export function parseReps(raw: string): { min: number; max: number } | null {
  const m = raw.trim().match(/^(\d+)\s*(?:[-–]\s*(\d+))?$/);
  if (!m) return null;
  const a = Number(m[1]);
  const b = m[2] ? Number(m[2]) : a;
  if (a < 1 || b < 1) return null;
  return { min: Math.min(a, b), max: Math.max(a, b) };
}

export function parsePrescription(raw: string): Prescription {
  const s = raw.trim().replace(/(\d),(\d)/g, '$1.$2');
  if (s === '') return { kind: 'text' };

  const drop = s.match(/^[-–]\s*(\d+(?:\.\d+)?)\s*%$/);
  if (drop) return { kind: 'percentDrop', percent: Number(drop[1]) };

  const load = s.match(/^(\d+(?:\.\d+)?)\s*(kg|kgs|lb|lbs)$/i);
  if (load) {
    const unit = load[2].toLowerCase().startsWith('kg') ? 'kg' : 'lb';
    return { kind: 'weight', weightKg: toKg(Number(load[1]), unit) };
  }

  const rpe = s.match(/^(?:rpe\s*|@\s*)?(\d+(?:\.\d+)?)\s*(?:[-–]\s*(\d+(?:\.\d+)?))?$/i);
  if (rpe) {
    const a = Number(rpe[1]);
    const b = rpe[2] ? Number(rpe[2]) : a;
    const valid = [a, b].every((n) => n >= 1 && n <= 10 && isHalfStep(n));
    if (valid) return { kind: 'rpe', min: Math.min(a, b), max: Math.max(a, b) };
  }
  return { kind: 'text' };
}

// ---------------------------------------------------------------------------

interface HeaderCols {
  row: number;
  sets: number;
  reps: number;
  prescription: number;
  /** First column after the header's last labelled cell: coach notes. */
  notes: number;
}

function readHeader(rows: string[][], r: number): HeaderCols | null {
  const row = rows[r].map(clean);
  const sets = row.findIndex((v) => /^sets?$/i.test(v));
  const reps = row.findIndex((v) => /^reps?$/i.test(v));
  if (sets < 0 || reps < 0) return null;
  let prescription = row.findIndex((v) => /prescri/i.test(v));
  if (prescription < 0) {
    prescription = row.findIndex(
      (v, i) => i > reps && /\brpe\b|rir|weight|load|intensity|%/i.test(v) && !/used|1rm/i.test(v),
    );
  }
  // A labelled Notes column wins; otherwise notes sit just right of the header.
  const labelledNotes = row.findIndex((v, i) => i > reps && /^notes?$/i.test(v));
  const last = row.reduce((acc, v, i) => (v ? i : acc), -1);
  return { row: r, sets, reps, prescription, notes: labelledNotes >= 0 ? labelledNotes : last + 1 };
}

const DAY_LABEL = /^day\s*(\d+)\b/i;

export function parseProgramSheet(rows: string[][]): ProgramParseResult {
  const issues: ImportIssue[] = [];
  const headers = rows.map((_, r) => readHeader(rows, r)).filter((h): h is HeaderCols => !!h);
  if (!headers.length) {
    return {
      days: null,
      chart: null,
      issues: [issueAt('error', "Couldn't find a header row with Sets and Reps columns.")],
    };
  }

  // Day labels live left of the Sets column.
  const labelLimit = headers[0].sets;
  const dayLabelAt = (r: number) => {
    const row = rows[r].map(clean);
    for (let c = 0; c < labelLimit; c++) {
      const m = row[c]?.match(DAY_LABEL);
      if (m) {
        const rest = row.some(
          (v, i) => i <= headers[0].prescription + 1 && /^rest(\s+day)?$/i.test(v),
        );
        return { n: Number(m[1]), rest, col: c };
      }
    }
    return null;
  };

  type Event =
    | { type: 'day'; row: number; n: number; rest: boolean; col: number }
    | { type: 'header'; row: number; cols: HeaderCols };
  const events: Event[] = [];
  const headerByRow = new Map(headers.map((h) => [h.row, h]));
  rows.forEach((_, r) => {
    const h = headerByRow.get(r);
    if (h) events.push({ type: 'header', row: r, cols: h });
    else {
      const d = dayLabelAt(r);
      if (d) events.push({ type: 'day', row: r, ...d });
    }
  });

  const days: ProgramDay[] = [];
  let lastNumber = 0;
  const numberDay = (written: number | null, row: number, col?: number) => {
    let n = written;
    if (n === null) {
      n = lastNumber + 1;
      issues.push(issueAt('warning', `Workout with no day label; called it Day ${n}.`, row));
    } else if (n <= lastNumber) {
      const renamed = lastNumber + 1;
      issues.push(
        issueAt('warning', `"Day ${n}" appears again; renamed it Day ${renamed}.`, row, col),
      );
      n = renamed;
    }
    lastNumber = n;
    return `Day ${n}`;
  };

  let pending: Extract<Event, { type: 'day' }> | null = null;
  const flushRest = () => {
    if (pending)
      days.push({
        label: numberDay(pending.n, pending.row, pending.col),
        rest: true,
        exercises: [],
      });
    pending = null;
  };

  for (const ev of events) {
    if (ev.type === 'day') {
      // A label with no workout before the next label is a rest day.
      if (pending) flushRest();
      pending = ev;
      if (ev.rest) flushRest();
      continue;
    }
    const label = pending
      ? numberDay(pending.n, pending.row, pending.col)
      : numberDay(null, ev.row);
    pending = null;
    days.push({ label, rest: false, exercises: readExercises(rows, ev.cols, issues, dayLabelAt) });
  }
  if (pending) flushRest();

  const workouts = days.filter((d) => !d.rest);
  if (!workouts.some((d) => d.exercises.length)) {
    issues.push(issueAt('error', 'No exercises found under the Sets/Reps headers.'));
    return { days: null, chart: null, issues };
  }
  workouts
    .filter((d) => !d.exercises.length)
    .forEach((d) => issues.push(issueAt('warning', `${d.label} has a header but no exercises.`)));

  const chart = findEmbeddedChart(rows, headers, issues);
  return { days, chart, issues };
}

function readExercises(
  rows: string[][],
  cols: HeaderCols,
  issues: ImportIssue[],
  dayLabelAt: (r: number) => unknown,
): ProgramExercise[] {
  const out: ProgramExercise[] = [];
  for (let r = cols.row + 1; r < rows.length; r++) {
    const row = rows[r].map(clean);
    const used = row.slice(0, cols.notes);
    if (used.every((v) => v === '') || readHeader(rows, r) || dayLabelAt(r)) break;

    const name = row.slice(0, cols.sets).find((v) => v !== '') ?? '';
    const setsRaw = row[cols.sets] ?? '';
    if (!name) continue;
    const sets = Number(setsRaw);
    if (!Number.isInteger(sets) || sets < 1) {
      issues.push(
        issueAt(
          'warning',
          `Couldn't read sets "${setsRaw}" for ${name}; skipped it.`,
          r,
          cols.sets,
        ),
      );
      continue;
    }

    const repsText = row[cols.reps] ?? '';
    const reps = parseReps(repsText);
    if (!reps && !SPECIAL_REPS.test(repsText)) {
      issues.push(
        issueAt(
          'warning',
          `Couldn't read reps "${repsText}" for ${name}; kept it as text.`,
          r,
          cols.reps,
        ),
      );
    }

    const prescriptionText = cols.prescription >= 0 ? (row[cols.prescription] ?? '') : '';
    const prescription = parsePrescription(prescriptionText);
    if (prescription.kind === 'text' && prescriptionText) {
      issues.push(
        issueAt(
          'warning',
          `Couldn't read "${prescriptionText}" for ${name}; kept it as text.`,
          r,
          cols.prescription,
        ),
      );
    }

    const noteRaw = row[cols.notes] ?? '';
    const note = noteRaw && !/notes/i.test(noteRaw) && noteRaw.length <= NOTE_MAX ? noteRaw : null;

    out.push({
      name,
      exerciseId: matchExercise(name),
      iconId: iconForExercise(name),
      sets,
      reps,
      repsText,
      prescription,
      prescriptionText,
      note,
    });
  }
  return out;
}

/** Look for a numeric reps x RPE grid near an "RPE ... CHART" label. */
function findEmbeddedChart(
  rows: string[][],
  headers: HeaderCols[],
  issues: ImportIssue[],
): ChartData | null {
  const programRight = Math.max(...headers.map((h) => h.notes));
  for (let r = 0; r < rows.length; r++) {
    const c = rows[r].findIndex((v) => /chart/i.test(v) && /rpe|rir/i.test(v));
    if (c < 0) continue;

    const startCol = Math.max(c - 1, programRight + 1);
    const region = rows.slice(r + 1, r + 41).map((row) => row.slice(startCol, startCol + 24));
    const numbers = region.flat().filter((v) => parseNumberCell(v) !== null).length;
    if (numbers < 4) {
      issues.push(
        issueAt(
          'warning',
          'This sheet has an RPE chart heading but no chart numbers in its cells; it is probably an image. Type it into cells or upload the chart separately. Using the built-in chart until then.',
          r,
          c,
        ),
      );
      return null;
    }
    // Keep only rows that are mostly numbers (skips notes under the heading).
    const result = parseEffortChart(
      region.map((row) => {
        const filled = row.filter((v) => v.trim() !== '');
        const numeric = filled.filter((v) => parseNumberCell(v) !== null);
        return numeric.length >= filled.length - 1 ? row : row.map(() => '');
      }),
      { row: r + 1, col: startCol },
    );
    if (result.chart) {
      issues.push(...result.issues);
      return result.chart;
    }
    const why = result.issues.find((i) => i.level === 'error')?.message ?? 'unreadable grid';
    issues.push(
      issueAt(
        'warning',
        `Found an RPE chart but couldn't read it (${why}). Using the built-in chart.`,
        r,
        c,
      ),
    );
    return null;
  }
  return null;
}

/** What kind of upload a CSV is. */
export function detectCsvKind(rows: string[][]): 'program' | 'chart' | 'unknown' {
  if (rows.some((_, r) => readHeader(rows, r))) return 'program';
  if (parseEffortChart(rows).chart) return 'chart';
  return 'unknown';
}
