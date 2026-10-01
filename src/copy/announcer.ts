/**
 * All themed copy, with a plain alternative for each (CLAUDE.md §3.7).
 * Voice: deadpan, dry, about the lab and bureaucracy. Never about the
 * subject's body, weight, appearance, or eating. No guilt for missed days.
 */
export const ANNOUNCER = {
  'signIn.title': { themed: 'IDENTIFY YOURSELF, SUBJECT.', plain: 'Sign in' },
  'signUp.title': { themed: 'NEW SUBJECT REGISTRATION.', plain: 'Create account' },
  'signOut.confirm': {
    themed: 'Leave the facility? Your data stays filed.',
    plain: 'Log out?',
  },
  'reset.sent': {
    themed: 'Password reset dispatched. Check your inbox, Subject.',
    plain: 'Password reset email sent.',
  },
  'intake.title': { themed: 'SUBJECT INTAKE', plain: 'Set up' },
  'intake.body': {
    themed: 'Please calibrate your preferences. The clipboard is waiting.',
    plain: 'Choose your preferences. You can change these later in Profile.',
  },
  'profile.noWorkouts': {
    themed: 'No saved workouts. The filing cabinet echoes.',
    plain: 'No saved workouts yet.',
  },
  'profile.noHistory': {
    themed: 'No test sessions on record.',
    plain: 'No workout history yet.',
  },
  'profile.noFriends': {
    themed: 'No associates on file. The lab respects your privacy.',
    plain: 'No friends yet.',
  },
  'account.deleted': {
    themed: 'Subject file shredded. The lab has already forgotten you were here.',
    plain: 'Account deleted.',
  },
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
  'chart.saved': {
    themed: 'Chart accepted. The lab will now pretend it understood it.',
    plain: 'Chart saved.',
  },
  'chart.invalid': {
    themed: 'Chart rejected. The lab could not read your handwriting.',
    plain: "Couldn't read that file.",
  },
  'chart.offChart': {
    themed: 'Off the chart. Literally. No estimate available.',
    plain: "Outside the chart's range.",
  },
  'rotate.prompt': {
    themed: 'Please return the device to its upright testing position.',
    plain: 'Rotate your phone to portrait.',
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
