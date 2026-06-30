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
      workbox: {
        // Precache the app shell and the small codecs (incl. the ~1.2 MB AVIF decoder),
        // but not the multi-MB AVIF *encoders* — they're only needed when a user forces
        // AVIF output, so we fetch them on demand and runtime-cache them for offline reuse.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}'],
        globIgnores: ['**/avif_enc*.wasm'],
        runtimeCaching: [
          {
            urlPattern: /avif_enc.*\.wasm$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'scalir-avif-encoder',
              expiration: { maxEntries: 4 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
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
    }),
  ],
});
