import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function checkLayout(page: Page) {
  const layout = await page.evaluate(() => {
    const controls = [
      ...document.querySelectorAll('header a, header button, main button, main input, main select'),
    ]
      .filter((element) => element.getClientRects().length > 0)
      .map((element) => {
        const bounds = element.getBoundingClientRect();
        return {
          label:
            element.getAttribute('aria-label') || element.textContent?.trim() || element.tagName,
          left: bounds.left,
          top: bounds.top,
          right: bounds.right,
          bottom: bounds.bottom,
          width: bounds.width,
          height: bounds.height,
        };
      });
    const overlaps: string[] = [];
    for (let firstIndex = 0; firstIndex < controls.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < controls.length; secondIndex += 1) {
        const first = controls[firstIndex];
        const second = controls[secondIndex];
        if (
          Math.min(first.right, second.right) - Math.max(first.left, second.left) > 1 &&
          Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top) > 1
        ) {
          overlaps.push(`${first.label} / ${second.label}`);
        }
      }
    }
    return {
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      smallControls: controls.filter((control) => control.width < 44 || control.height < 44),
      overlaps,
    };
  });
  expect(layout.overflow).toBe(false);
  expect(layout.smallControls).toEqual([]);
  expect(layout.overlaps).toEqual([]);
}

test('shows the Spanish public home with identified demonstration data', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'Tu fiesta, resuelta en un solo lugar.' }),
  ).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByRole('textbox', { name: 'Ciudad', exact: true })).toBeVisible();
  await expect(page.getByLabel('Fecha', { exact: true })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Servicio' })).toBeVisible();
  await expect(page.getByText(/^Datos de demostraci/)).toBeVisible();
  await expect(page.locator('article')).toHaveCount(6);
  await expect(page.getByRole('heading', { name: 'Good morning, Mariana' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Iniciar sesi\u00f3n' })).toHaveAttribute(
    'href',
    '/login',
  );
});

test('combines normalized city and service filters and resets the controls', async ({ page }) => {
  await page.goto('/');
  const city = page.getByRole('textbox', { name: 'Ciudad', exact: true });
  const service = page.getByRole('combobox', { name: 'Servicio' });

  await city.fill('  QUERE  ');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.locator('article')).toHaveCount(2);

  await service.selectOption('venues');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.locator('article')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Un espacio para reunirse' })).toBeVisible();

  await city.fill('No existe');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.locator('article')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'No encontramos opciones' })).toBeVisible();

  await page.getByRole('button', { name: 'Restablecer filtros', exact: true }).click();
  await expect(page.locator('article')).toHaveCount(6);
  await expect(city).toHaveValue('');
  await expect(service).toHaveValue('');
});

test('category shortcuts apply without submitting a draft city and synchronize the selector', async ({
  page,
}) => {
  await page.goto('/');
  const city = page.getByRole('textbox', { name: 'Ciudad', exact: true });
  const service = page.getByRole('combobox', { name: 'Servicio' });
  await city.fill('Ciudad inexistente');

  for (const [label, value, count] of [
    ['Locales', 'venues', 2],
    ['M\u00fasica', 'music', 1],
    ['Decoraci\u00f3n', 'decoration', 1],
    ['Fotograf\u00eda', 'photography', 1],
    ['Banquetes', 'catering', 1],
  ] as const) {
    const category = page.getByRole('button', { name: label, exact: true });
    await category.click();
    await expect(category).toHaveAttribute('aria-pressed', 'true');
    await expect(service).toHaveValue(value);
    await expect(page.locator('article')).toHaveCount(count);
  }

  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.locator('article')).toHaveCount(0);
});

test('keeps draft fields unapplied and treats the event date as tentative', async ({ page }) => {
  await page.goto('/');
  const city = page.getByRole('textbox', { name: 'Ciudad', exact: true });
  const date = page.getByLabel('Fecha', { exact: true });
  const service = page.getByRole('combobox', { name: 'Servicio' });

  await city.fill('MERI');
  await service.selectOption('photography');
  await expect(page.locator('article')).toHaveCount(6);
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.locator('article')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Recuerdos de tu evento' })).toBeVisible();

  await page.getByRole('button', { name: 'Restablecer filtros', exact: true }).click();
  await date.fill('2027-01-01');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.locator('article')).toHaveCount(6);
  await expect(
    page.getByText('Fecha tentativa; no indica disponibilidad confirmada.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Restablecer filtros', exact: true }).click();
  await expect(date).toHaveValue('');
});

test('favorites work with keyboard, survive filtering and reset, but disappear after reload', async ({
  page,
}) => {
  await page.goto('/');
  const save = page.getByRole('button', {
    name: 'Guardar en favoritos: Sal\u00f3n para celebrar',
    exact: true,
  });
  await save.focus();
  await save.press('Space');
  const remove = page.getByRole('button', {
    name: 'Quitar de favoritos: Sal\u00f3n para celebrar',
    exact: true,
  });
  await expect(remove).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: 'M\u00fasica', exact: true }).click();
  await expect(remove).toHaveCount(0);
  await page.getByRole('button', { name: 'Restablecer filtros', exact: true }).click();
  await expect(remove).toHaveAttribute('aria-pressed', 'true');
  await remove.focus();
  await remove.press('Enter');
  await expect(save).toHaveAttribute('aria-pressed', 'false');
  await save.click();
  await expect(remove).toHaveAttribute('aria-pressed', 'true');

  await page.reload();
  await expect(save).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('article')).toHaveCount(6);
});

test('pending actions announce their limits without navigation, API calls or storage changes', async ({
  page,
}) => {
  const applicationRequests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (
      ['fetch', 'xhr'].includes(request.resourceType()) &&
      !url.pathname.startsWith('/_next/') &&
      !url.searchParams.has('_rsc')
    ) {
      applicationRequests.push(request.url());
    }
  });
  await page.goto('/');
  const before = await page.evaluate(() => ({
    local: { ...localStorage },
    session: { ...sessionStorage },
  }));
  await page.getByRole('button', { name: 'Registrarse', exact: true }).click();
  const notice = page.getByRole('status').filter({ hasText: 'No se cre\u00f3 ninguna cuenta.' });
  await expect(notice).toBeVisible();
  await expect(notice).toHaveAttribute('aria-live', 'polite');
  await expect(notice).toHaveAttribute('aria-atomic', 'true');
  const originalMessage = await notice.locator('p').elementHandle();
  await page.getByRole('button', { name: 'Registrarse', exact: true }).click();
  await expect.poll(() => originalMessage?.evaluate((element) => element.isConnected)).toBe(false);
  await page.getByRole('button', { name: 'Ser proveedor', exact: true }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'No se envi\u00f3 ninguna solicitud.' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Locales', exact: true }).click();
  await page.getByRole('button', { name: 'Restablecer filtros', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  expect(
    await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } })),
  ).toEqual(before);
  expect(applicationRequests).toEqual([]);
});

test('keyboard navigation reaches named controls with visible focus and associated labels', async ({
  page,
}) => {
  await page.goto('/');
  for (const control of [
    page.getByRole('link', { name: 'Vibe Planners, inicio', exact: true }),
    page.getByRole('button', { name: 'Ser proveedor', exact: true }),
    page.getByRole('link', { name: 'Iniciar sesi\u00f3n', exact: true }),
    page.getByRole('button', { name: 'Registrarse', exact: true }),
    page.getByRole('textbox', { name: 'Ciudad', exact: true }),
  ]) {
    await page.keyboard.press('Tab');
    await expect(control).toBeFocused();
    expect(
      await control.evaluate((element) => {
        const style = getComputedStyle(element);
        return style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2;
      }),
    ).toBe(true);
  }
  for (const label of ['Ciudad', 'Fecha', 'Servicio']) {
    const control = page.getByLabel(label, { exact: true });
    expect(
      await control.evaluate((element) =>
        [...document.querySelectorAll('label')].some((label) => label.htmlFor === element.id),
      ),
    ).toBe(true);
  }
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
  { width: 320, height: 844 },
]) {
  test.describe(`home at ${viewport.width}px`, () => {
    test.use({ viewport });

    test('renders local photos and stable controls without overlap or overflow', async ({
      page,
    }, testInfo) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto('/');
      await page.evaluate(() => document.fonts.ready);
      const images = page.locator('article img');
      await expect(images).toHaveCount(6);
      for (const image of await images.all()) {
        await image.scrollIntoViewIfNeeded();
        await expect(image).toHaveAttribute('src', /^\/images\/home\/.+\.jpg$/);
        expect(await image.getAttribute('alt')).toBeTruthy();
        expect(
          await image.evaluate(async (element) => {
            if (!(element instanceof HTMLImageElement))
              throw new Error('Expected an image element');
            await element.decode();
            return (
              element.complete && element.naturalWidth === 960 && element.naturalHeight === 720
            );
          }),
        ).toBe(true);
      }
      await checkLayout(page);
      await page.evaluate(() => window.scrollTo(0, 0));
      const screenshotPath = testInfo.outputPath(`home-${viewport.width}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      await testInfo.attach(`home-${viewport.width}`, {
        path: screenshotPath,
        contentType: 'image/png',
      });

      const save = page.getByRole('button', {
        name: 'Guardar en favoritos: Sal\u00f3n para celebrar',
        exact: true,
      });
      await save.scrollIntoViewIfNeeded();
      const before = await save.boundingBox();
      await save.click();
      const remove = page.getByRole('button', {
        name: 'Quitar de favoritos: Sal\u00f3n para celebrar',
        exact: true,
      });
      await expect(remove).toHaveAttribute('aria-pressed', 'true');
      expect(await remove.boundingBox()).toEqual(before);
      await checkLayout(page);
      expect(errors).toEqual([]);
    });
  });
}

test('an image failing before hydration still shows its fallback and supports favorites', async ({
  page,
}) => {
  let releaseScripts: (() => void) | undefined;
  const scriptsReady = new Promise<void>((resolve) => {
    releaseScripts = resolve;
  });
  await page.route('**/*', async (route) => {
    if (new URL(route.request().url()).pathname === '/images/home/venue.jpg') return route.abort();
    if (route.request().resourceType() === 'script') await scriptsReady;
    await route.continue();
  });
  await page.goto('/', { waitUntil: 'commit' });
  const listing = page.locator('article').first();
  try {
    await listing.locator('img').scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        listing
          .locator('img')
          .evaluate(
            (image) =>
              image instanceof HTMLImageElement && image.complete && image.naturalWidth === 0,
          ),
      )
      .toBe(true);
  } finally {
    releaseScripts?.();
  }
  await expect(listing.getByText('Imagen no disponible')).toBeVisible();
  await expect(
    listing.getByRole('img', {
      name: 'Sal\u00f3n de eventos con mesas redondas y sillas preparadas para invitados',
    }),
  ).toBeVisible();
  await listing.getByRole('button', { name: /^Guardar en favoritos:/ }).click();
  await expect(listing.getByRole('button', { name: /^Quitar de favoritos:/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.locator('article')).toHaveCount(6);
});

test('Jakarta loads locally with all three weights and has a readable blocked-font fallback', async ({
  page,
  baseURL,
}) => {
  const fonts: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'font') fonts.push(request.url());
  });
  await page.goto('/');
  const weights = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts]
      .filter((font) => font.family === 'Plus Jakarta Sans' && font.status === 'loaded')
      .map((font) => font.weight);
  });
  expect(weights).toEqual(expect.arrayContaining(['400', '600', '800']));
  expect(fonts.length).toBeGreaterThan(0);
  expect(fonts.every((url) => new URL(url).origin === new URL(baseURL!).origin)).toBe(true);

  await page.route('**/*', (route) =>
    route.request().resourceType() === 'font' ? route.abort() : route.continue(),
  );
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Tu fiesta, resuelta en un solo lugar.' }),
  ).toBeVisible();
  expect(
    await page.evaluate(async () => {
      await document.fonts.ready;
      return [...document.fonts].some(
        (font) => font.family === 'Plus Jakarta Sans Fallback' && font.status === 'loaded',
      );
    }),
  ).toBe(true);
  await page.getByRole('button', { name: 'Locales', exact: true }).click();
  await expect(page.locator('article')).toHaveCount(2);
  await checkLayout(page);
});

test('rendered text, placeholders and control indicators meet contrast requirements', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Locales', exact: true }).click();
  await page.getByRole('button', { name: 'Registrarse', exact: true }).click();
  const measurements = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas color conversion unavailable');
    function color(value: string) {
      context!.clearRect(0, 0, 1, 1);
      context!.fillStyle = value;
      context!.fillRect(0, 0, 1, 1);
      const channels = [...context!.getImageData(0, 0, 1, 1).data];
      return [channels[0], channels[1], channels[2], channels[3] / 255];
    }
    function blend(foreground: number[], background: number[]) {
      return foreground
        .slice(0, 3)
        .map((channel, index) => channel * foreground[3] + background[index] * (1 - foreground[3]))
        .concat(1);
    }
    function background(element: Element | null): number[] {
      if (!element) return [255, 255, 255, 1];
      return blend(
        color(getComputedStyle(element).backgroundColor),
        background(element.parentElement),
      );
    }
    function luminance(channels: number[]) {
      const linear = channels.slice(0, 3).map((channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    }
    function contrast(first: number[], second: number[]) {
      const firstLuminance = luminance(first);
      const secondLuminance = luminance(second);
      return (
        (Math.max(firstLuminance, secondLuminance) + 0.05) /
        (Math.min(firstLuminance, secondLuminance) + 0.05)
      );
    }
    return [
      ...document.querySelectorAll(
        'header a, header button, main h1, main h2, main h3, main p, main label, main input, main select, main button, [role="status"] p',
      ),
    ]
      .filter((element) => element.getClientRects().length > 0)
      .map((element) => {
        const style = getComputedStyle(element);
        const surface = background(element);
        const foreground = blend(color(style.color), surface);
        const fontSize = parseFloat(style.fontSize);
        const large = fontSize >= 24 || (fontSize >= 18.666 && parseFloat(style.fontWeight) >= 700);
        const textRatio = contrast(foreground, surface);
        const placeholder = element.hasAttribute('placeholder')
          ? contrast(
              blend(color(getComputedStyle(element, '::placeholder').color), surface),
              surface,
            )
          : null;
        const isControl = ['A', 'BUTTON', 'INPUT', 'SELECT'].includes(element.tagName);
        const controlRatio = isControl
          ? Math.max(
              textRatio,
              contrast(surface, background(element.parentElement)),
              parseFloat(style.borderWidth) > 0
                ? contrast(blend(color(style.borderColor), surface), surface)
                : 0,
            )
          : null;
        return {
          label:
            element.getAttribute('aria-label') || element.textContent?.trim() || element.tagName,
          textRatio,
          minimum: large ? 3 : 4.5,
          placeholder,
          controlRatio,
        };
      });
  });
  await testInfo.attach('contrast-measurements', {
    body: JSON.stringify(measurements, null, 2),
    contentType: 'application/json',
  });
  expect(
    measurements.filter(
      (item) =>
        item.textRatio < item.minimum ||
        (item.placeholder !== null && item.placeholder < 4.5) ||
        (item.controlRatio !== null && item.controlRatio < 3),
    ),
  ).toEqual([]);
});

for (const [route, heading] of [
  ['/login', 'Welcome back'],
  ['/dashboard', 'Event timeline'],
  ['/account', 'Your account'],
] as const) {
  test(`preserves the existing English view at ${route}`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response?.ok()).toBe(true);
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    await expect(page.locator('main')).toHaveAttribute('lang', 'en');
    const homeLink =
      route === '/login'
        ? page.getByRole('link', { name: 'Return to overview', exact: true })
        : page.getByRole('link', { name: 'Vibe Planners', exact: true });
    await expect(homeLink).toHaveAttribute('href', '/');
  });
}
