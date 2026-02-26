import { filterVisibleSidebarGroups, filterVisibleWorkspaces, getColumnEntries, getColumnKeys, getColumnName, FEATURE_FLAGS_COLUMNS, ROLE_NAV_ITEMS } from '@hbc/sp-services';
import type { ISelectedProject, ISidebarGroup, ITelemetryMetrics, IWorkspaceConfig } from '@hbc/sp-services';
import { test, expect } from '@playwright/test';
import { LAUNCHER_WORKSPACES, WORKSPACE_CONFIGS } from '../src/webparts/hbcProjectControls/components/navigation/workspaceConfig';

test.describe('Shared services cross-suite integration smoke', () => {
  test('shared models and workspace permission helpers are consumable and deterministic', async ({ page }) => {
    const selectedProject: ISelectedProject = {
      projectCode: 'PC-001',
      projectName: 'Integration Smoke Project',
      stage: 'Won',
    };

    const telemetryMetrics: ITelemetryMetrics = {
      performanceLogs: [],
      auditLog: [],
      featureUsage: [],
      roleActivity: [],
      adoptionByHour: [],
      provisioningStats: [],
      errorTrend: [],
      forecastAccuracy: [],
      checklistCompletion: [],
      loadPerf: [],
      isLoading: false,
      error: null,
    };

    expect(selectedProject.projectCode).toBe('PC-001');
    expect(telemetryMetrics.isLoading).toBe(false);

    const filteredWorkspaces = filterVisibleWorkspaces<IWorkspaceConfig>({
      workspaces: LAUNCHER_WORKSPACES,
      primaryRole: 'Safety Manager',
      isMockMode: false,
      hasSelectedProject: false,
    });

    const expectedWorkspaceIds = (ROLE_NAV_ITEMS['Safety Manager']?.workspaces ?? [])
      .filter((workspaceId) => LAUNCHER_WORKSPACES.some((workspace) => workspace.id === workspaceId))
      .sort();
    const actualWorkspaceIds = filteredWorkspaces.map((workspace) => workspace.id).sort();
    expect(actualWorkspaceIds).toEqual(expectedWorkspaceIds);

    await page.addInitScript(() => {
      sessionStorage.setItem('hbc-dev-selected-role', 'Safety Manager');
      localStorage.setItem('hbc-last-seen-version', '1.0.0');
    });
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');

    await expect(page.getByLabel('Open workspace launcher')).toBeVisible({ timeout: 10_000 });
  });

  test('shared sidebar permission helper matches shared-services role shape', async ({ page }) => {
    const sharedServicesWorkspace = WORKSPACE_CONFIGS.find((workspace) => workspace.id === 'shared-services');
    expect(sharedServicesWorkspace).toBeTruthy();

    const sidebarGroups = (sharedServicesWorkspace?.sidebarGroups ?? []) as ISidebarGroup[];
    const filteredGroups = filterVisibleSidebarGroups<ISidebarGroup>({
      groups: sidebarGroups,
      workspaceId: 'shared-services',
      primaryRole: 'Marketing Manager',
      isMockMode: false,
    });

    expect(filteredGroups.map((group) => group.label)).toEqual(['Marketing']);

    await page.addInitScript(() => {
      sessionStorage.setItem('hbc-dev-selected-role', 'Marketing Manager');
      localStorage.setItem('hbc-last-seen-version', '1.0.0');
    });
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');
    await page.goto('/#/shared-services');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('shared column-mapping helpers return deterministic output', async ({ page }) => {
    const columnKeys = getColumnKeys(FEATURE_FLAGS_COLUMNS);
    const columnEntries = getColumnEntries(FEATURE_FLAGS_COLUMNS);
    const featureNameColumn = getColumnName(FEATURE_FLAGS_COLUMNS, 'FeatureName');

    expect(columnKeys).toContain('FeatureName');
    expect(columnKeys).toContain('Enabled');
    expect(columnEntries.length).toBeGreaterThan(0);
    expect(featureNameColumn).toBe('FeatureName');
    expect(columnEntries.some(([key, value]) => key === 'Category' && value === 'Category')).toBeTruthy();

    await page.goto('/#/admin/feature-flags');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });
});
