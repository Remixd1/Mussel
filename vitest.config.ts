import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Provided by vite-plugin-pwa in real builds; stubbed for tests.
      'virtual:pwa-register/react': fileURLToPath(
        new URL('./tests/mocks/pwa-register-react.ts', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    // Emulator-backed suites run via npm run test:rules / test:integration.
    exclude: ['tests/rules/**', 'tests/integration/**', 'node_modules/**'],
    setupFiles: ['tests/setup.ts'],
  },
});
