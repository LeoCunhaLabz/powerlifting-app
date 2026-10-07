import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts', 'scripts/**/*.{test,spec}.ts'],
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      pwaAssets: {
        config: true,
      },
      manifest: {
        name: 'ONYX — Powerlifting',
        short_name: 'ONYX',
        description: 'Acompanhe seus treinos de powerlifting: e1RM, RPE, Wilks, DOTS e IPF GL.',
        lang: 'pt-BR',
        theme_color: '#0c0b0a',
        background_color: '#0c0b0a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: '/index.html',
        // Barlow Condensed é parte da identidade: sem cache, sem sinal o app cai na fonte do sistema.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-css' },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-files',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
