import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { User } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';

const createProgram = vi.fn(() => ({ id: 'new-program', saved: Promise.resolve() }));
const addWeek = vi.fn(() => Promise.resolve());
const createChart = vi.fn(() => ({ id: 'new-chart', saved: Promise.resolve() }));
const updateProfile = vi.fn(() => Promise.resolve());

vi.mock('../../src/lib/db/programs', async (orig) => ({
  ...(await orig<typeof import('../../src/lib/db/programs')>()),
  createProgram: (...a: unknown[]) => createProgram(...(a as [])),
  addWeek: (...a: unknown[]) => addWeek(...(a as [])),
}));
vi.mock('../../src/lib/db/charts', () => ({
  createChart: (...a: unknown[]) => createChart(...(a as [])),
}));
vi.mock('../../src/lib/db/profile', () => ({
  updateProfile: (...a: unknown[]) => updateProfile(...(a as [])),
}));

const { ImportPreview } = await import('../../src/features/upload/ImportPreview');
const { importCsvText } = await import('../../src/lib/csv/importFile');
const { AuthContext, ProfileContext } = await import('../../src/features/auth/contexts');
const { ToastProvider } = await import('../../src/components/ui/Toast');
type Program = import('../../src/lib/types').Program;
type UserProfile = import('../../src/lib/types').UserProfile;

const fixture = readFileSync(
  resolve(process.cwd(), 'tests/fixtures/five-day-split-week1.csv'),
  'utf8',
);
const profile = {
  username: 'Alice',
  units: 'lb',
  effortScale: 'rpe',
  activeChartId: null,
  activeProgramId: null,
  onboardedAt: {} as Timestamp,
} as unknown as UserProfile;

function renderPreview(props: Partial<Parameters<typeof ImportPreview>[0]> = {}) {
  const onDone = vi.fn();
  const imp = importCsvText(fixture, 'Five Day Split(Week 1).csv');
  render(
    <AuthContext.Provider value={{ status: 'signedIn', user: { uid: 'u1' } as User }}>
      <ProfileContext.Provider value={{ status: 'ready', profile }}>
        <ToastProvider>
          <MemoryRouter>
            <ImportPreview imp={imp} programs={[]} onDone={onDone} {...props} />
          </MemoryRouter>
        </ToastProvider>
      </ProfileContext.Provider>
    </AuthContext.Provider>,
  );
  return { onDone, imp };
}

beforeEach(() => {
  createProgram.mockClear();
  addWeek.mockClear();
  createChart.mockClear();
  updateProfile.mockClear();
});

describe('ImportPreview with the reference program', () => {
  it('summarises the week and lists the repaired labels', () => {
    renderPreview();
    expect(screen.getByText('5 workouts · 2 rest days')).toBeInTheDocument();
    const notes = screen.getByRole('list', { name: 'Import notes' });
    expect(within(notes).getByText(/called it Day 2/)).toBeInTheDocument();
    expect(within(notes).getByText(/renamed it Day 7/)).toBeInTheDocument();
    expect(within(notes).getByText(/probably an image/)).toBeInTheDocument();
  });

  it('suggests the program name and week from the file name', () => {
    renderPreview();
    expect(screen.getByLabelText('Program name')).toHaveValue('Five Day Split');
    expect(screen.getByLabelText('Week')).toHaveValue('Week 1');
  });

  it('previews Day 1 open with its prescriptions', () => {
    renderPreview();
    const day1 = screen.getByText('Day 1').closest('details')!;
    expect(day1).toHaveAttribute('open');
    expect(within(day1).getAllByText('Comp Bench')).toHaveLength(2);
    expect(within(day1).getByText('3 × 3 · RPE 5-6')).toBeInTheDocument();
    expect(within(day1).getByText('2 × 6-8 · RPE 10')).toBeInTheDocument();
  });

  it('saves a new program and makes it active when none is', () => {
    const { onDone, imp } = renderPreview();
    fireEvent.change(screen.getByLabelText('Program name'), { target: { value: 'My Split' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(createProgram).toHaveBeenCalledWith('u1', 'My Split', {
      label: 'Week 1',
      sourceFileName: 'Five Day Split(Week 1).csv',
      days: imp.days,
    });
    expect(updateProfile).toHaveBeenCalledWith('u1', { activeProgramId: 'new-program' });
    expect(createChart).not.toHaveBeenCalled();
    expect(onDone).toHaveBeenCalled();
  });

  it('adds the week to an existing program with the next week number', () => {
    const existing = {
      id: 'p1',
      name: 'My Split',
      weeks: [{ label: 'Week 1', sourceFileName: 'a.csv', days: [] }],
    } as unknown as Program & { id: string };
    const imp = importCsvText(fixture, 'Five Day Split.csv');
    render(
      <AuthContext.Provider value={{ status: 'signedIn', user: { uid: 'u1' } as User }}>
        <ProfileContext.Provider value={{ status: 'ready', profile }}>
          <ToastProvider>
            <MemoryRouter>
              <ImportPreview
                imp={imp}
                programs={[existing]}
                fixedProgram={existing}
                onDone={vi.fn()}
              />
            </MemoryRouter>
          </ToastProvider>
        </ProfileContext.Provider>
      </AuthContext.Provider>,
    );
    expect(screen.queryByLabelText('Program name')).toBeNull();
    expect(screen.getByLabelText('Week')).toHaveValue('Week 2');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(addWeek).toHaveBeenCalledWith(
      'u1',
      existing,
      expect.objectContaining({ label: 'Week 2', sourceFileName: 'Five Day Split.csv' }),
    );
  });
});
