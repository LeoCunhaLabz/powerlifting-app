import { defineConfig } from 'vitest/config';

// O Vite do site é configurado pelo Astro; este arquivo existe só para recortar
// o que o Vitest varre — sem ele o `vitest run` tenta rodar o e2e/ do Playwright
// e quebra. Mesmo recorte do apps/web (vite.config.ts).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
  },
});
