// Captura o catálogo (/catalogo) em 375 e 480 px para a revisão de design.
// Uso, com `npm run dev` rodando:
//   npm run catalogo:shots -w @powerlifting/web -- [pasta-de-saida] [--sem-fontes]
// --sem-fontes bloqueia o Google Fonts para ver o fallback (primeira abertura sem internet).
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2);
const semFontes = args.includes('--sem-fontes');
const out = args.find((a) => !a.startsWith('--')) ?? join(tmpdir(), 'onyx-catalogo');
const url = process.env.CATALOGO_URL ?? 'http://localhost:5173/catalogo';

mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
for (const width of [375, 480]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  if (semFontes) await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  const name = `catalogo-${width}${semFontes ? '-sem-fontes' : ''}.png`;
  await page.screenshot({ path: join(out, name), fullPage: true });
  await page.close();
}
await browser.close();
console.log(`Capturas salvas em ${out}`);
