// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { fileURLToPath } from 'node:url';

// Landing pública do ONYX (issue #250). HTML estático servido pelo nginx do `web`
// na raiz de onyxtreino.com.br; o app segue em app.onyxtreino.com.br.
//
// Decisões que não são óbvias:
// - `build.format: 'file'` + `trailingSlash: 'never'`: gera /calculadoras/dots.html e
//   o nginx resolve com `try_files $uri $uri.html` → URLs limpas sem barra final.
// - alias `@onyx/calc`: as calculadoras reutilizam os cálculos puros do app
//   (apps/web/src/utils/powerlifting.ts) sem mover código para packages/shared.
// - CSP vem do nginx (nginx-landing-security-headers.conf), NÃO do `experimental.csp`
//   do Astro: o Astro sempre injeta um <style> inline (astro-island{display:contents})
//   e põe o hash dele em style-src — e o browser IGNORA 'unsafe-inline' quando há hash
//   na lista, bloqueando todos os `style="…"` do HTML (frames de celular, ilhas). Testado
//   em 16/09/2026 com Astro 5.18: 107 violações na home.
// - `build.inlineStylesheets: 'never'`: CSS sempre em arquivo (cacheável em /_astro/).
export default defineConfig({
  site: 'https://onyxtreino.com.br',
  trailingSlash: 'never',
  build: { format: 'file', inlineStylesheets: 'never' },
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.endsWith('/404'),
      i18n: undefined,
      changefreq: 'monthly',
      priority: 0.7,
      serialize(item) {
        if (item.url === 'https://onyxtreino.com.br' || item.url === 'https://onyxtreino.com.br/') {
          item.priority = 1.0;
          item.changefreq = 'weekly';
        }
        return item;
      },
    }),
  ],
  vite: {
    resolve: {
      alias: {
        '@onyx/calc': fileURLToPath(new URL('../web/src/utils/powerlifting.ts', import.meta.url)),
      },
    },
  },
});
