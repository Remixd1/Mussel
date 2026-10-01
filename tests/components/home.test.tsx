import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { User } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';
import { AuthContext, ProfileContext } from '../../src/features/auth/contexts';
import { ProgressMeter } from '../../src/components/ui/ProgressMeter';
import HomePage from '../../src/pages/HomePage';
import type { UserProfile } from '../../src/lib/types';

describe('ProgressMeter', () => {
  it('is a labelled progress bar showing its percentage', () => {
    render(<ProgressMeter label="Week elapsed" value={0.634} />);
    const bar = screen.getByRole('progressbar', { name: 'Week elapsed' });
    expect(bar).toHaveAttribute('aria-valuenow', '63');
    expect(bar).toHaveTextContent('63%');
  });

  it('clamps out-of-range values and accepts custom text', () => {
    render(<ProgressMeter label="Rest" value={1.7} valueText="0:45" />);
    const bar = screen.getByRole('progressbar', { name: 'Rest' });
    expect(bar).toHaveAttribute('aria-valuenow', '100');
    expect(bar).toHaveAttribute('aria-valuetext', '0:45');
  });
});

describe('HomePage', () => {
  const profile = {
    username: 'Alice_01',
    subjectNumber: '0417',
    effortScale: 'rpe',
    defaultRestSec: 90,
    activeChartId: null,
    onboardedAt: {} as Timestamp,
  } as UserProfile;

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

  it('shows the facility clock with week and day meters', () => {
    renderHome();
    expect(screen.getByRole('region', { name: 'Facility clock' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Week elapsed' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Day elapsed' })).toBeInTheDocument();
  });

  it('shows the subject widget', () => {
    renderHome();
    const subject = screen.getByRole('link', { name: 'Your subject file' });
    expect(subject).toHaveTextContent('#0417');
    expect(subject).toHaveTextContent('Alice_01');
    expect(subject).toHaveTextContent('BKL Standard Issue');
  });

  it('links each shortcut to its screen or profile section', () => {
    renderHome();
    const href = (name: string) => screen.getByRole('link', { name }).getAttribute('href');
    expect(href('Workout')).toBe('/workout');
    expect(href('Upload')).toBe('/upload');
    expect(href('History')).toBe('/profile#history');
    expect(href('Friends')).toBe('/profile#friends');
    expect(href('Workouts')).toBe('/profile#workouts');
    expect(href('Settings')).toBe('/profile#calibration');
  });
});
