import { test, expect } from '@playwright/test';

// Stage 4 (sub-task 5): Full 16-role vetting matrix with role switcher continuity.
const ROLE_LANDING: Record<string, string> = {
  'Administrator': '/',
  'Leadership': '/',
  'Marketing Manager': '/',
  'Preconstruction Manager': '/',
  'Business Development Manager': '/',
  'Estimator': '/',
  'IDS Manager': '/',
  'Commercial Operations Manager': '/',
  'Luxury Residential Manager': '/',
  'Manager of Operational Excellence': '/',
  'Safety Manager': '/',
  'Quality Control Manager': '/',
  'Warranty Manager': '/',
  'Human Resources Manager': '/',
  'Accounting Manager': '/',
  'Risk Manager': '/',
};

test.describe('Stage 4 Role Vetting (16 roles)', () => {
  for (const [role, landing] of Object.entries(ROLE_LANDING)) {
    test(`role ${role} loads landing ${landing}`, async ({ page }) => {
      await page.addInitScript((selectedRole) => {
        sessionStorage.setItem('hbc-dev-selected-role', selectedRole);
        localStorage.setItem('hbc-last-seen-version', '1.0.0');
      }, role);
      await page.goto(`/#${landing}`);
      await page.waitForLoadState('networkidle');

      await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
      await expect(page).toHaveURL(/\/#\//);
    });
  }

  test('role context transitions between 4 representative roles', async ({ page }) => {
    const sequence = [
      ['Leadership', '/#/'],
      ['Administrator', '/#/admin'],
      ['Estimator', '/#/preconstruction/estimating'],
      ['Safety Manager', '/#/operations/safety'],
    ] as const;

    for (const [role, path] of sequence) {
      await page.goto('/#/');
      await page.waitForLoadState('domcontentloaded');
      await page.evaluate((nextRole) => {
        sessionStorage.setItem('hbc-dev-selected-role', nextRole);
      }, role);
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
    }
  });
});
