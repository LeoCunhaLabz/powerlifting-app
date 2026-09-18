// Gera public/og-image.png (1200×630) a partir de scripts/og.html usando o Chromium do
// Playwright (já é devDependency do apps/web para o test:e2e — nada novo no monorepo).
//
// Uso (na raiz):  npm run og-image -w @powerlifting/web
// Pré-requisito:  npx playwright install chromium  (uma vez por máquina)
import { chromium } from '@playwright/test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(here, 'og.html');
const outPath = path.join(here, '..', 'public', 'og-image.png');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: outPath, type: 'png' });
await browser.close();
console.log(`og-image gerada em ${path.relative(process.cwd(), outPath)}`);
