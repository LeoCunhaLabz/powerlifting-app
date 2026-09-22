import { test, expect } from '@playwright/test';

/**
 * Primeiro smoke da landing (issue #316): o caminho que a pessoa faz de
 * verdade em /quao-forte-voce-e — preencher, ver o resultado e sair com um
 * link. Os cálculos em si já têm teste unitário; aqui é a fiação.
 */

test('preencher um lift mostra o resultado e gera o link de compartilhamento', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/quao-forte-voce-e');

  await page.getByLabel('Peso corporal (kg)').fill('82');

  const supino = page.getByRole('group', { name: 'Supino' });
  await supino.getByLabel('Carga (kg)').fill('110');
  await supino.getByRole('radio', { name: '5', exact: true }).click();

  await page.getByRole('button', { name: 'Ver meu resultado' }).click();

  // Card de resultado: kicker da categoria, máximo estimado e percentil.
  await expect(page.getByText('Seu supino · até 83 kg · raw')).toBeVisible();
  await expect(page.getByText('Máximo estimado: 123,8 kg')).toBeVisible();
  await expect(page.getByText('dos atletas da sua categoria levantam menos')).toBeVisible();

  // CTA leva o payload no fragmento (ponte pro cadastro do app).
  const cta = page.getByRole('link', { name: 'Salvar e acompanhar a evolução' });
  await expect(cta).toHaveAttribute('href', /#forca=[A-Za-z0-9_-]+$/);

  // Compartilhar no desktop copia o link e confirma na hora.
  await page.getByRole('button', { name: 'Compartilhar' }).click();
  await expect(page.getByRole('button', { name: 'Link copiado' })).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('/quao-forte-voce-e?s=m&bw=82&bp=110&rbp=5');
});

test('link compartilhado abre com o resultado pronto', async ({ page }) => {
  await page.goto('/quao-forte-voce-e?s=m&bw=82&sq=160&bp=110&rbp=5&dl=200');

  // Três lifts preenchidos: abre no Total, com DOTS no rodapé.
  await expect(page.getByText('Seu total · até 83 kg · raw')).toBeVisible();
  await expect(page.getByText('Total estimado: 483,8 kg')).toBeVisible();
  await expect(page.getByText(/DOTS \d/)).toBeVisible();
});
