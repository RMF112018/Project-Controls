import { RoleName } from '../../models/enums';
import {
  ROLE_NAV_ITEMS,
  LANDING_PAGE_CONFIG,
  ROLE_LANDING_ROUTES,
  GRANULAR_PERMISSIONS,
} from '../permissions';

const ALL_ROLE_VALUES = Object.values(RoleName);

describe('Stage 2: ROLE_NAV_ITEMS', () => {
  it('defines nav config for all 16 roles', () => {
    for (const role of ALL_ROLE_VALUES) {
      expect(ROLE_NAV_ITEMS[role]).toBeDefined();
      expect(ROLE_NAV_ITEMS[role].workspaces).toBeInstanceOf(Array);
    }
    expect(Object.keys(ROLE_NAV_ITEMS)).toHaveLength(16);
  });

  it('Leadership has empty workspaces (hub-only)', () => {
    expect(ROLE_NAV_ITEMS['Leadership'].workspaces).toEqual([]);
  });

  it('Administrator has access to all primary workspaces', () => {
    const adminWorkspaces = ROLE_NAV_ITEMS['Administrator'].workspaces;
    expect(adminWorkspaces).toContain('admin');
    expect(adminWorkspaces).toContain('preconstruction');
    expect(adminWorkspaces).toContain('operations');
    expect(adminWorkspaces).toContain('shared-services');
    expect(adminWorkspaces).toContain('site-control');
  });

  it('department roles map to correct workspace IDs', () => {
    expect(ROLE_NAV_ITEMS['Marketing Manager'].workspaces).toEqual(['shared-services']);
    expect(ROLE_NAV_ITEMS['Estimator'].workspaces).toEqual(['preconstruction']);
    expect(ROLE_NAV_ITEMS['Safety Manager'].workspaces).toContain('operations');
    expect(ROLE_NAV_ITEMS['Safety Manager'].workspaces).toContain('site-control');
  });

  it('sidebarGroups only reference valid workspace IDs', () => {
    for (const [, config] of Object.entries(ROLE_NAV_ITEMS)) {
      if (config.sidebarGroups) {
        for (const wsId of Object.keys(config.sidebarGroups)) {
          expect(config.workspaces).toContain(wsId);
        }
      }
    }
  });
});

describe('Stage 2: LANDING_PAGE_CONFIG', () => {
  it('defines landing config for all 16 roles', () => {
    for (const role of ALL_ROLE_VALUES) {
      expect(LANDING_PAGE_CONFIG[role]).toBeDefined();
      expect(LANDING_PAGE_CONFIG[role].icon).toBeTruthy();
      expect(LANDING_PAGE_CONFIG[role].title).toBeTruthy();
      expect(LANDING_PAGE_CONFIG[role].description).toBeTruthy();
      expect(LANDING_PAGE_CONFIG[role].defaultVisibleSections).toBeInstanceOf(Array);
    }
    expect(Object.keys(LANDING_PAGE_CONFIG)).toHaveLength(16);
  });

  it('every role in LANDING_PAGE_CONFIG also has a ROLE_LANDING_ROUTES entry', () => {
    for (const role of Object.keys(LANDING_PAGE_CONFIG)) {
      expect(ROLE_LANDING_ROUTES[role]).toBeDefined();
    }
  });
});

describe('Stage 2: GRANULAR_PERMISSIONS', () => {
  it('canViewFinancials returns true for Accounting Manager and Leadership', () => {
    expect(GRANULAR_PERMISSIONS.canViewFinancials(['Accounting Manager'])).toBe(true);
    expect(GRANULAR_PERMISSIONS.canViewFinancials(['Leadership'])).toBe(true);
    expect(GRANULAR_PERMISSIONS.canViewFinancials(['Administrator'])).toBe(true);
  });

  it('canViewFinancials returns false for unrelated roles', () => {
    expect(GRANULAR_PERMISSIONS.canViewFinancials(['Estimator'])).toBe(false);
    expect(GRANULAR_PERMISSIONS.canViewFinancials(['Safety Manager'])).toBe(false);
  });

  it('canEditProjects returns true for operations managers', () => {
    expect(GRANULAR_PERMISSIONS.canEditProjects(['Commercial Operations Manager'])).toBe(true);
    expect(GRANULAR_PERMISSIONS.canEditProjects(['Luxury Residential Manager'])).toBe(true);
  });

  it('canManageSafety returns true only for Safety Manager and Administrator', () => {
    expect(GRANULAR_PERMISSIONS.canManageSafety(['Safety Manager'])).toBe(true);
    expect(GRANULAR_PERMISSIONS.canManageSafety(['Administrator'])).toBe(true);
    expect(GRANULAR_PERMISSIONS.canManageSafety(['Estimator'])).toBe(false);
  });

  it('canManageQuality returns true for QC and Warranty managers', () => {
    expect(GRANULAR_PERMISSIONS.canManageQuality(['Quality Control Manager'])).toBe(true);
    expect(GRANULAR_PERMISSIONS.canManageQuality(['Warranty Manager'])).toBe(true);
    expect(GRANULAR_PERMISSIONS.canManageQuality(['Marketing Manager'])).toBe(false);
  });
});
