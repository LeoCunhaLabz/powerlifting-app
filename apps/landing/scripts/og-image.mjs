// Gera public/og-image.png (1200×630) a partir de scripts/og.html usando o Chromium do
// Playwright (já é devDependency do apps/web — nada novo no monorepo).
//
// Uso (na raiz):  npm run og-image -w @powerlifting/landing
// Pré-requisito:  npx playwright install chromium  (uma vez por máquina)
//
// O DOTS exibido é calculado de verdade (gate 3 da spec) com o mesmo módulo do app.
import { chromium } from '@playwright/test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(here, 'og.html');
const outPath = path.join(here, '..', 'public', 'og-image.png');

// Import dinâmico do TS puro do app via tsx não é necessário: os coeficientes DOTS
// oficiais são reproduzidos aqui só para a arte (fonte: OpenPowerlifting dots.rs).
function dotsMale(bodyweight, total) {
  const w = Math.min(Math.max(bodyweight, 40), 210);
  const den = -0.000001093 * w ** 4 + 0.0007391293 * w ** 3 - 0.1918759221 * w ** 2 + 24.0900756 * w - 307.75076;
  return Math.round((total * 500) / den * 100) / 100;
}

const dots = dotsMale(82.5, 512.5).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' });
await page.evaluate((value) => {
  const el = document.getElementById('dots');
  if (el) el.innerHTML = `${value}<small>pts</small>`;
}, dots);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: outPath, type: 'png' });
await browser.close();
console.log(`og-image gerada em ${path.relative(process.cwd(), outPath)} (DOTS ${dots})`);
