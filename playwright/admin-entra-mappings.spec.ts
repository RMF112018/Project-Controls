import { test, expect } from './fixtures/roleFixture';

test.describe('Admin Entra mappings', () => {
  test('loads the Entra mapping page and keeps Apply disabled in preview mode', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('SuperAdmin');

    await page.goto('/#/admin/entra-mappings');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Entra ID Role Mapping' })).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-testid="entra-mappings-search"]')).toBeVisible();
    await expect(page.locator('[data-testid="entra-mappings-principal-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="entra-mappings-role-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="entra-mappings-apply"]')).toBeDisabled();
    await expect(page.locator('text=Preview mode is active')).toBeVisible();
  });
});
