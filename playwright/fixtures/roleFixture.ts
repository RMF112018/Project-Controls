import { test as base } from '@playwright/test';

/**
 * Maps test-level role keys to RoleName enum values used by HeaderUserMenu's
 * MenuItemRadio labels. Must stay in sync with RoleName in enums.ts and the
 * ROLE_OPTIONS array in dev/index.tsx.
 */
const ROLE_SELECT_LABELS: Record<string, string> = {
  ExecutiveLeadership: 'Leadership',
  IDS: 'IDS Manager',
  DepartmentDirector: 'Preconstruction Manager',
  SharePointAdmin: 'Administrator',
  OperationsTeam: 'Commercial Operations Manager',
  EstimatingCoordinator: 'Estimator',
  BDRepresentative: 'Business Development Manager',
  AccountingManager: 'Accounting Manager',
  Legal: 'Risk Manager',
  Marketing: 'Marketing Manager',
  QualityControl: 'Quality Control Manager',
  Safety: 'Safety Manager',
  RiskManagement: 'Risk Manager',
  SuperAdmin: 'Administrator',
};

type RoleFixture = {
  switchRole: (role: string) => Promise<void>;
};

export const test = base.extend<RoleFixture>({
  switchRole: async ({ page }, use) => {
    // Bypass MockAuthScreen by pre-seeding the session role (dev/index.tsx reads
    // sessionStorage['hbc-dev-selected-role'] to skip the initial role picker).
    // Bypass WhatsNewModal by pre-seeding the version key it checks
    // (WhatsNewModal.tsx STORAGE_KEY contract).
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem('hbc-dev-selected-role', 'Administrator');
        localStorage.setItem('hbc-last-seen-version', '1.0.0');
      } catch { /* noop */ }
    });

    const switchRole = async (role: string) => {
      const label = ROLE_SELECT_LABELS[role] ?? role;
      // Defensive fallback: dismiss any aria-modal overlay (e.g. WhatsNewModal)
      // that may intercept pointer events on the role-switcher trigger.
      const modal = page.locator('[role="dialog"][aria-modal="true"]');
      if (await modal.isVisible()) {
        await page.keyboard.press('Escape');
        await modal.waitFor({ state: 'hidden', timeout: 2_000 });
      }
      // Open the header user menu (consolidated from floating RoleSwitcher)
      const trigger = page.locator('[data-testid="role-switcher"]');
      await trigger.waitFor({ state: 'visible', timeout: 15_000 });
      await trigger.click();
      // Click the matching role menu item radio
      const roleItem = page.getByRole('menuitemradio', { name: label });
      await roleItem.waitFor({ state: 'visible', timeout: 5_000 });
      await roleItem.click();
      // Wait for the app to remount with the new role
      await page.waitForTimeout(500);
      await page.waitForLoadState('networkidle');
    };
    await use(switchRole);
  },
});

export { expect } from '@playwright/test';
