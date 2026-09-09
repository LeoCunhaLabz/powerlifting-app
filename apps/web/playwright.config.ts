import { defineConfig, devices } from '@playwright/test';

// ---------------------------------------------------------------------------
// E2E do golden path (issue #251). Sobe o fio completo local:
//   - API real via tsx na porta 3010 (migrations rodam no boot);
//   - build de produção do web servido por `vite preview` na porta 4173,
//     compilado com VITE_API_URL apontando para a API acima.
// Requer um Postgres acessível — informe em E2E_DATABASE_URL (no CI é um
// service container; local, um Postgres seu ou o do docker-compose com a
// porta publicada). Rode com `npm run test:e2e` na raiz.
// ---------------------------------------------------------------------------

const API_PORT = 3010;
const WEB_PORT = 4173;
const DATABASE_URL =
  process.env.E2E_DATABASE_URL ?? 'postgresql://powerlifting:powerlifting@localhost:5432/powerlifting';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: [
    {
      command: 'npx tsx src/index.ts',
      cwd: '../api',
      port: API_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        PORT: String(API_PORT),
        HOST: '127.0.0.1',
        DATABASE_URL,
        JWT_SECRET: 'e2e-jwt-secret-com-no-minimo-32-caracteres',
        CORS_ORIGIN: `http://localhost:${WEB_PORT}`,
      },
    },
    {
      command: `npm run build && npm run preview -- --port ${WEB_PORT} --strictPort`,
      port: WEB_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: {
        VITE_API_URL: `http://localhost:${API_PORT}`,
      },
    },
  ],
});
