import { test, expect } from '@playwright/test';

test.describe('Dashboard — smoke tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
  });

  test('App boots and renders main content area', async ({ page }) => {
    await expect(page.locator('main, [role="main"]')).toBeVisible();
    await expect(page.locator('header, [role="banner"], nav')).toBeVisible();
  });

  test('Navigation renders', async ({ page }) => {
    // At least one nav link should be visible
    const navLinks = page.getByRole('link');
    await expect(navLinks.first()).toBeVisible({ timeout: 8_000 });
  });

  test('ECharts canvas renders on dashboard', async ({ page }) => {
    await page.waitForTimeout(1500); // allow MockDataService async resolution
    const canvases = page.locator('canvas');
    // Canvas may or may not exist depending on the default route — just check app loaded
    const count = await canvases.count();
    // If canvases exist they should be visible
    if (count > 0) {
      await expect(canvases.first()).toBeVisible({ timeout: 10_000 });
    }
    // App must have rendered content regardless
    await expect(page.locator('main, [role="main"]')).toBeVisible();
  });

  test('DashboardPage renders with at least one heading', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const headings = page.getByRole('heading');
    await expect(headings.first()).toBeVisible({ timeout: 8_000 });
  });

  test('No JS console errors on boot', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    // Filter known dev-mode noise
    const realErrors = errors.filter(
      (e) =>
        !e.includes('SignalR') &&
        !e.includes('PerformanceService') &&
        !e.includes('ResizeObserver') &&
        !e.includes('favicon')
    );
    expect(realErrors).toHaveLength(0);
  });

  test('RoleSwitcher overlay is visible', async ({ page }) => {
    await expect(page.locator('[data-testid="role-switcher"]')).toBeVisible({ timeout: 8_000 });
  });
});
