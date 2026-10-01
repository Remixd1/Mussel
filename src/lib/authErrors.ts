/** Maps Firebase Auth (and our own) error codes to plain, friendly messages. */

export const USERNAME_TAKEN = 'mussel/username-taken';

/** Thrown when the username was claimed between the availability check and submit. */
export class UsernameTakenError extends Error {
  readonly code = USERNAME_TAKEN;
  constructor() {
    super('That username is taken.');
    this.name = 'UsernameTakenError';
  }
}

const MESSAGES: Record<string, string> = {
  // Wrong email or password. Firebase deliberately doesn't say which.
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/invalid-login-credentials': 'Email or password is incorrect.',
  'auth/wrong-password': 'Email or password is incorrect.',
  'auth/user-not-found': 'Email or password is incorrect.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/missing-email': 'Enter your email.',
  'auth/weak-password': 'Password is too weak. Use at least 8 characters.',
  'auth/missing-password': 'Enter your password.',
  'auth/network-request-failed': 'No connection. Check your signal and try again.',
  'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/requires-recent-login': 'Please enter your password again.',
  'auth/operation-not-allowed': 'Email sign-in is not enabled for this project yet.',
  unavailable: 'No connection. Check your signal and try again.',
  [USERNAME_TAKEN]: 'That username is taken.',
};

export function authErrorMessage(err: unknown): string {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code: unknown }).code)
      : '';
  return MESSAGES[code] ?? 'Something went wrong. Try again.';
}
