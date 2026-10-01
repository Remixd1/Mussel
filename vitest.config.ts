import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    // Emulator-backed suites run via npm run test:rules / test:integration.
    exclude: ['tests/rules/**', 'tests/integration/**', 'node_modules/**'],
    setupFiles: ['tests/setup.ts'],
  },
});
