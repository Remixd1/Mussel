import { describe, expect, it } from 'vitest';
import { authErrorMessage, UsernameTakenError } from '../../src/lib/authErrors';

describe('authErrorMessage', () => {
  it('never reveals whether the email or the password was wrong', () => {
    for (const code of [
      'auth/invalid-credential',
      'auth/invalid-login-credentials',
      'auth/wrong-password',
      'auth/user-not-found',
    ]) {
      expect(authErrorMessage({ code })).toBe('Email or password is incorrect.');
    }
  });

  it('maps common sign-up and network failures', () => {
    expect(authErrorMessage({ code: 'auth/email-already-in-use' })).toMatch(/already exists/);
    expect(authErrorMessage({ code: 'auth/weak-password' })).toMatch(/too weak/);
    expect(authErrorMessage({ code: 'auth/network-request-failed' })).toMatch(/No connection/);
    expect(authErrorMessage({ code: 'auth/too-many-requests' })).toMatch(/Too many attempts/);
  });

  it('maps a lost username race', () => {
    expect(authErrorMessage(new UsernameTakenError())).toBe('That username is taken.');
  });

  it('falls back to a generic message for anything else', () => {
    expect(authErrorMessage({ code: 'auth/some-new-code' })).toBe(
      'Something went wrong. Try again.',
    );
    expect(authErrorMessage(new Error('boom'))).toBe('Something went wrong. Try again.');
    expect(authErrorMessage(null)).toBe('Something went wrong. Try again.');
  });
});
