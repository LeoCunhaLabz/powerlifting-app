import { defineConfig, devices } from '@playwright/test';

// ---------------------------------------------------------------------------
// Smoke da landing (issue #316). Sobe o build de produção servido pelo
// `astro preview` — é HTML estático com ilhas, não precisa de API nem banco,
// então roda em qualquer máquina com `npm run test:e2e:landing` na raiz.
// O @playwright/test já é devDependency do apps/web (mesmo caso do og-image):
// nada novo entra no monorepo por causa deste arquivo.
// Pré-requisito local: `npx playwright install chromium` (uma vez por máquina).
// ---------------------------------------------------------------------------

const PORT = 4322;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --host 127.0.0.1`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
