import { test, expect } from './fixtures/roleFixture';

/**
 * Permission Matrix — 6-Role Workspace Access E2E Test Suite
 *
 * Validates workspace-level RBAC enforcement across the 6 canonical roles
 * mapped through the roleFixture. Each role is tested against every workspace
 * for both positive access and denial scenarios.
 *
 * Role-to-fixture mapping (from workspaceConfig.ts WORKSPACE_CONFIGS):
 * ┌─────────────────────────┬──────────────────────┬──────────────────────────────────────────────────┐
 * │ Canonical Role          │ Fixture Key          │ Expected Workspaces                              │
 * ├─────────────────────────┼──────────────────────┼──────────────────────────────────────────────────┤
 * │ Admin (SuperAdmin)      │ SuperAdmin           │ All 6                                            │
 * │ Leadership              │ ExecutiveLeadership  │ All 6                                            │
 * │ Project Manager         │ OperationsTeam       │ hub, preconstruction, operations, shared, site   │
 * │ Project Executive       │ DepartmentDirector   │ hub, operations, shared-services, site-control   │
 * │ BDM                     │ BDRepresentative     │ hub, preconstruction, shared-services             │
 * │ Estimating Coordinator  │ EstimatingCoordinator│ hub, preconstruction                             │
 * └─────────────────────────┴──────────────────────┴──────────────────────────────────────────────────┘
 *
 * Hub (/) is unrestricted (roles: []). Project Hub requires a project selection
 * and is not tested here (separate concern).
 */

// ─── Helpers ────────────────────────────────────────────────────────────────────

/** Dismiss the "What's New" modal if it appears on first load. */
async function dismissWhatsNew(page: import('@playwright/test').Page): Promise<void> {
  const closeButton = page.locator('button:has-text("×")').first();
  try {
    await closeButton.waitFor({ state: 'visible', timeout: 3_000 });
    await closeButton.click();
    await page.waitForTimeout(300);
  } catch {
    // Modal didn't appear — already dismissed or version already seen
  }
}

/** Assert that the workspace renders its main content area (positive access). */
async function assertWorkspaceAccessible(
  page: import('@playwright/test').Page,
  hashPath: string,
  urlPattern: RegExp,
): Promise<void> {
  await page.goto(`/#${hashPath}`);
  await page.waitForLoadState('networkidle');

  const main = page.locator('main, [role="main"]');
  await expect(main).toBeVisible({ timeout: 10_000 });
  await expect(page).toHaveURL(urlPattern);
}

/**
 * Assert that the workspace is denied — either an "Access Denied" heading
 * renders or the app redirects away from the target path.
 */
async function assertWorkspaceDenied(
  page: import('@playwright/test').Page,
  hashPath: string,
  pathSegment: string,
): Promise<void> {
  await page.goto(`/#${hashPath}`);
  await page.waitForLoadState('networkidle');

  const denied = page.getByRole('heading', { name: /access denied/i });
  const main = page.locator('main, [role="main"]');

  const hasDenied = await denied.isVisible().catch(() => false);
  if (!hasDenied) {
    // Should have been redirected away from the restricted workspace
    await expect(main).toBeVisible({ timeout: 8_000 });
    // Confirm URL no longer starts with the restricted path
    const url = page.url();
    // Use a loose check: URL hash should not contain the restricted path segment
    // (unless redirected to hub which is fine)
    const hash = new URL(url).hash;
    const isOnRestrictedPath =
      hash === `#${hashPath}` || hash.startsWith(`#${hashPath}/`);
    if (isOnRestrictedPath) {
      // If we're still on the path, the access denied heading MUST be present
      await expect(denied).toBeVisible({ timeout: 5_000 });
    }
  }
}

// ─── Test Suite ─────────────────────────────────────────────────────────────────

test.describe('Permission Matrix — 6-Role Workspace Access', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await dismissWhatsNew(page);
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // SuperAdmin — full access to all workspaces
  // ═══════════════════════════════════════════════════════════════════════════════
  test.describe('SuperAdmin — full access', () => {
    test.beforeEach(async ({ switchRole }) => {
      await switchRole('SuperAdmin');
    });

    test('can access / (Hub)', async ({ page }) => {
      await assertWorkspaceAccessible(page, '/', /\/#\//);
    });

    test('can access /preconstruction', async ({ page }) => {
      await assertWorkspaceAccessible(page, '/preconstruction', /preconstruction/);
    });

    test('can access /operations', async ({ page }) => {
      await assertWorkspaceAccessible(page, '/operations', /operations/);
    });

    test('can access /shared-services', async ({ page }) => {
      await assertWorkspaceAccessible(page, '/shared-services', /shared-services/);
    });

    test('can access /site-control', async ({ page }) => {
      await assertWorkspaceAccessible(page, '/site-control', /site-control/);
    });

    test('can access /admin', async ({ page }) => {
      await assertWorkspaceAccessible(page, '/admin', /admin/);
    });

    // Sidebar visibility: Admin workspace should show System Configuration group
    test('Admin sidebar shows System Configuration group', async ({ page }) => {
      await page.goto('/#/admin');
      await page.waitForLoadState('networkidle');

      const sidebar = page.locator('nav[aria-label="Workspace navigation"]');
      await expect(sidebar).toBeVisible({ timeout: 10_000 });
      // The accordion header for System Configuration should be in the sidebar
      await expect(sidebar.getByText('System Configuration')).toBeVisible({ timeout: 5_000 });
    });

    // Page-level: SuperAdmin can reach Feature Flags admin page
    test('can access /admin/feature-flags', async ({ page }) => {
      await page.goto('/#/admin/feature-flags');
      await page.waitForLoadState('networkidle');

      const main = page.locator('main, [role="main"]');
      await expect(main).toBeVisible({ timeout: 10_000 });
      await expect(page).toHaveURL(/feature-flags/);
    });

    // Page-level: SuperAdmin can reach Connections admin page
    test('can access /admin/connections', async ({ page }) => {
      await page.goto('/#/admin/connections');
      await page.waitForLoadState('networkidle');

      const main = page.locator('main, [role="main"]');
      await expect(main).toBeVisible({ timeout: 10_000 });
      await expect(page).toHaveURL(/connections/);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // ExecutiveLeadership — full access to all workspaces
  // ═══════════════════════════════════════════════════════════════════════════════
  test.describe('ExecutiveLeadership — full access', () => {
    test.beforeEach(async ({ switchRole }) => {
      await switchRole('ExecutiveLeadership');
    });

    test('can access / (Hub)', async ({ page }) => {
      await assertWorkspaceAccessible(page, '/', /\/#\//);
    });

    test('can access /preconstruction', async ({ page }) => {
      await assertWorkspaceAccessible(page, '/preconstruction', /preconstruction/);
    });

    test('can access /operations', async ({ page }) => {
      await assertWorkspaceAccessible(page, '/operations', /operations/);
    });

    test('can access /shared-services', async ({ page }) => {
      await assertWorkspaceAccessible(page, '/shared-services', /shared-services/);
    });

    test('can access /site-control', async ({ page }) => {
      await assertWorkspaceAccessible(page, '/site-control', /site-control/);
    });

    test('can access /admin', async ({ page }) => {
      await assertWorkspaceAccessible(page, '/admin', /admin/);
    });

    // Cross-workspace navigation: navigate from admin to preconstruction
    test('can navigate from /admin to /preconstruction', async ({ page }) => {
      await page.goto('/#/admin');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 10_000 });

      await page.goto('/#/preconstruction');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/preconstruction/);
      await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 10_000 });
    });

    // Sidebar visibility: Operations workspace shows sidebar groups
    test('Operations sidebar shows Commercial Operations group', async ({ page }) => {
      await page.goto('/#/operations');
      await page.waitForLoadState('networkidle');

      const sidebar = page.locator('nav[aria-label="Workspace navigation"]');
      await expect(sidebar).toBeVisible({ timeout: 10_000 });
      await expect(sidebar.getByText('Commercial Operations')).toBeVisible({ timeout: 5_000 });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // OperationsTeam (Project Manager) — hub, preconstruction, operations,
  //   shared-services, site-control. DENIED: admin.
  // ═══════════════════════════════════════════════════════════════════════════════
  test.describe('OperationsTeam (Project Manager) — 5 workspaces', () => {
    test.beforeEach(async ({ switchRole }) => {
      await switchRole('OperationsTeam');
    });

    // ── Positive ──

    test('can access / (Hub)', async ({ page }) => {
      await assertWorkspaceAccessible(page, '/', /\/#\//);
    });

    test('can access /preconstruction', async ({ page }) => {
      await assertWorkspaceAccessible(page, '/preconstruction', /preconstruction/);
    });

    test('can access /operations', async ({ page }) => {
      await assertWorkspaceAccessible(page, '/operations', /operations/);
    });

    test('can access /shared-services', async ({ page }) => {
      await assertWorkspaceAccessible(page, '/shared-services', /shared-services/);
    });

    test('can access /site-control', async ({ page }) => {
      await assertWorkspaceAccessible(page, '/site-control', /site-control/);
    });

    // ── Denial ──

    test('denied /admin', async ({ page }) => {
      await assertWorkspaceDenied(page, '/admin', 'admin');
    });

    // Sidebar visibility: Preconstruction sidebar should show BD group
    test('Preconstruction sidebar shows Business Development group', async ({ page }) => {
      await page.goto('/#/preconstruction');
      await page.waitForLoadState('networkidle');

      const sidebar = page.locator('nav[aria-label="Workspace navigation"]');
      await expect(sidebar).toBeVisible({ timeout: 10_000 });
      await expect(sidebar.getByText('Business Development')).toBeVisible({ timeout: 5_000 });
    });

    // Page-level: can reach Operations commercial dashboard
    test('can access /operations/commercial', async ({ page }) => {
      await page.goto('/#/operations/commercial');
      await page.waitForLoadState('networkidle');

      const main = page.locator('main, [role="main"]');
      await expect(main).toBeVisible({ timeout: 10_000 });
      await expect(page).toHaveURL(/operations\/commercial/);
    });

    // Cross-workspace: navigate from operations to shared-services
    test('can navigate from /operations to /shared-services', async ({ page }) => {
      await page.goto('/#/operations');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 10_000 });

      await page.goto('/#/shared-services');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/shared-services/);
      await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 10_000 });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // DepartmentDirector (Project Executive) — hub, operations, shared-services,
  //   site-control. DENIED: admin, preconstruction.
  // ═══════════════════════════════════════════════════════════════════════════════
  test.describe('DepartmentDirector (Project Executive) — 4 workspaces', () => {
    test.beforeEach(async ({ switchRole }) => {
      await switchRole('DepartmentDirector');
    });

    // ── Positive ──

    test('can access / (Hub)', async ({ page }) => {
      await assertWorkspaceAccessible(page, '/', /\/#\//);
    });

    test('can access /operations', async ({ page }) => {
      await assertWorkspaceAccessible(page, '/operations', /operations/);
    });

    test('can access /shared-services', async ({ page }) => {
      await assertWorkspaceAccessible(page, '/shared-services', /shared-services/);
    });

    test('can access /site-control', async ({ page }) => {
      await assertWorkspaceAccessible(page, '/site-control', /site-control/);
    });

    // ── Denial ──

    test('denied /admin', async ({ page }) => {
      await assertWorkspaceDenied(page, '/admin', 'admin');
    });

    test('denied /preconstruction', async ({ page }) => {
      await assertWorkspaceDenied(page, '/preconstruction', 'preconstruction');
    });

    // Sidebar visibility: Shared Services sidebar shows Marketing group
    test('Shared Services sidebar shows Marketing group', async ({ page }) => {
      await page.goto('/#/shared-services');
      await page.waitForLoadState('networkidle');

      const sidebar = page.locator('nav[aria-label="Workspace navigation"]');
      await expect(sidebar).toBeVisible({ timeout: 10_000 });
      await expect(sidebar.getByText('Marketing')).toBeVisible({ timeout: 5_000 });
    });

    // Sidebar visibility: Site Control shows Jobsite Management
    test('Site Control sidebar shows Jobsite Management group', async ({ page }) => {
      await page.goto('/#/site-control');
      await page.waitForLoadState('networkidle');

      const sidebar = page.locator('nav[aria-label="Workspace navigation"]');
      await expect(sidebar).toBeVisible({ timeout: 10_000 });
      await expect(sidebar.getByText('Jobsite Management')).toBeVisible({ timeout: 5_000 });
    });

    // Page-level: can reach shared services accounting
    test('can access /shared-services/accounting', async ({ page }) => {
      await page.goto('/#/shared-services/accounting');
      await page.waitForLoadState('networkidle');

      const main = page.locator('main, [role="main"]');
      await expect(main).toBeVisible({ timeout: 10_000 });
      await expect(page).toHaveURL(/shared-services\/accounting/);
    });

    // Cross-workspace: navigate between accessible workspaces
    test('can navigate from /operations to /site-control', async ({ page }) => {
      await page.goto('/#/operations');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 10_000 });

      await page.goto('/#/site-control');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/site-control/);
      await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 10_000 });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // BDRepresentative (BDM) — hub, preconstruction, shared-services.
  //   DENIED: admin, operations, site-control.
  // ═══════════════════════════════════════════════════════════════════════════════
  test.describe('BDRepresentative (BDM) — 3 workspaces', () => {
    test.beforeEach(async ({ switchRole }) => {
      await switchRole('BDRepresentative');
    });

    // ── Positive ──

    test('can access / (Hub)', async ({ page }) => {
      await assertWorkspaceAccessible(page, '/', /\/#\//);
    });

    test('can access /preconstruction', async ({ page }) => {
      await assertWorkspaceAccessible(page, '/preconstruction', /preconstruction/);
    });

    test('can access /shared-services', async ({ page }) => {
      await assertWorkspaceAccessible(page, '/shared-services', /shared-services/);
    });

    // ── Denial ──

    test('denied /admin', async ({ page }) => {
      await assertWorkspaceDenied(page, '/admin', 'admin');
    });

    test('denied /operations', async ({ page }) => {
      await assertWorkspaceDenied(page, '/operations', 'operations');
    });

    test('denied /site-control', async ({ page }) => {
      await assertWorkspaceDenied(page, '/site-control', 'site-control');
    });

    // Sidebar: Preconstruction sidebar shows BD section
    test('Preconstruction sidebar shows Business Development group', async ({ page }) => {
      await page.goto('/#/preconstruction');
      await page.waitForLoadState('networkidle');

      const sidebar = page.locator('nav[aria-label="Workspace navigation"]');
      await expect(sidebar).toBeVisible({ timeout: 10_000 });
      await expect(sidebar.getByText('Business Development')).toBeVisible({ timeout: 5_000 });
    });

    // Page-level: BD Rep can reach Pipeline page
    test('can access /preconstruction/bd/pipeline', async ({ page }) => {
      await page.goto('/#/preconstruction/bd/pipeline');
      await page.waitForLoadState('networkidle');

      const main = page.locator('main, [role="main"]');
      await expect(main).toBeVisible({ timeout: 10_000 });
      await expect(page).toHaveURL(/pipeline/);
    });

    // Page-level: BD Rep can reach Lead Management
    test('can access /preconstruction/bd/leads', async ({ page }) => {
      await page.goto('/#/preconstruction/bd/leads');
      await page.waitForLoadState('networkidle');

      const main = page.locator('main, [role="main"]');
      await expect(main).toBeVisible({ timeout: 10_000 });
      await expect(page).toHaveURL(/leads/);
    });

    // Page-level: BD Rep can reach Shared Services Marketing
    test('can access /shared-services/marketing', async ({ page }) => {
      await page.goto('/#/shared-services/marketing');
      await page.waitForLoadState('networkidle');

      const main = page.locator('main, [role="main"]');
      await expect(main).toBeVisible({ timeout: 10_000 });
      await expect(page).toHaveURL(/marketing/);
    });

    // Denial: BD Rep cannot access admin roles page
    test('denied /admin/roles', async ({ page }) => {
      await assertWorkspaceDenied(page, '/admin/roles', 'admin');
    });

    // Cross-workspace: navigate from preconstruction to shared-services
    test('can navigate from /preconstruction to /shared-services', async ({ page }) => {
      await page.goto('/#/preconstruction');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 10_000 });

      await page.goto('/#/shared-services');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/shared-services/);
      await expect(page.locator('main, [role="main"]')).toBeVisible({ timeout: 10_000 });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // EstimatingCoordinator — hub, preconstruction.
  //   DENIED: admin, operations, shared-services, site-control.
  // ═══════════════════════════════════════════════════════════════════════════════
  test.describe('EstimatingCoordinator — 2 workspaces', () => {
    test.beforeEach(async ({ switchRole }) => {
      await switchRole('EstimatingCoordinator');
    });

    // ── Positive ──

    test('can access / (Hub)', async ({ page }) => {
      await assertWorkspaceAccessible(page, '/', /\/#\//);
    });

    test('can access /preconstruction', async ({ page }) => {
      await assertWorkspaceAccessible(page, '/preconstruction', /preconstruction/);
    });

    // ── Denial ──

    test('denied /admin', async ({ page }) => {
      await assertWorkspaceDenied(page, '/admin', 'admin');
    });

    test('denied /operations', async ({ page }) => {
      await assertWorkspaceDenied(page, '/operations', 'operations');
    });

    test('denied /shared-services', async ({ page }) => {
      await assertWorkspaceDenied(page, '/shared-services', 'shared-services');
    });

    test('denied /site-control', async ({ page }) => {
      await assertWorkspaceDenied(page, '/site-control', 'site-control');
    });

    // Sidebar: Preconstruction sidebar shows Estimating group
    test('Preconstruction sidebar shows Estimating group', async ({ page }) => {
      await page.goto('/#/preconstruction');
      await page.waitForLoadState('networkidle');

      const sidebar = page.locator('nav[aria-label="Workspace navigation"]');
      await expect(sidebar).toBeVisible({ timeout: 10_000 });
      await expect(sidebar.getByText('Estimating')).toBeVisible({ timeout: 5_000 });
    });

    // Page-level: EC can reach Estimating Dashboard
    test('can access /preconstruction/estimating', async ({ page }) => {
      await page.goto('/#/preconstruction/estimating');
      await page.waitForLoadState('networkidle');

      const main = page.locator('main, [role="main"]');
      await expect(main).toBeVisible({ timeout: 10_000 });
      await expect(page).toHaveURL(/estimating/);
    });

    // Page-level: EC can reach Post-Bid Autopsies
    test('can access /preconstruction/estimating/post-bid', async ({ page }) => {
      await page.goto('/#/preconstruction/estimating/post-bid');
      await page.waitForLoadState('networkidle');

      const main = page.locator('main, [role="main"]');
      await expect(main).toBeVisible({ timeout: 10_000 });
      await expect(page).toHaveURL(/post-bid/);
    });

    // Denial: EC cannot access admin feature flags
    test('denied /admin/feature-flags', async ({ page }) => {
      await assertWorkspaceDenied(page, '/admin/feature-flags', 'admin');
    });

    // Denial: EC cannot access Operations commercial page
    test('denied /operations/commercial', async ({ page }) => {
      await assertWorkspaceDenied(page, '/operations/commercial', 'operations');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // Additional role-specific permission tests
  // ═══════════════════════════════════════════════════════════════════════════════
  test.describe('Cross-role page-level permission checks', () => {

    // AccountingManager can access shared-services/accounting but not admin
    test('AccountingManager can access /shared-services/accounting', async ({
      page,
      switchRole,
    }) => {
      await switchRole('AccountingManager');
      await page.goto('/#/shared-services/accounting');
      await page.waitForLoadState('networkidle');

      const main = page.locator('main, [role="main"]');
      await expect(main).toBeVisible({ timeout: 10_000 });
      await expect(page).toHaveURL(/accounting/);
    });

    test('AccountingManager denied /admin', async ({ page, switchRole }) => {
      await switchRole('AccountingManager');
      await assertWorkspaceDenied(page, '/admin', 'admin');
    });

    // Safety role can access operations and site-control but not admin
    test('Safety can access /operations', async ({ page, switchRole }) => {
      await switchRole('Safety');
      await page.goto('/#/operations');
      await page.waitForLoadState('networkidle');

      const main = page.locator('main, [role="main"]');
      await expect(main).toBeVisible({ timeout: 10_000 });
      await expect(page).toHaveURL(/operations/);
    });

    test('Safety can access /site-control', async ({ page, switchRole }) => {
      await switchRole('Safety');
      await page.goto('/#/site-control');
      await page.waitForLoadState('networkidle');

      const main = page.locator('main, [role="main"]');
      await expect(main).toBeVisible({ timeout: 10_000 });
      await expect(page).toHaveURL(/site-control/);
    });

    test('Safety denied /admin', async ({ page, switchRole }) => {
      await switchRole('Safety');
      await assertWorkspaceDenied(page, '/admin', 'admin');
    });

    // QualityControl can access operations and site-control but not preconstruction
    test('QualityControl can access /operations', async ({ page, switchRole }) => {
      await switchRole('QualityControl');
      await page.goto('/#/operations');
      await page.waitForLoadState('networkidle');

      const main = page.locator('main, [role="main"]');
      await expect(main).toBeVisible({ timeout: 10_000 });
      await expect(page).toHaveURL(/operations/);
    });

    test('QualityControl can access /site-control', async ({ page, switchRole }) => {
      await switchRole('QualityControl');
      await page.goto('/#/site-control');
      await page.waitForLoadState('networkidle');

      const main = page.locator('main, [role="main"]');
      await expect(main).toBeVisible({ timeout: 10_000 });
      await expect(page).toHaveURL(/site-control/);
    });

    test('QualityControl denied /preconstruction', async ({ page, switchRole }) => {
      await switchRole('QualityControl');
      await assertWorkspaceDenied(page, '/preconstruction', 'preconstruction');
    });

    // Marketing can access shared-services but not operations
    test('Marketing can access /shared-services', async ({ page, switchRole }) => {
      await switchRole('Marketing');
      await page.goto('/#/shared-services');
      await page.waitForLoadState('networkidle');

      const main = page.locator('main, [role="main"]');
      await expect(main).toBeVisible({ timeout: 10_000 });
      await expect(page).toHaveURL(/shared-services/);
    });

    test('Marketing denied /operations', async ({ page, switchRole }) => {
      await switchRole('Marketing');
      await assertWorkspaceDenied(page, '/operations', 'operations');
    });

    test('Marketing denied /admin', async ({ page, switchRole }) => {
      await switchRole('Marketing');
      await assertWorkspaceDenied(page, '/admin', 'admin');
    });
  });
});
