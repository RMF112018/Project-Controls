import { test as base } from '@playwright/test';

/**
 * Role labels matching the actual ROLE_OPTIONS in dev/RoleSwitcher.tsx.
 * These must match the <option> label text exactly.
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
  SuperAdmin: '⚡ DEV: Super-Admin',
};

type RoleFixture = {
  switchRole: (role: string) => Promise<void>;
};

export const test = base.extend<RoleFixture>({
  switchRole: async ({ page }, use) => {
    const switchRole = async (role: string) => {
      const label = ROLE_SELECT_LABELS[role] ?? role;
      // RoleSwitcher is a fixed-position overlay — uses data-testid="role-switcher"
      const select = page.locator('[data-testid="role-switcher"] select').first();
      await select.waitFor({ state: 'visible', timeout: 15_000 });
      await select.selectOption({ label });
      // Wait for the app to re-render with the new role
      await page.waitForTimeout(500);
      await page.waitForLoadState('networkidle');
    };
    await use(switchRole);
  },
});

export { expect } from '@playwright/test';
