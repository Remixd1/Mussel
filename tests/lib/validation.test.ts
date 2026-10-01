import { describe, expect, it } from 'vitest';
import {
  generateSubjectNumber,
  usernameKey,
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
  validateUsername,
} from '../../src/lib/validation';

describe('validateUsername', () => {
  it.each(['abc', 'Alice_01', 'SQUAT_QUEEN', 'a'.repeat(20), '  padded  '])(
    'accepts %j',
    (name) => {
      expect(validateUsername(name)).toBeNull();
    },
  );

  it('requires a value', () => {
    expect(validateUsername('')).toMatch(/Enter a username/);
    expect(validateUsername('   ')).toMatch(/Enter a username/);
  });

  it('enforces 3 to 20 characters', () => {
    expect(validateUsername('ab')).toMatch(/at least 3/);
    expect(validateUsername('a'.repeat(21))).toMatch(/at most 20/);
  });

  it.each(['has space', 'dash-name', 'dot.name', 'émile', 'emoji🦪'])('rejects %j', (name) => {
    expect(validateUsername(name)).toMatch(/letters, numbers, and underscores/);
  });
});

describe('usernameKey', () => {
  it('lowercases and trims for case-insensitive uniqueness', () => {
    expect(usernameKey('  Alice_01 ')).toBe('alice_01');
  });
});

describe('validateEmail', () => {
  it.each(['a@b.co', ' subject@lab.example ', 'first.last+tag@mail.com'])('accepts %j', (e) => {
    expect(validateEmail(e)).toBeNull();
  });

  it.each(['', 'plain', 'no@tld', '@lab.com', 'two words@lab.com'])('rejects %j', (e) => {
    expect(validateEmail(e)).not.toBeNull();
  });
});

describe('validatePassword', () => {
  it('requires at least 8 characters', () => {
    expect(validatePassword('')).toMatch(/Enter a password/);
    expect(validatePassword('1234567')).toMatch(/at least 8/);
    expect(validatePassword('12345678')).toBeNull();
  });
});

describe('validatePasswordConfirm', () => {
  it('requires a matching confirmation', () => {
    expect(validatePasswordConfirm('secret-pass', '')).toMatch(/Confirm/);
    expect(validatePasswordConfirm('secret-pass', 'secret-pas')).toMatch(/do not match/);
    expect(validatePasswordConfirm('secret-pass', 'secret-pass')).toBeNull();
  });
});

describe('generateSubjectNumber', () => {
  it('is always four zero-padded digits', () => {
    expect(generateSubjectNumber(() => 0)).toBe('0000');
    expect(generateSubjectNumber(() => 0.0417)).toBe('0417');
    expect(generateSubjectNumber(() => 0.99999)).toBe('9999');
    expect(generateSubjectNumber()).toMatch(/^\d{4}$/);
  });
});
