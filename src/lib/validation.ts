/** Account field rules (CLAUDE.md §5.1). Each returns an error message or null. */

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
export const PASSWORD_MIN = 8;

const USERNAME_PATTERN = /^[A-Za-z0-9_]+$/;
// Deliberately loose: Firebase Auth does the authoritative check.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Key for the case-insensitive username index. */
export function usernameKey(username: string): string {
  return username.trim().toLowerCase();
}

export function validateUsername(username: string): string | null {
  const name = username.trim();
  if (name.length === 0) return 'Enter a username.';
  if (name.length < USERNAME_MIN) return `Username must be at least ${USERNAME_MIN} characters.`;
  if (name.length > USERNAME_MAX) return `Username must be at most ${USERNAME_MAX} characters.`;
  if (!USERNAME_PATTERN.test(name)) return 'Use only letters, numbers, and underscores.';
  return null;
}

export function validateEmail(email: string): string | null {
  const value = email.trim();
  if (value.length === 0) return 'Enter your email.';
  if (!EMAIL_PATTERN.test(value)) return 'Enter a valid email address.';
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length === 0) return 'Enter a password.';
  if (password.length < PASSWORD_MIN)
    return `Password must be at least ${PASSWORD_MIN} characters.`;
  return null;
}

export function validatePasswordConfirm(password: string, confirm: string): string | null {
  if (confirm.length === 0) return 'Confirm your password.';
  if (password !== confirm) return 'Passwords do not match.';
  return null;
}

/** Random 4-digit Subject number, zero-padded ("0417"). Display only. */
export function generateSubjectNumber(random: () => number = Math.random): string {
  return String(Math.floor(random() * 10000)).padStart(4, '0');
}
