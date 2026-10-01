import { defineConfig } from 'vitest/config';

// Auth flow integration tests against the Auth + Firestore emulators, with the
// real firestore.rules loaded. Run via `npm run test:integration`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false,
    env: {
      // Point src/lib/firebase.ts at the emulators with the demo project,
      // ignoring any real config in .env.local.
      VITE_USE_EMULATORS: 'true',
      VITE_FIREBASE_API_KEY: '',
      VITE_FIREBASE_PROJECT_ID: '',
    },
  },
});
