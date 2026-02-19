import { test, expect } from './fixtures/roleFixture';

test.describe('Prompt 5 migration — estimating + project overview interactions', () => {
  test('estimating dashboard route renders migrated table surface', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('SuperAdmin');

    await page.goto('/#/preconstruction');
    await page.waitForLoadState('networkidle');

    const hbcTable = page.locator('[data-component="HbcDataTable"]').first();
    const tanstackTable = page.locator('[data-table-engine="tanstack"]').first();
    const table = await hbcTable.count() ? hbcTable : tanstackTable;
    await expect(table).toBeVisible({ timeout: 10_000 });

    const projectHeader = page.getByRole('columnheader', { name: /project/i }).first();
    await expect(projectHeader).toBeVisible();
    await projectHeader.focus();
    await page.keyboard.press('Enter');
    await expect(projectHeader).toHaveAttribute('aria-sort', /ascending|descending/);
    await expect(table).toBeVisible();
  });

  test('operations dashboard keeps view-mode toggle and table shell available', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('SuperAdmin');

    await page.goto('/#/operations');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /Active Projects Portfolio/i })).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: 'Data Mart' }).click();
    await expect(page.getByRole('heading', { name: /Data Mart View/i })).toBeVisible({ timeout: 10_000 });

    await expect(page.getByRole('button', { name: 'Sync All' })).toBeVisible();

  });
});
