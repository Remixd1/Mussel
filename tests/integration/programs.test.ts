/**
 * Saves the reference program to the Firestore emulator through the app's db
 * layer and the real rules: proves the nested weeks/days/exercises shape is a
 * valid Firestore document and survives a round trip.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { doc, getDoc } from 'firebase/firestore';
import { deleteAccount, signOut, signUp } from '../../src/lib/auth';
import { importCsvText } from '../../src/lib/csv/importFile';
import { createChart } from '../../src/lib/db/charts';
import { addWeek, createProgram, repeatWeek, type WithId } from '../../src/lib/db/programs';
import { DEMO_PROJECT_ID, getFirebase } from '../../src/lib/firebase';
import type { EffortChart, Program } from '../../src/lib/types';

const { auth, db } = getFirebase();
const PASSWORD = 'correct-horse-9';

async function reset() {
  await signOut().catch(() => undefined);
  await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${DEMO_PROJECT_ID}/accounts`, {
    method: 'DELETE',
  });
  await fetch(
    `http://127.0.0.1:8080/emulator/v1/projects/${DEMO_PROJECT_ID}/databases/(default)/documents`,
    { method: 'DELETE' },
  );
}

const fixture = readFileSync(
  resolve(process.cwd(), 'tests/fixtures/five-day-split-week1.csv'),
  'utf8',
);

async function readProgram(uid: string, id: string): Promise<WithId<Program>> {
  const snap = await getDoc(doc(db, 'users', uid, 'programs', id));
  return { id, ...(snap.data() as Program) };
}

beforeAll(async () => {
  await reset();
  await signUp({ email: 'lifter@example.com', username: 'Lifter', password: PASSWORD });
});
afterAll(reset);

describe('programs in Firestore', () => {
  it('saves the imported week and reads it back unchanged', async () => {
    const uid = auth.currentUser!.uid;
    const imp = importCsvText(fixture, 'Five Day Split(Week 1).csv');
    const week = { label: 'Week 1', sourceFileName: imp.fileName, days: imp.days! };

    const { id, saved } = createProgram(uid, 'Five Day Split', week);
    await saved;

    const program = await readProgram(uid, id);
    expect(program.name).toBe('Five Day Split');
    expect(program.weeks).toEqual([week]);
    expect(program.createdAt).toBeDefined();
  });

  it('adds and repeats weeks', async () => {
    const uid = auth.currentUser!.uid;
    const imp = importCsvText(fixture, 'Five Day Split(Week 1).csv');
    const { id, saved } = createProgram(uid, 'Block', {
      label: 'Week 1',
      sourceFileName: imp.fileName,
      days: imp.days!,
    });
    await saved;

    await addWeek(uid, await readProgram(uid, id), {
      label: 'Week 2',
      sourceFileName: 'week2.csv',
      days: imp.days!.slice(0, 2),
    });
    await repeatWeek(uid, await readProgram(uid, id), 0);

    const program = await readProgram(uid, id);
    expect(program.weeks.map((w) => [w.label, w.sourceFileName, w.days.length])).toEqual([
      ['Week 1', 'Five Day Split(Week 1).csv', 7],
      ['Week 2', 'week2.csv', 2],
      ['Week 3', null, 7],
    ]);
    expect(program.weeks[2].days).toEqual(program.weeks[0].days);
  });

  it('saves a chart', async () => {
    const uid = auth.currentUser!.uid;
    const imp = importCsvText('Reps,10,9\n1,100,95.5\n2,95.5,92.2', 'chart.csv');
    const { id, saved } = createChart(uid, 'My chart', imp.chart!, 'chart.csv');
    await saved;
    const chart = (await getDoc(doc(db, 'users', uid, 'charts', id))).data() as EffortChart;
    expect(chart.rpeValues).toEqual([10, 9]);
    expect(chart.rows[1]).toEqual({ reps: 2, percents: [0.955, 0.922] });
  });

  it('deleting the account removes programs too', async () => {
    const uid = auth.currentUser!.uid;
    await deleteAccount(PASSWORD);
    const res = await fetch(
      `http://127.0.0.1:8080/v1/projects/${DEMO_PROJECT_ID}/databases/(default)/documents/users/${uid}/programs`,
      { headers: { Authorization: 'Bearer owner' } },
    );
    const body = (await res.json()) as { documents?: unknown[] };
    expect(body.documents ?? []).toEqual([]);
  });
});
