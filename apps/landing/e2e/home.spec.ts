import { test, expect } from '@playwright/test';

/**
 * Home depois do redesign (issue #317): o gancho do hero é a calculadora em modo
 * compacto, e o caminho de saída dela é a página completa. Este smoke cobre a
 * fiação — a ordem das seções e a copy são verificação humana.
 */

test('a calculadora do hero responde e aponta pro modo completo', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('Peso corporal (kg)').fill('82');
  await page.getByLabel('Carga que você fez (kg)').fill('110');
  await page.getByRole('button', { name: 'Ver meu resultado' }).click();

  await expect(page.getByText('Seu supino · até 83 kg · raw')).toBeVisible();

  const maisLifts = page.getByRole('link', { name: 'adicionar agacho e terra' });
  await expect(maisLifts).toHaveAttribute('href', '/quao-forte-voce-e?s=m&bw=82&bp=110');

  await maisLifts.click();
  await expect(page.getByRole('heading', { name: 'Quão forte você é?', level: 1 })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Supino' }).getByLabel('Carga (kg)')).toHaveValue('110');
});

test('o hero guarda um único botão em brass: o da calculadora', async ({ page }) => {
  await page.goto('/');

  const heroPrimary = page.locator('.hero .btn--primary');
  await expect(heroPrimary).toHaveCount(1);
  await expect(heroPrimary).toHaveClass(/forca__submit/);
});
