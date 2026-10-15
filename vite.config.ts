import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Theme colors mirror src/styles/tokens.css (light theme).
const PAPER = '#FFFFFF';
const CHAMBER = '#E8EAE9';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Ask before reloading into a new version (UpdatePrompt), never mid-set.
      registerType: 'prompt',
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'licenses/*.txt'],
      manifest: {
        name: 'Mussel',
        short_name: 'Mussel',
        description:
          'Workout tracker from the Remixd Kinetics Laboratory. Results may vary. Gains may not.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: PAPER,
        background_color: CHAMBER,
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: '/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2,txt}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
});
