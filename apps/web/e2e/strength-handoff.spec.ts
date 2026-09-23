import { test, expect, type Page } from '@playwright/test';
import { encodeStrengthPayload } from '@powerlifting/shared';

// ---------------------------------------------------------------------------
// Handoff da calculadora "Quão forte você é" (issue #318): a landing manda para
// /registro#forca=<payload>; o app abre no cadastro e, criada a conta, semeia
// peso corporal e um treino de referência. Payload inválido → cadastro normal.
// Mesmo fio do golden path (web → API → Postgres), e-mail único por execução.
// ---------------------------------------------------------------------------

function uniqueEmail(): string {
  return `e2e-forca-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

async function createAccount(page: Page) {
  await page.locator('#auth-name').fill('Atleta Calculadora');
  await page.locator('#auth-email').fill(uniqueEmail());
  await page.locator('#auth-password').fill('senha-e2e-12345');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('button', { name: 'Treinar' })).toBeVisible();
}

test('cadastro vindo da calculadora semeia peso e treino de referência', async ({ page }) => {
  const payload = encodeStrengthPayload({ v: 1, sex: 'M', bw: 82, lifts: [{ lift: 'bench', kg: 110, reps: 5 }] });

  await page.goto(`/registro#forca=${payload}`);

  // Abre direto no cadastro, com a linha informativa, e a URL fica limpa.
  await expect(page.getByRole('heading', { name: 'Criar conta' })).toBeVisible();
  await expect(page.getByText('Vamos guardar seu resultado da calculadora nesta conta.')).toBeVisible();
  await expect(page).toHaveURL(/\/$/);

  await createAccount(page);

  // Dashboard: peso registrado e o treino de referência contando na semana.
  await expect(page.getByRole('button', { name: 'Ver registros de peso' })).toBeVisible();
  await expect(page.getByText('82', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('group', { name: /Sessões: 1 treinos concluídos/ })).toBeVisible();
  await page.getByText('Registro da calculadora').first().click();
  await expect(page.getByText('Supino Reto').first()).toBeVisible();
});

test('payload inválido cai no cadastro normal, sem semeadura', async ({ page }) => {
  await page.goto('/registro#forca=lixo');

  await expect(page.getByRole('heading', { name: 'Criar conta' })).toBeVisible();
  await expect(page.getByText('Vamos guardar seu resultado da calculadora nesta conta.')).toHaveCount(0);

  await createAccount(page);

  await expect(page.getByRole('group', { name: /Sessões: 0 treinos concluídos/ })).toBeVisible();
  await expect(page.getByText('Registro da calculadora')).toHaveCount(0);
});
