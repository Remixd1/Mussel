import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const signUp = vi.fn();
const isUsernameAvailable = vi.fn();

vi.mock('../../src/lib/auth', () => ({ signUp: (...a: unknown[]) => signUp(...a) }));
vi.mock('../../src/lib/db/usernames', () => ({
  isUsernameAvailable: (...a: unknown[]) => isUsernameAvailable(...a),
}));
vi.mock('../../src/lib/firebase', () => ({ isFirebaseAvailable: true }));

const { default: SignupPage } = await import('../../src/pages/SignupPage');
const { UsernameTakenError } = await import('../../src/lib/authErrors');

function renderPage() {
  return render(
    <MemoryRouter>
      <SignupPage />
    </MemoryRouter>,
  );
}

const field = (label: string) => screen.getByLabelText(label) as HTMLInputElement;
const type = (label: string, value: string) =>
  fireEvent.change(field(label), { target: { value } });
const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

function fillValid() {
  type('Email', 'alice@example.com');
  type('Username', 'Alice_01');
  type('Password', 'correct-horse-9');
  type('Confirm password', 'correct-horse-9');
}

beforeEach(() => {
  vi.useRealTimers();
  signUp.mockReset().mockResolvedValue(undefined);
  isUsernameAvailable.mockReset().mockResolvedValue(true);
});

describe('SignupPage', () => {
  it('asks for email, username, password, and confirmation', () => {
    renderPage();
    expect(field('Email')).toHaveAttribute('type', 'email');
    expect(field('Username')).toHaveAttribute('autocomplete', 'username');
    expect(field('Password')).toHaveAttribute('autocomplete', 'new-password');
    expect(field('Confirm password')).toHaveAttribute('type', 'password');
  });

  it('shows every problem at once and does not submit', () => {
    renderPage();
    type('Password', 'short');
    type('Confirm password', 'different');
    submit();
    expect(screen.getByText('Enter your email.')).toBeInTheDocument();
    expect(screen.getByText('Enter a username.')).toBeInTheDocument();
    expect(screen.getByText(/at least 8 characters/)).toBeInTheDocument();
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
  });

  it('submits valid details', async () => {
    renderPage();
    fillValid();
    await act(async () => submit());
    expect(signUp).toHaveBeenCalledWith({
      email: 'alice@example.com',
      username: 'Alice_01',
      password: 'correct-horse-9',
    });
  });

  it('shows live username availability', async () => {
    vi.useFakeTimers();
    isUsernameAvailable.mockResolvedValue(false);
    renderPage();
    type('Username', 'Taken_Name');
    expect(screen.getByText('Checking...')).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(isUsernameAvailable).toHaveBeenCalledWith('taken_name');
    expect(screen.getByText('That username is taken.')).toBeInTheDocument();
  });

  it('puts a lost username race on the username field', async () => {
    signUp.mockRejectedValue(new UsernameTakenError());
    renderPage();
    fillValid();
    await act(async () => submit());
    expect(field('Username')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('That username is taken.')).toBeInTheDocument();
  });

  it('shows other failures as a form error', async () => {
    signUp.mockRejectedValue({ code: 'auth/email-already-in-use' });
    renderPage();
    fillValid();
    await act(async () => submit());
    expect(screen.getByRole('alert')).toHaveTextContent(/already exists/);
    expect(screen.getByRole('button', { name: 'Create account' })).toBeEnabled();
  });
});
