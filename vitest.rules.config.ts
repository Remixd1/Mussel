import { defineConfig } from 'vitest/config';

// Firestore security rule tests. Run via `npm run test:rules`, which wraps this
// in `firebase emulators:exec` so the Firestore emulator is up for the duration.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/rules/**/*.test.ts'],
    testTimeout: 20000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
