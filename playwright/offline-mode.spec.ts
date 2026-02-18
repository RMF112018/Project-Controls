import { test, expect } from '@playwright/test';

test.describe('Offline monitor', () => {
  test('shows offline warning and recovery toast', async ({ page, context }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');

    await context.setOffline(true);
    await expect(page.getByRole('alert').filter({ hasText: /you are offline/i })).toBeVisible({ timeout: 10_000 });

    await context.setOffline(false);
    await expect(page.getByRole('alert').filter({ hasText: /back online/i })).toBeVisible({ timeout: 10_000 });
  });
});
