import { expect, test } from './fixtures/roleFixture';
import {
  assertRoleCreationSuccess,
  createNewRoleFlow,
  loginAsAdministratorAndLaunchApp,
  navigateToAdminRoles,
  type AdminRoleFormData,
} from './flows/adminFlows';

test.describe('Admin role creation flow', () => {
  test('creates a new role through modular flow scripts', async ({ page, switchRole, bootstrapAdminSession }) => {
    test.setTimeout(90_000);

    const uniqueSuffix = Date.now();
    const roleData: AdminRoleFormData = {
      roleName: `RegionalOpsManager${uniqueSuffix}`,
      displayName: `Regional Operations Manager ${uniqueSuffix}`,
      description: 'Role for regional operations oversight and admin governance.',
      permissions: ['manage-roles', 'manage-permissions', 'view-audit-log'],
      isGlobal: true,
    };

    let rowCountBefore = 0;

    await test.step('Launch app and bootstrap Administrator session', async () => {
      await bootstrapAdminSession();
      await loginAsAdministratorAndLaunchApp(page, switchRole);
      await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10_000 });
    });

    await test.step('Navigate to Roles section from Admin area', async () => {
      await navigateToAdminRoles(page);
      rowCountBefore = await page.locator('tbody tr').count();
    });

    await test.step('Create role with permission matrix selections', async () => {
      await createNewRoleFlow(page, roleData);
    });

    await test.step('Verify role creation and refreshed role list state', async () => {
      await assertRoleCreationSuccess(page, roleData);

      const rowCountAfter = await page.locator('tbody tr').count();
      expect(rowCountAfter).toBeGreaterThanOrEqual(rowCountBefore);
      await expect(page.locator('tbody tr', { hasText: roleData.displayName })).toBeVisible({ timeout: 15_000 });
    });
  });
});
