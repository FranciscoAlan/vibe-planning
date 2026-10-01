import { expect, test } from '@playwright/test';

test('shows the planner overview', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Good morning, Mariana' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'New event' })).toBeVisible();
});
