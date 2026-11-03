import { expect, test } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';

const identityApiUrl = 'http://127.0.0.1:3101';

async function resetUser(request: APIRequestContext, userId: string) {
  await request.post(`${identityApiUrl}/__test/reset`, { data: { userId } });
}

async function fakeApiState(request: APIRequestContext, userId: string) {
  const response = await request.get(
    `${identityApiUrl}/__test/state?userId=${encodeURIComponent(userId)}`,
  );
  return response.json() as Promise<Record<string, number>>;
}

test('requires a valid session before rendering the provider dashboard', async ({ page }) => {
  await page.goto('/dashboard');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Inicia sesión' })).toBeVisible();
});

test('signs in securely and lets a provider select and switch organizations', async ({
  page,
  context,
  request,
}) => {
  await resetUser(request, 'owner-user');
  await page.goto('/login');

  await page.getByLabel('Correo electrónico').fill('owner@example.test');
  await page.getByLabel('Contraseña').fill('wrong-password');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.locator('p[role="alert"]')).toHaveText('Invalid credentials');
  expect((await context.cookies()).some(({ name }) => name === 'vp_access_token')).toBe(false);

  await page.getByLabel('Contraseña').fill('correct-password');
  const loginResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/session/login') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  const loginResponse = await loginResponsePromise;
  expect(await loginResponse.json()).toEqual({ authenticated: true });
  await expect(page).toHaveURL(/\/dashboard$/);

  const cookies = await context.cookies();
  const accessCookie = cookies.find(({ name }) => name === 'vp_access_token');
  const refreshCookie = cookies.find(({ name }) => name === 'vp_refresh_token');
  expect(accessCookie).toMatchObject({ httpOnly: true, sameSite: 'Lax' });
  expect(refreshCookie).toMatchObject({ httpOnly: true, sameSite: 'Lax' });

  const organizationSelect = page.getByLabel('Organización activa');
  await expect(organizationSelect).toBeVisible();
  await expect(organizationSelect).toHaveValue('');
  await organizationSelect.selectOption('11111111-1111-4111-8111-111111111111');
  await expect(organizationSelect).toHaveValue('11111111-1111-4111-8111-111111111111');
  await organizationSelect.selectOption('22222222-2222-4222-8222-222222222222');
  await expect(organizationSelect).toHaveValue('22222222-2222-4222-8222-222222222222');

  const invalidSelection = await page.request.post('/api/session/organization', {
    headers: { Origin: 'http://127.0.0.1:3100' },
    data: { tenantId: '66666666-6666-4666-8666-666666666666' },
  });
  expect(invalidSelection.status()).toBe(403);

  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect((await context.cookies()).some(({ name }) => name.startsWith('vp_'))).toBe(false);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);
});

test('selects the only organization and recovers once from an expired access token', async ({
  page,
  context,
  request,
}) => {
  await resetUser(request, 'refresh-user');
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill('refresh@example.test');
  await page.getByLabel('Contraseña').fill('correct-password');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();

  await expect(page.getByText('Decoración Viva')).toBeVisible();
  expect((await context.cookies()).find(({ name }) => name === 'vp_active_tenant_id')?.value).toBe(
    '44444444-4444-4444-8444-444444444444',
  );
  const state = await fakeApiState(request, 'refresh-user');
  expect(state.refresh).toBe(1);
  expect(state.organizations).toBeGreaterThanOrEqual(3);
});

test('clears session cookies and explains when refresh fails', async ({
  page,
  context,
  request,
}) => {
  await resetUser(request, 'refresh-fail-user');
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill('refresh-fail@example.test');
  await page.getByLabel('Contraseña').fill('correct-password');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();

  await expect(page).toHaveURL(/\/login\?error=session-expired$/);
  await expect(page.getByRole('status')).toHaveText(
    'Tu sesión expiró o ya no es válida. Inicia sesión nuevamente.',
  );
  expect((await context.cookies()).some(({ name }) => name.startsWith('vp_'))).toBe(false);
  expect((await fakeApiState(request, 'refresh-fail-user')).refresh).toBe(1);
});

test('clears stale session cookies when no refresh token is available', async ({
  page,
  context,
  request,
}) => {
  await resetUser(request, 'stale-cookie-user');
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill('stale-cookie@example.test');
  await page.getByLabel('Contraseña').fill('correct-password');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await context.clearCookies({ name: 'vp_refresh_token' });
  const response = await page.request.post('/api/session/refresh', {
    headers: { Origin: 'http://127.0.0.1:3100' },
    data: {},
  });

  expect(response.status()).toBe(401);
  expect((await context.cookies()).some(({ name }) => name.startsWith('vp_'))).toBe(false);
});

test('completes TOTP before establishing the session', async ({ page, context, request }) => {
  await resetUser(request, 'totp-user');
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill('totp@example.test');
  await page.getByLabel('Contraseña').fill('correct-password');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();

  await expect(page.getByRole('heading', { name: 'Verificación en dos pasos' })).toBeVisible();
  expect((await context.cookies()).some(({ name }) => name === 'vp_access_token')).toBe(false);
  expect((await context.cookies()).some(({ name }) => name === 'vp_2fa_challenge')).toBe(true);

  await page.getByLabel('Código de verificación').fill('000000');
  await page.getByRole('button', { name: 'Verificar y continuar' }).click();
  await expect(page.locator('p[role="alert"]')).toHaveText('Invalid two-factor code');
  expect((await context.cookies()).some(({ name }) => name === 'vp_access_token')).toBe(false);

  await page.getByLabel('Código de verificación').fill('123456');
  await page.getByRole('button', { name: 'Verificar y continuar' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText('Eventos TOTP')).toBeVisible();
  expect((await context.cookies()).some(({ name }) => name === 'vp_2fa_challenge')).toBe(false);
  expect((await context.cookies()).some(({ name }) => name === 'vp_access_token')).toBe(true);
});

test('explains missing organization access and allows sign-out', async ({ page, request }) => {
  await resetUser(request, 'no-org-user');
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill('no-org@example.test');
  await page.getByLabel('Contraseña').fill('correct-password');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();

  await expect(
    page.getByRole('heading', { name: 'No tienes una organización proveedora' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test('rejects state-changing requests with a foreign origin', async ({ request }) => {
  await resetUser(request, 'origin-user');
  const response = await request.post('http://127.0.0.1:3100/api/session/login', {
    headers: { Origin: 'https://attacker.example' },
    data: { email: 'owner@example.test', password: 'correct-password' },
  });
  expect(response.status()).toBe(403);
  expect(await fakeApiState(request, 'origin-user')).toEqual({});
});
