import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { User } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';
import { AuthContext, ProfileContext, type AuthState } from '../../src/features/auth/contexts';
import { RequireAuth, RequireGuest } from '../../src/features/auth/guards';
import type { ProfileState } from '../../src/lib/db/profile';
import type { UserProfile } from '../../src/lib/types';

const user = { uid: 'u1', email: 'a@b.co' } as User;
const ts = {} as Timestamp;
const profile = (onboarded: boolean): ProfileState => ({
  status: 'ready',
  profile: { username: 'Alice', onboardedAt: onboarded ? ts : null } as UserProfile,
});

function renderAt(path: string, auth: AuthState, prof: ProfileState = { status: 'loading' }) {
  return render(
    <AuthContext.Provider value={auth}>
      <ProfileContext.Provider value={prof}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route element={<RequireGuest />}>
              <Route path="/login" element={<p>login page</p>} />
            </Route>
            <Route element={<RequireAuth onboarding />}>
              <Route path="/onboarding" element={<p>onboarding page</p>} />
            </Route>
            <Route element={<RequireAuth />}>
              <Route path="/" element={<p>home page</p>} />
              <Route path="/profile" element={<p>profile page</p>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ProfileContext.Provider>
    </AuthContext.Provider>,
  );
}

describe('RequireAuth', () => {
  it('shows a splash while the saved session is restored (no login flash)', () => {
    renderAt('/profile', { status: 'loading' });
    expect(screen.getByRole('status')).toHaveTextContent(/loading/i);
    expect(screen.queryByText('login page')).toBeNull();
  });

  it('sends signed-out visitors to login', () => {
    renderAt('/profile', { status: 'signedOut' });
    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  it('sends visitors to login when Firebase is unavailable', () => {
    renderAt('/', { status: 'unavailable' });
    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  it('waits for the profile before deciding', () => {
    renderAt('/', { status: 'signedIn', user }, { status: 'loading' });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('offers sign-out when the profile is missing', () => {
    renderAt('/', { status: 'signedIn', user }, { status: 'missing' });
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
  });

  it('routes new subjects to onboarding', () => {
    renderAt('/profile', { status: 'signedIn', user }, profile(false));
    expect(screen.getByText('onboarding page')).toBeInTheDocument();
  });

  it('lets onboarded subjects through', () => {
    renderAt('/profile', { status: 'signedIn', user }, profile(true));
    expect(screen.getByText('profile page')).toBeInTheDocument();
  });

  it('keeps onboarded subjects out of onboarding', () => {
    renderAt('/onboarding', { status: 'signedIn', user }, profile(true));
    expect(screen.getByText('home page')).toBeInTheDocument();
  });
});

describe('RequireGuest', () => {
  it('shows login to signed-out visitors', () => {
    renderAt('/login', { status: 'signedOut' });
    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  it('skips login for a returning, signed-in subject', () => {
    renderAt('/login', { status: 'signedIn', user }, profile(true));
    expect(screen.getByText('home page')).toBeInTheDocument();
  });
});
