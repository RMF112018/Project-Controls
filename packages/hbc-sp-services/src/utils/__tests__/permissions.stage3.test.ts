// Stage 3 (sub-task 8): Tests for granular per-role permission sets.
import { RoleName } from '../../models/enums';
import {
  PERMISSIONS,
  ROLE_PERMISSION_SETS,
  ROLE_PERMISSIONS,
  ALL_PERMISSIONS,
  GRANULAR_PERMISSIONS,
} from '../permissions';

const ALL_ROLE_VALUES = Object.values(RoleName);
const ALL_PERM_VALUES = Object.values(PERMISSIONS);

describe('Stage 3: ROLE_PERMISSION_SETS', () => {
  it('defines a permission set for all 16 roles', () => {
    for (const role of ALL_ROLE_VALUES) {
      expect(ROLE_PERMISSION_SETS[role]).toBeDefined();
      expect(ROLE_PERMISSION_SETS[role]).toBeInstanceOf(Set);
    }
    expect(Object.keys(ROLE_PERMISSION_SETS)).toHaveLength(16);
  });

  it('Administrator has ALL permissions', () => {
    const adminPerms = ROLE_PERMISSION_SETS['Administrator'];
    expect(adminPerms.size).toBe(ALL_PERM_VALUES.length);
    for (const perm of ALL_PERM_VALUES) {
      expect(adminPerms.has(perm)).toBe(true);
    }
  });

  it('Leadership has only read/view permissions', () => {
    const leaderPerms = ROLE_PERMISSION_SETS['Leadership'];
    for (const perm of leaderPerms) {
      expect(perm).toMatch(/:read|:view/);
    }
    expect(leaderPerms.size).toBeGreaterThan(0);
  });

  it('non-Administrator roles have fewer permissions than Administrator', () => {
    const adminCount = ROLE_PERMISSION_SETS['Administrator'].size;
    for (const role of ALL_ROLE_VALUES) {
      if (role === 'Administrator') continue;
      expect(ROLE_PERMISSION_SETS[role].size).toBeLessThan(adminCount);
    }
  });

  it('all permission values reference valid PERMISSIONS constants', () => {
    const validPerms = new Set<string>(ALL_PERM_VALUES);
    for (const [, perms] of Object.entries(ROLE_PERMISSION_SETS)) {
      for (const perm of perms) {
        expect(validPerms.has(perm)).toBe(true);
      }
    }
  });

  it('Estimator has estimating permissions but not admin permissions', () => {
    const estimatorPerms = ROLE_PERMISSION_SETS['Estimator'];
    expect(estimatorPerms.has(PERMISSIONS.ESTIMATING_READ)).toBe(true);
    expect(estimatorPerms.has(PERMISSIONS.ESTIMATING_EDIT)).toBe(true);
    expect(estimatorPerms.has(PERMISSIONS.KICKOFF_VIEW)).toBe(true);
    expect(estimatorPerms.has(PERMISSIONS.ADMIN_ROLES)).toBe(false);
    expect(estimatorPerms.has(PERMISSIONS.ADMIN_FLAGS)).toBe(false);
  });

  it('Safety Manager has safety + site control permissions', () => {
    const safetyPerms = ROLE_PERMISSION_SETS['Safety Manager'];
    expect(safetyPerms.has(PERMISSIONS.SAFETY_EDIT)).toBe(true);
    expect(safetyPerms.has(PERMISSIONS.SITE_CONTROL_HUB_VIEW)).toBe(true);
    expect(safetyPerms.has(PERMISSIONS.ADMIN_ROLES)).toBe(false);
  });

  it('Marketing Manager has only marketing + shared services permissions', () => {
    const marketingPerms = ROLE_PERMISSION_SETS['Marketing Manager'];
    expect(marketingPerms.has(PERMISSIONS.MARKETING_EDIT)).toBe(true);
    expect(marketingPerms.has(PERMISSIONS.MARKETING_DASHBOARD_VIEW)).toBe(true);
    expect(marketingPerms.has(PERMISSIONS.SHARED_SERVICES_HUB_VIEW)).toBe(true);
    expect(marketingPerms.size).toBe(3);
  });

  it('Accounting Manager has financial permissions without admin access', () => {
    const accountingPerms = ROLE_PERMISSION_SETS['Accounting Manager'];
    expect(accountingPerms.has(PERMISSIONS.ACCOUNTING_QUEUE_VIEW)).toBe(true);
    expect(accountingPerms.has(PERMISSIONS.CONTRACT_VIEW_FINANCIALS)).toBe(true);
    expect(accountingPerms.has(PERMISSIONS.JOB_NUMBER_REQUEST_FINALIZE)).toBe(true);
    expect(accountingPerms.has(PERMISSIONS.ADMIN_ROLES)).toBe(false);
  });
});

describe('Stage 3: ROLE_PERMISSIONS backward compatibility', () => {
  it('derives array form from ROLE_PERMISSION_SETS', () => {
    for (const role of ALL_ROLE_VALUES) {
      const setPerms = ROLE_PERMISSION_SETS[role];
      const arrayPerms = ROLE_PERMISSIONS[role];
      expect(arrayPerms).toBeDefined();
      expect(arrayPerms).toHaveLength(setPerms.size);
      for (const perm of arrayPerms) {
        expect(setPerms.has(perm)).toBe(true);
      }
    }
  });
});

describe('Stage 3: ALL_PERMISSIONS export', () => {
  it('contains all PERMISSIONS values', () => {
    expect(ALL_PERMISSIONS).toHaveLength(ALL_PERM_VALUES.length);
    for (const perm of ALL_PERM_VALUES) {
      expect(ALL_PERMISSIONS).toContain(perm);
    }
  });
});

describe('Stage 3: Expanded GRANULAR_PERMISSIONS', () => {
  it('has at least 20 check functions', () => {
    const keys = Object.keys(GRANULAR_PERMISSIONS);
    expect(keys.length).toBeGreaterThanOrEqual(20);
  });

  it('canAccessAdmin is true only for Administrator', () => {
    expect(GRANULAR_PERMISSIONS.canAccessAdmin(['Administrator'])).toBe(true);
    expect(GRANULAR_PERMISSIONS.canAccessAdmin(['Leadership'])).toBe(false);
    expect(GRANULAR_PERMISSIONS.canAccessAdmin(['Estimator'])).toBe(false);
  });

  it('canEditEstimates is true for Estimator and Preconstruction Manager', () => {
    expect(GRANULAR_PERMISSIONS.canEditEstimates(['Estimator'])).toBe(true);
    expect(GRANULAR_PERMISSIONS.canEditEstimates(['Preconstruction Manager'])).toBe(true);
    expect(GRANULAR_PERMISSIONS.canEditEstimates(['Marketing Manager'])).toBe(false);
  });

  it('canEditHR is true for Human Resources Manager', () => {
    expect(GRANULAR_PERMISSIONS.canEditHR(['Human Resources Manager'])).toBe(true);
    expect(GRANULAR_PERMISSIONS.canEditHR(['Safety Manager'])).toBe(false);
  });

  it('canEditRiskManagement is true for Risk Manager', () => {
    expect(GRANULAR_PERMISSIONS.canEditRiskManagement(['Risk Manager'])).toBe(true);
    expect(GRANULAR_PERMISSIONS.canEditRiskManagement(['Estimator'])).toBe(false);
  });

  it('canManageSchedule is true for Commercial Operations Manager', () => {
    expect(GRANULAR_PERMISSIONS.canManageSchedule(['Commercial Operations Manager'])).toBe(true);
    expect(GRANULAR_PERMISSIONS.canManageSchedule(['Marketing Manager'])).toBe(false);
  });

  it('canManageLeads includes Business Development Manager', () => {
    expect(GRANULAR_PERMISSIONS.canManageLeads(['Business Development Manager'])).toBe(true);
    expect(GRANULAR_PERMISSIONS.canManageLeads(['Accounting Manager'])).toBe(false);
  });

  it('canEditMarketing is true for Marketing Manager', () => {
    expect(GRANULAR_PERMISSIONS.canEditMarketing(['Marketing Manager'])).toBe(true);
    expect(GRANULAR_PERMISSIONS.canEditMarketing(['Safety Manager'])).toBe(false);
  });

  it('canEditAccounting is true for Accounting Manager', () => {
    expect(GRANULAR_PERMISSIONS.canEditAccounting(['Accounting Manager'])).toBe(true);
    expect(GRANULAR_PERMISSIONS.canEditAccounting(['Estimator'])).toBe(false);
  });

  it('canManageWarranty is true for Warranty Manager', () => {
    expect(GRANULAR_PERMISSIONS.canManageWarranty(['Warranty Manager'])).toBe(true);
    expect(GRANULAR_PERMISSIONS.canManageWarranty(['Safety Manager'])).toBe(false);
  });

  it('all GRANULAR_PERMISSIONS include Administrator', () => {
    for (const [name, fn] of Object.entries(GRANULAR_PERMISSIONS)) {
      expect(fn(['Administrator'])).toBe(true);
    }
  });
});
