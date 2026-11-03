import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function fillRegistration(
  page: Page,
  email: string,
  organization = 'Estudio de prueba',
  phone = '+525512345678',
) {
  await page.getByLabel('Nombre de la organización').fill(organization);
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Teléfono en formato internacional').fill(phone);
  await page.getByLabel('Contraseña').fill('correct-password');
}

test('registers a verified provider and creates an organization without exposing tokens', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Ser proveedor' }).click();
  await expect(page).toHaveURL(/\/register$/);
  await fillRegistration(
    page,
    'provider-register@example.test',
    'Estudio de prueba',
    '+525512345678',
  );

  const registrationResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/session/registration') &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  const registrationResponse = await registrationResponsePromise;
  expect(registrationResponse.status()).toBe(201);
  const registrationBody = await registrationResponse.json();
  expect(registrationBody).toMatchObject({
    emailVerificationChallengeId: expect.stringMatching(/^[0-9a-f-]{36}$/i),
  });
  expect(registrationBody.accessToken).toBeUndefined();
  expect(registrationBody.refreshToken).toBeUndefined();
  expect((await context.cookies()).some(({ name }) => name === 'vp_access_token')).toBe(false);
  await expect(page.getByRole('status')).toHaveText(
    'Te enviamos códigos de verificación por correo y SMS.',
  );

  await page.getByLabel('Código enviado por correo').fill('123456');
  await page.getByLabel('Código enviado por SMS').fill('123456');
  await page.getByRole('button', { name: 'Verificar y continuar' }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
  await expect(page.getByText('Estudio de prueba')).toBeVisible();

  const cookies = await context.cookies();
  expect(cookies.find(({ name }) => name === 'vp_access_token')).toMatchObject({ httpOnly: true });
  expect(cookies.find(({ name }) => name === 'vp_refresh_token')).toMatchObject({ httpOnly: true });
  expect(cookies.find(({ name }) => name === 'vp_active_tenant_id')?.value).toMatch(
    /^[0-9a-f-]{36}$/i,
  );
  expect(
    await page.evaluate(() => ({
      local: Object.keys(localStorage),
      session: Object.keys(sessionStorage),
    })),
  ).toEqual({ local: [], session: [] });
});

test('resumes partial verification after reload and can resend both codes', async ({ page }) => {
  await page.goto('/register');
  await fillRegistration(
    page,
    'provider-resume@example.test',
    'Estudio retomable',
    '+525512345679',
  );
  await page.getByRole('button', { name: 'Crear cuenta' }).click();

  await page.getByRole('button', { name: 'Reenviar código por correo' }).click();
  await expect(page.getByRole('status')).toHaveText(
    'Si la cuenta puede recibir el correo, se enviará un nuevo código.',
  );
  await page.getByRole('button', { name: 'Reenviar código SMS' }).click();
  await expect(page.getByRole('status')).toHaveText(
    'Si el teléfono puede recibir el código, se enviará un nuevo SMS.',
  );

  await page.getByLabel('Código enviado por correo').fill('123456');
  await page.getByLabel('Código enviado por SMS').fill('000000');
  await page.getByRole('button', { name: 'Verificar y continuar' }).click();
  await expect(page.locator('p[role="alert"]')).toHaveText('Invalid or expired challenge');
  await expect(page.getByText('Correo verificado')).toBeVisible();

  await page.reload();
  await expect(page.getByText('Correo verificado')).toBeVisible();
  await fillRegistration(
    page,
    'provider-resume@example.test',
    'Estudio retomable',
    '+525512345679',
  );
  await page.getByLabel('Código enviado por SMS').fill('123456');
  await page.getByRole('button', { name: 'Verificar y continuar' }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
  await expect(page.getByText('Estudio retomable')).toBeVisible();
});

test('keeps the session and lets the provider retry organization creation', async ({
  page,
  context,
}) => {
  let organizationAttempts = 0;
  await page.route('**/api/session/registration/organization', async (route) => {
    organizationAttempts += 1;
    if (organizationAttempts === 1) {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Servicio temporalmente no disponible.' }),
      });
      return;
    }
    await route.continue();
  });

  await page.goto('/register');
  await fillRegistration(
    page,
    'provider-retry@example.test',
    'Estudio reintentable',
    '+525512345680',
  );
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await page.getByLabel('Código enviado por correo').fill('123456');
  await page.getByLabel('Código enviado por SMS').fill('123456');
  await page.getByRole('button', { name: 'Verificar y continuar' }).click();

  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
  await expect(
    page.getByRole('heading', { name: 'No tienes una organización proveedora' }),
  ).toBeVisible();
  expect((await context.cookies()).some(({ name }) => name === 'vp_access_token')).toBe(true);
  await page.getByLabel('Nombre de la organización').fill('Estudio reintentable');
  await page.getByRole('button', { name: 'Crear organización' }).click();
  await expect(page.getByText('Estudio reintentable')).toBeVisible();
  expect(organizationAttempts).toBe(2);
});

test('rejects invalid origins and reports duplicate provider registrations', async ({
  page,
  request,
}) => {
  const invalidOrigin = await request.post('http://127.0.0.1:3100/api/session/registration', {
    headers: { Origin: 'https://attacker.example' },
    data: {
      email: 'provider-duplicate@example.test',
      phone: '+525512345678',
      password: 'correct-password',
    },
  });
  expect(invalidOrigin.status()).toBe(403);

  await page.goto('/register');
  await fillRegistration(
    page,
    'provider-duplicate@example.test',
    'Estudio duplicado',
    '+525512345681',
  );
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page.getByRole('status')).toBeVisible();
  await page.evaluate(() => sessionStorage.clear());
  await page.goto('/register');
  await fillRegistration(
    page,
    'provider-duplicate@example.test',
    'Estudio duplicado',
    '+525512345681',
  );
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page.locator('p[role="alert"]')).toHaveText('Email or phone is already registered');
});
