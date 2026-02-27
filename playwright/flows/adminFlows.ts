import { expect, type Locator, type Page } from '@playwright/test';

export interface AdminRoleFormData {
  roleName: string;
  displayName: string;
  description: string;
  permissions: string[];
  isGlobal?: boolean;
}

type SwitchRole = (role: string) => Promise<void>;

async function ensureAdministratorFromInitialScreen(page: Page): Promise<void> {
  // Stabilize preview/dev entry state so tests do not depend on prior local/session storage.
  await page.addInitScript(() => {
    try {
      localStorage.setItem('hbc-dev-mode', 'mock');
      localStorage.setItem('hbc-last-seen-version', '1.0.0');
      sessionStorage.removeItem('hbc-dev-selected-role');
    } catch { /* noop */ }
  });

  await page.goto('/#/');
  await page.waitForLoadState('networkidle');

  const rolePicker = page.locator('[data-testid="role-picker"]');
  if (await rolePicker.isVisible().catch(() => false)) {
    await page.locator('[data-testid="role-option-Administrator"]').click();
    await page.locator('[data-testid="role-continue-btn"]').click();
    await page.waitForLoadState('networkidle');
  }
}

async function dismissBlockingModal(page: Page): Promise<void> {
  const modal = page.locator('[role="dialog"][aria-modal="true"]').first();
  if (await modal.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape');
    await modal.waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => undefined);
  }
}

async function setTextControlValue(control: Locator, value: string): Promise<void> {
  await control.evaluate((element, nextValue) => {
    if (element instanceof HTMLInputElement) {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      setter?.call(element, nextValue as string);
    } else if (element instanceof HTMLTextAreaElement) {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
      setter?.call(element, nextValue as string);
    }
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

export async function loginAsAdministratorAndLaunchApp(
  page: Page,
  switchRole?: SwitchRole
): Promise<void> {
  await ensureAdministratorFromInitialScreen(page);

  if (switchRole) {
    await switchRole('Administrator');
  }

  await expect(page.locator('[data-testid="role-switcher"]')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 15_000 });
}

export async function navigateToAdminRoles(page: Page): Promise<void> {
  await page.goto('/#/admin');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: /administration/i })).toBeVisible({ timeout: 15_000 });

  await page.goto('/#/admin/roles');
  await page.waitForLoadState('networkidle');

  await expect(page.getByRole('heading', { name: /role configuration/i })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('[data-testid="admin-roles-add-role-button"]')).toBeVisible({ timeout: 15_000 });
}

export async function createNewRoleFlow(page: Page, roleData: AdminRoleFormData): Promise<void> {
  await dismissBlockingModal(page);
  await page.goto('/#/admin/roles');
  await page.waitForLoadState('networkidle');
  const addRoleButton = page.locator('[data-testid="admin-roles-add-role-button"]');
  await expect(addRoleButton).toBeVisible({ timeout: 15_000 });
  await addRoleButton.dispatchEvent('click');
  const createForm = page.locator('[data-testid="admin-roles-create-form"]').last();
  await expect(createForm).toBeVisible({ timeout: 10_000 });

  await setTextControlValue(createForm.locator('[data-testid="admin-roles-input-role-name"]'), roleData.roleName);
  await setTextControlValue(createForm.locator('[data-testid="admin-roles-input-display-name"]'), roleData.displayName);
  await setTextControlValue(createForm.locator('[data-testid="admin-roles-input-description"]'), roleData.description);

  const scopeSwitch = createForm.locator('[data-testid="admin-roles-input-is-global"]');
  const shouldBeGlobal = Boolean(roleData.isGlobal);
  const currentlyGlobal = await scopeSwitch.evaluate((element) => {
    return (element as HTMLInputElement).checked;
  });
  if (currentlyGlobal !== shouldBeGlobal) {
    await scopeSwitch.dispatchEvent('click');
  }

  for (const permission of roleData.permissions) {
    const permissionToggle = createForm.locator(`[data-testid="admin-roles-permission-${permission}"]`);
    const isChecked = await permissionToggle.evaluate((element) => {
      return (element as HTMLInputElement).checked || element.getAttribute('aria-checked') === 'true';
    });
    if (!isChecked) {
      await permissionToggle.dispatchEvent('click');
    }
  }

  const saveButton = page.locator('[data-testid="admin-roles-save-button"]').last();
  await saveButton.evaluate((element) => (element as HTMLButtonElement).click());
}

export async function assertRoleCreationSuccess(page: Page, roleData: AdminRoleFormData): Promise<void> {
  const successToast = page.locator('[role="alert"]').filter({ hasText: `Role "${roleData.displayName}" created.` });
  await expect(successToast).toBeVisible({ timeout: 15_000 });

  const tableRoot = page.locator('[aria-label="HBC Data Table container"]');
  await expect(tableRoot).toBeVisible({ timeout: 10_000 });

  const roleRow = page.locator('tr', { hasText: roleData.displayName });
  await expect(roleRow).toBeVisible({ timeout: 15_000 });
  await expect(roleRow).toContainText(roleData.roleName);
}
