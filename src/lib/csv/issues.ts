import { columnName } from './parseCsv';

/** A problem found while reading a CSV. Errors block saving; warnings don't. */
export interface ImportIssue {
  level: 'error' | 'warning';
  message: string;
  /** 1-based spreadsheet row, when the issue points at a place. */
  row?: number;
  /** Spreadsheet column letter, e.g. "F". */
  col?: string;
}

export function issueAt(
  level: ImportIssue['level'],
  message: string,
  rowIndex?: number,
  colIndex?: number,
): ImportIssue {
  return {
    level,
    message,
    ...(rowIndex !== undefined ? { row: rowIndex + 1 } : {}),
    ...(colIndex !== undefined ? { col: columnName(colIndex) } : {}),
  };
}

/** "Row 22, column F" style location, or "" when the issue has none. */
export function issueLocation(issue: ImportIssue): string {
  if (issue.row && issue.col) return `Row ${issue.row}, column ${issue.col}`;
  if (issue.row) return `Row ${issue.row}`;
  if (issue.col) return `Column ${issue.col}`;
  return '';
}

export const hasErrors = (issues: readonly ImportIssue[]) =>
  issues.some((i) => i.level === 'error');
