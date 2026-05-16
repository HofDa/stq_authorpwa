/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const designTokensCss = fs.readFileSync(
  path.resolve(__dirname, 'src/styles/tokens.css'),
  'utf8',
);

function readDesignToken(name: string): string {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = designTokensCss.match(
    new RegExp(`${escapedName}\\s*:\\s*([^;]+);`),
  );
  if (!match) {
    throw new Error(`Missing design token: ${name}`);
  }
  return match[1].trim();
}

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-192.png', 'pwa-512.png'],
      workbox: {
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
      devOptions: {
        enabled: false,
      },
      manifest: {
        name: 'SouthTyrolQuests Author',
        short_name: 'STQ Author',
        description: 'Author tours for SouthTyrolQuests in the field.',
        theme_color: readDesignToken('--stq-color-primary'),
        background_color: readDesignToken('--stq-color-bg'),
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  server: {
    host: true,
    port: 5174,
  },
});
