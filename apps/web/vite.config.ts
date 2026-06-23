import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
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
        theme_color: '#060606',
        background_color: '#060606',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
})
