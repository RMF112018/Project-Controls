import { test as base } from '@playwright/test';

/**
 * Role labels matching the ROLE_OPTIONS in dev/index.tsx.
 * These must match the MenuItemRadio text content exactly.
 */
const ROLE_SELECT_LABELS: Record<string, string> = {
  ExecutiveLeadership: 'President / VP Operations',
  IDS: 'OpEx Manager',
  DepartmentDirector: 'Department Director',
  SharePointAdmin: 'SharePoint Admin',
  OperationsTeam: 'Project Executive',
  EstimatingCoordinator: 'Estimating Coordinator',
  BDRepresentative: 'BD Representative',
  AccountingManager: 'Accounting Controller',
  Legal: 'Legal / Risk Manager',
  Marketing: 'Marketing',
  QualityControl: 'Quality Control',
  Safety: 'Safety',
  RiskManagement: 'Read-Only Observer',
  SuperAdmin: '\u26A1 DEV: Super-Admin',
};

type RoleFixture = {
  switchRole: (role: string) => Promise<void>;
};

export const test = base.extend<RoleFixture>({
  switchRole: async ({ page }, use) => {
    const switchRole = async (role: string) => {
      const label = ROLE_SELECT_LABELS[role] ?? role;
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
