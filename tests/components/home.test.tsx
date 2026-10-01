import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';

const live = {
  active: { status: 'ready', data: null } as { status: string; data: unknown },
  sessions: { status: 'ready', data: [] as unknown[] },
  friends: { status: 'ready', data: [] as unknown[] },
  feed: { loading: false, items: [] as unknown[] },
};
const updateProfile = vi.fn(() => Promise.resolve());

vi.mock('../../src/hooks/useWorkoutData', () => ({
  useActiveSession: () => live.active,
  useSessions: () => live.sessions,
  useFriends: () => live.friends,
  useFriendsFeed: () => live.feed,
}));
vi.mock('../../src/hooks/usePrograms', () => ({
  usePrograms: () => ({ status: 'ready', data: [{ id: 'p1', name: 'Five Day Split', weeks: [] }] }),
}));
vi.mock('../../src/lib/db/profile', () => ({
  updateProfile: (...a: unknown[]) => updateProfile(...(a as [])),
}));

const { default: HomePage } = await import('../../src/pages/HomePage');
const { ProgressMeter } = await import('../../src/components/ui/ProgressMeter');
const { AuthContext, ProfileContext } = await import('../../src/features/auth/contexts');
type UserProfile = import('../../src/lib/types').UserProfile;

const profile = {
  username: 'Alice',
  subjectNumber: '0417',
  units: 'kg',
  theme: 'light',
  activeProgramId: 'p1',
  onboardedAt: {} as Timestamp,
} as unknown as UserProfile;

function renderHome() {
  return render(
    <AuthContext.Provider value={{ status: 'signedIn', user: { uid: 'u1' } as User }}>
      <ProfileContext.Provider value={{ status: 'ready', profile }}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </ProfileContext.Provider>
    </AuthContext.Provider>,
  );
}

const session = (daysAgo: number, volumeKg: number, setCount: number) => ({
  id: `s${daysAgo}`,
  title: 'Push',
  startedAt: Timestamp.fromDate(new Date(Date.now() - daysAgo * 86_400_000)),
  totals: { volumeKg, setCount, durationSec: 3600 },
  entries: [],
});

beforeEach(() => {
  live.active = { status: 'ready', data: null };
  live.sessions = { status: 'ready', data: [] };
  live.friends = { status: 'ready', data: [] };
  live.feed = { loading: false, items: [] };
  updateProfile.mockClear();
});

describe('ProgressMeter', () => {
  it('is a labelled progress bar showing its percentage', () => {
    render(<ProgressMeter label="Rest remaining" value={0.634} />);
    const bar = screen.getByRole('progressbar', { name: 'Rest remaining' });
    expect(bar).toHaveAttribute('aria-valuenow', '63');
    expect(bar).toHaveTextContent('63%');
  });
});

describe('HomePage', () => {
  it('offers to start a workout and shows the empty state', () => {
    renderHome();
    expect(screen.getByRole('link', { name: /Start workout/ })).toHaveAttribute('href', '/workout');
    expect(screen.getByText(/No sessions on file/)).toBeInTheDocument();
    expect(screen.getByText('Five Day Split')).toBeInTheDocument();
  });

  it('shows a resume banner while a workout is in progress', () => {
    live.active = { status: 'ready', data: { title: 'Push Day' } };
    renderHome();
    expect(screen.getByRole('link', { name: /Push Day/ })).toHaveAttribute('href', '/workout');
    expect(screen.queryByRole('link', { name: /Start workout/ })).toBeNull();
  });

  it("totals this week's workouts", () => {
    // Today and yesterday may straddle Monday; use today twice to stay in the week.
    live.sessions = { status: 'ready', data: [session(0, 1200, 9), session(0, 800, 6)] };
    renderHome();
    const week = screen.getByLabelText('This week');
    expect(week).toHaveTextContent('2workouts');
    expect(week).toHaveTextContent('15sets');
    expect(week).toHaveTextContent('2,000');
  });

  it('flips to dark mode with one tap', () => {
    renderHome();
    fireEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }));
    expect(updateProfile).toHaveBeenCalledWith('u1', { theme: 'dark' });
  });

  it('asks you to add friends when you have none', () => {
    renderHome();
    expect(screen.getByRole('link', { name: 'Add friends' })).toHaveAttribute(
      'href',
      '/profile#friends',
    );
  });

  it("lists friends' workouts with their top sets", () => {
    live.friends = { status: 'ready', data: [{ id: 'f1', username: 'Bob_Lifts' }] };
    live.feed = {
      loading: false,
      items: [
        {
          friendUid: 'f1',
          username: 'Bob_Lifts',
          session: {
            ...session(1, 3000, 8),
            title: 'Leg Day',
            entries: [
              {
                exerciseName: 'Back Squat',
                sets: [
                  { reps: 5, rpe: 8, weightKg: 140, done: true },
                  { reps: 3, rpe: 9, weightKg: 150, done: true },
                ],
              },
            ],
          },
        },
      ],
    };
    renderHome();
    expect(screen.getByText('Bob_Lifts')).toBeInTheDocument();
    expect(screen.getByText('Leg Day')).toBeInTheDocument();
    expect(screen.getByText('3 × 150 kg')).toBeInTheDocument();
  });
});
