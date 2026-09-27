/**
 * All themed copy, with a plain alternative for each (CLAUDE.md §3.7).
 * Voice: deadpan, dry, about the lab and bureaucracy. Never about the
 * subject's body, weight, appearance, or eating. No guilt for missed days.
 */
export const ANNOUNCER = {
  'signIn.title': { themed: 'IDENTIFY YOURSELF, SUBJECT.', plain: 'Sign in' },
  'home.empty': {
    themed: 'No sessions on file. The equipment is getting lonely.',
    plain: 'No workouts yet.',
  },
  'session.start': {
    themed: 'Test session initiated. Please lift responsibly.',
    plain: 'Workout started.',
  },
  'session.saved': {
    themed: 'Session logged. Your data has been filed, laminated, and ignored by management.',
    plain: 'Workout saved.',
  },
  'session.discardConfirm': {
    themed: 'Abort this test? Results will be shredded.',
    plain: 'Discard this workout?',
  },
  'set.done': { themed: 'Trial recorded.', plain: 'Set logged.' },
  'rest.done': {
    themed: 'Recovery interval concluded. Resume lifting.',
    plain: 'Rest over.',
  },
  'pr.hit': {
    themed: 'ANOMALY DETECTED: new personal record. Please remain calm.',
    plain: 'New PR!',
  },
  'delete.confirm': {
    themed: 'Deleting is permanent. The lab will pretend this never happened.',
    plain: 'Delete permanently?',
  },
  offline: {
    themed: 'Facility link lost. Results will transmit when connection is restored.',
    plain: 'Offline. Changes will sync later.',
  },
  'streak.none': {
    themed: 'Welcome back, Subject. The lab did not notice you were gone.',
    plain: 'Welcome back.',
  },
  'update.ready': {
    themed: 'New lab firmware available. Reload?',
    plain: 'Update available. Reload?',
  },
  'placeholder.body': {
    themed: 'This wing is under construction. Hard hats are optional but encouraged.',
    plain: 'Coming soon.',
  },
  'notFound.body': {
    themed: 'This corridor does not appear on any facility map.',
    plain: 'Page not found.',
  },
} as const satisfies Record<string, { themed: string; plain: string }>;

export type CopyKey = keyof typeof ANNOUNCER;

export function getCopy(key: CopyKey, announcerOn: boolean): string {
  const entry = ANNOUNCER[key];
  return announcerOn ? entry.themed : entry.plain;
}
