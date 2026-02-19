import { test, expect } from './fixtures/roleFixture';

test.describe('TanStack Table Wave 2 — pipeline + estimating parity', () => {
  test('pipeline route renders tanstack-backed tables and supports sort interaction', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('SuperAdmin');

    await page.goto('/#/preconstruction/pipeline');
    await page.waitForLoadState('networkidle');

    const pipelineTable = page.locator('[data-table-engine="tanstack"]').first();
    await expect(pipelineTable).toBeVisible({ timeout: 10_000 });

    const projectHeader = page.getByRole('columnheader', { name: /project/i }).first();
    await expect(projectHeader).toBeVisible();
    await projectHeader.focus();
    await page.keyboard.press('Enter');
    await expect(projectHeader).toHaveAttribute('aria-sort', /ascending|descending/);

    await page.goto('/#/preconstruction/pipeline/gonogo');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-table-engine="tanstack"]').first()).toBeVisible({ timeout: 10_000 });
  });

  test('estimating route renders tanstack-backed table blocks across tabs', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('EstimatingCoordinator');

    await page.goto('/#/preconstruction');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-table-engine="tanstack"]').first()).toBeVisible({ timeout: 10_000 });

    await page.goto('/#/preconstruction/precon-tracker');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-table-engine="tanstack"]').first()).toBeVisible({ timeout: 10_000 });

    await page.goto('/#/preconstruction/estimate-log');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-table-engine="tanstack"]').first()).toBeVisible({ timeout: 10_000 });
  });
});
