/**
 * Minimal RFC 4180 CSV reader for spreadsheet exports (Excel, Google Sheets,
 * Numbers). Handles quoted fields (with "" escapes and line breaks), CRLF/LF,
 * a UTF-8 BOM, and auto-detects comma, semicolon, or tab delimiters.
 */

export type Delimiter = ',' | ';' | '\t';

export interface CsvResult {
  rows: string[][];
  delimiter: Delimiter;
}

const CANDIDATES: Delimiter[] = [',', ';', '\t'];

/** Count each candidate delimiter outside quotes across the first lines. */
export function detectDelimiter(text: string): Delimiter {
  const counts = new Map<Delimiter, number>(CANDIDATES.map((d) => [d, 0]));
  let inQuotes = false;
  let lines = 0;
  for (let i = 0; i < text.length && lines < 50; i++) {
    const ch = text[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if (!inQuotes && ch === '\n') lines++;
    else if (!inQuotes && counts.has(ch as Delimiter)) {
      counts.set(ch as Delimiter, counts.get(ch as Delimiter)! + 1);
    }
  }
  // Ties go to comma (first candidate).
  return CANDIDATES.reduce((best, d) => (counts.get(d)! > counts.get(best)! ? d : best), ',');
}

export function parseCsv(input: string, delimiter?: Delimiter): CsvResult {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const delim = delimiter ?? detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"' && field === '') {
      inQuotes = true;
    } else if (ch === delim) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  // Last line without a trailing newline.
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return { rows, delimiter: delim };
}

/** Spreadsheet-style column name for a 0-based index: 0 -> "A", 27 -> "AB". */
export function columnName(index: number): string {
  let n = index + 1;
  let name = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    name = String.fromCharCode(65 + r) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}
