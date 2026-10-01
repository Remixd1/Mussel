/**
 * Turns a picked CSV file into something the Upload tab can preview and save:
 * a program week, a chart, or both, plus issues and suggested names.
 */
import { defaultChart } from '../calc/effort';
import type { ChartData, ProgramDay } from '../types';
import { hasErrors, issueAt, type ImportIssue } from './issues';
import { parseCsv } from './parseCsv';
import { parseEffortChart } from './parseEffortChart';
import { detectCsvKind, parseProgramSheet } from './parseProgram';

export const MAX_CSV_BYTES = 200 * 1024;

export interface CsvImport {
  kind: 'program' | 'chart' | 'unknown';
  fileName: string;
  /** Program days (one week), when kind is "program". */
  days: ProgramDay[] | null;
  /** A standalone chart, or one embedded in a program sheet. */
  chart: ChartData | null;
  issues: ImportIssue[];
  suggestedName: string;
  /** "Week 3" when the file name says so, else null. */
  weekFromName: string | null;
  canSave: boolean;
}

/** "Strength Block (Week 2).csv" -> "Strength Block". */
export function nameFromFile(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '');
  const stripped = base
    .replace(/[([]?\s*week\s*\d+\s*[)\]]?/gi, '')
    .replace(/[\s\-_–]+$/, '')
    .replace(/^[\s\-_–]+/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return stripped || base.trim() || 'Untitled';
}

export function weekFromFile(fileName: string): string | null {
  const m = fileName.match(/week\s*(\d+)/i);
  return m ? `Week ${Number(m[1])}` : null;
}

export function importCsvText(text: string, fileName: string): CsvImport {
  const { rows } = parseCsv(text);
  const kind = detectCsvKind(rows);
  const base = {
    fileName,
    suggestedName: nameFromFile(fileName),
    weekFromName: weekFromFile(fileName),
  };

  if (kind === 'program') {
    const result = parseProgramSheet(rows);
    return {
      ...base,
      kind,
      days: result.days,
      chart: result.chart,
      issues: result.issues,
      canSave: !!result.days && !hasErrors(result.issues),
    };
  }
  if (kind === 'chart') {
    const result = parseEffortChart(rows);
    return {
      ...base,
      kind,
      days: null,
      chart: result.chart,
      issues: result.issues,
      canSave: !!result.chart && !hasErrors(result.issues),
    };
  }
  return {
    ...base,
    kind,
    days: null,
    chart: null,
    issues: [
      issueAt(
        'error',
        "This doesn't look like a program (no Sets/Reps header) or an RPE chart (no numeric grid).",
      ),
    ],
    canSave: false,
  };
}

/** Read a picked File, enforcing the size limit. */
export async function importCsvFile(file: File): Promise<CsvImport> {
  if (file.size > MAX_CSV_BYTES) {
    return {
      kind: 'unknown',
      fileName: file.name,
      days: null,
      chart: null,
      issues: [
        issueAt('error', `That file is ${Math.round(file.size / 1024)} KB; the limit is 200 KB.`),
      ],
      suggestedName: nameFromFile(file.name),
      weekFromName: weekFromFile(file.name),
      canSave: false,
    };
  }
  return importCsvText(await file.text(), file.name);
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export const PROGRAM_TEMPLATE = [
  'Day 1,,,,',
  ',Sets,Reps,Prescribed RPE,Notes',
  'Comp Bench,3,3,5-6,',
  'Machine Row,2,6-8,9,',
  'Lateral Raises,2,8-10,10,',
  ',,,,',
  'Day 2,,,,',
  ',Sets,Reps,Prescribed RPE,Notes',
  'Comp Squat,1,3,5,',
  'Pause Squat,3,6,-15%,back-off',
  'Leg Press,2,6-8,8-9,',
  ',,,,',
  'Day 3,Rest,,,',
].join('\n');

export function chartTemplate(): string {
  const chart = defaultChart();
  const head = ['Reps', ...chart.rpeValues.map(String)].join(',');
  const lines = chart.rows.map((r) =>
    [r.reps, ...r.percents.map((p) => (p === null ? '' : (p * 100).toFixed(2)))].join(','),
  );
  return [head, ...lines].join('\n');
}

/** Offer text as a file download. */
export function downloadText(fileName: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
