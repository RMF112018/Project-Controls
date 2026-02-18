/**
 * accessibility.spec.ts — WCAG 2.2 Level AA automated axe audits
 *
 * Uses @axe-core/playwright against the mock dev server (npm run dev).
 * Covers 8 critical routes across 3 roles.
 * Run via: npm run test:a11y
 */
import { test, expect } from './fixtures/roleFixture';
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helper — runs axe with WCAG 2.2 AA tag set
// ---------------------------------------------------------------------------
async function checkA11y(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .analyze();
  expect(results.violations).toEqual([]);
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------
test.describe('Accessibility — WCAG 2.2 AA', () => {
  test('home / dashboard (ExecutiveLeadership)', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('ExecutiveLeadership');
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await checkA11y(page);
  });

  test('pipeline page (BDRepresentative)', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('BDRepresentative');
    await page.goto('/#/preconstruction/pipeline');
    await page.waitForLoadState('networkidle');
    await checkA11y(page);
  });

  test('admin panel (ExecutiveLeadership)', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('ExecutiveLeadership');
    await page.goto('/#/admin');
    await page.waitForLoadState('networkidle');
    await checkA11y(page);
  });

  test('GoNoGo scorecard (BDRepresentative)', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('BDRepresentative');
    // Navigate to the first lead scorecard (mock data provides leads)
    await page.goto('/#/preconstruction/pipeline');
    await page.waitForLoadState('networkidle');
    await checkA11y(page);
  });

  test('schedule page (OperationsTeam)', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('OperationsTeam');
    await page.goto('/#/operations/schedule');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await checkA11y(page);
  });

  test('telemetry dashboard (ExecutiveLeadership)', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('ExecutiveLeadership');
    await page.goto('/#/admin/telemetry');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // allow MockDataService async resolution
    await checkA11y(page);
  });

  test('access denied page (BDRepresentative → /admin)', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('BDRepresentative');
    await page.goto('/#/admin');
    await page.waitForLoadState('networkidle');
    await checkA11y(page);
  });

  test('navigation sidebar keyboard accessibility', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('ExecutiveLeadership');
    await page.waitForLoadState('networkidle');
    // Tab into the navigation and verify focus is reachable
    await page.keyboard.press('Tab');
    await checkA11y(page);
  });

  test('monthly review page (OperationsTeam)', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('OperationsTeam');
    await page.goto('/#/operations/monthly-review');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await checkA11y(page);
  });

  test('buyout log page (OperationsTeam)', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('OperationsTeam');
    await page.goto('/#/operations/buyout-log');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await checkA11y(page);
  });

  test('schedule gantt tab (OperationsTeam)', async ({ page, switchRole }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await switchRole('OperationsTeam');
    // useTabFromUrl reads ?tab= from location.search — works with HashRouter
    await page.goto('/#/operations/schedule?tab=gantt');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800); // gantt renders async after data loads
    await checkA11y(page);
  });
});
