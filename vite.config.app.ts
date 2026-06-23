import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-32.png', 'apple-touch-icon-180.png'],
      manifest: {
        name: 'Scalir — Bulk Image Optimiser',
        short_name: 'Scalir',
        description: 'Resize and compress images in your browser. Private, free, no uploads.',
        theme_color: '#0f1115',
        background_color: '#0f1115',
        display: 'standalone',
        start_url: './',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Don't precache HTML — nginx/static host serves it directly.
        // This lets us rename app.html → index.html post-build safely.
        globIgnores: ['**/*.html'],
      },
    }),
  ],
  build: {
    outDir: 'dist-app',
    rollupOptions: {
      input: { index: 'app.html' },
    },
  },
});
