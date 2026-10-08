import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Golden path (issue #251): registrar → iniciar treino → adicionar exercício →
// registrar série → finalizar → dashboard mostra a sessão. Um único spec
// estável cobrindo o fio completo web → API → Postgres; e-mail único por
// execução, então o banco pode acumular estado entre runs.
// ---------------------------------------------------------------------------

test('golden path: do registro à sessão no dashboard', async ({ page }) => {
  const email = `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

  await page.goto('/');

  // --- Registro (loga automaticamente ao criar a conta) ---
  await page.getByRole('button', { name: 'Cadastrar' }).click();
  await page.locator('#auth-name').fill('Atleta E2E');
  await page.locator('#auth-email').fill(email);
  await page.locator('#auth-password').fill('senha-e2e-12345');
  await page.getByRole('button', { name: 'Criar conta' }).click();

  // App autenticado: a bottom-nav aparece.
  await expect(page.getByRole('button', { name: 'Treinar' })).toBeVisible();

  // --- Iniciar treino avulso ---
  await page.getByRole('button', { name: 'Treinar' }).click();
  await page.getByRole('button', { name: 'Iniciar treino avulso' }).click();

  // --- Adicionar exercício ---
  await page.getByRole('button', { name: 'Adicionar exercício' }).click();
  await page.getByPlaceholder('Buscar ou digitar exercício...').fill('Agachamento');
  await page.getByRole('button', { name: 'Agachamento', exact: true }).click();

  // --- Registrar a série: 100 × 5, concluída ---
  await page.locator('input[inputmode="decimal"]').first().fill('100');
  await page.locator('input[inputmode="numeric"]').first().fill('5');
  await page.getByRole('button', { name: 'Concluir série' }).first().click();

  // --- Finalizar (cabeçalho → folha de finalizar, #340) ---
  await page.getByRole('button', { name: 'Finalizar', exact: true }).click();
  const finish = page.getByRole('dialog', { name: 'Finalizar treino?' });
  await expect(finish).toBeVisible();
  await expect(finish.getByText('1 de 1 série concluída.')).toBeVisible();
  await finish.getByRole('button', { name: 'Finalizar treino' }).click();

  // --- Resumo da sessão ---
  await expect(page.getByText('Treino concluído')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Treino Avulso' })).toBeVisible();
  await expect(page.getByText('100×5')).toBeVisible();
  await page.getByRole('button', { name: 'Concluir', exact: true }).click();

  // --- Início mostra a sessão (título do dia, semana e último treino) ---
  await page.getByRole('button', { name: 'Início' }).click();
  await expect(page.getByRole('heading', { name: 'Treino feito hoje' })).toBeVisible();
  await expect(page.getByRole('listitem', { name: /hoje, treinou/ })).toBeVisible();
  await expect(page.getByText('Treino Avulso').first()).toBeVisible();
});
