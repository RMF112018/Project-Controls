import {
  normalizeRoleName,
  LEGACY_ROLE_MAP,
} from '../../models/IRoleConfiguration';
import type { IRoleConfiguration } from '../../models';
import {
  resolvePermissionsFromConfig,
  hasGlobalAccess,
  resolveNavGroupAccess,
  ROLE_PERMISSIONS,
  NAV_GROUP_ROLES,
  PERMISSIONS,
} from '../permissions';
import { PermissionLevel } from '../../models/enums';

// ---------------------------------------------------------------------------
// Helpers — minimal IRoleConfiguration factory
// ---------------------------------------------------------------------------
function makeConfig(
  overrides: Partial<IRoleConfiguration> & Pick<IRoleConfiguration, 'roleName'>,
): IRoleConfiguration {
  return {
    id: 1,
    displayName: overrides.roleName,
    description: '',
    isGlobal: false,
    isSystem: false,
    isActive: true,
    defaultPermissions: [],
    defaultToolAccess: [],
    navGroupAccess: [],
    entraGroupId: undefined,
    createdBy: 'test',
    createdDate: '2026-01-01',
    lastModifiedBy: 'test',
    lastModifiedDate: '2026-01-01',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('Role Configuration - Permission Utilities', () => {
  // -----------------------------------------------------------------------
  // normalizeRoleName
  // -----------------------------------------------------------------------
  describe('normalizeRoleName', () => {
    it('maps all 14 legacy roles correctly', () => {
      const entries = Object.entries(LEGACY_ROLE_MAP);
      expect(entries.length).toBe(14);

      for (const [legacy, canonical] of entries) {
        expect(normalizeRoleName(legacy)).toBe(canonical);
      }
    });

    it('returns input unchanged for canonical roles', () => {
      expect(normalizeRoleName('Admin')).toBe('Admin');
      expect(normalizeRoleName('Leadership')).toBe('Leadership');
      expect(normalizeRoleName('Project Manager')).toBe('Project Manager');
      expect(normalizeRoleName('Business Development Manager')).toBe(
        'Business Development Manager',
      );
      expect(normalizeRoleName('Project Executive')).toBe('Project Executive');
    });

    it('returns input unchanged for unknown roles', () => {
      expect(normalizeRoleName('FutureRole')).toBe('FutureRole');
      expect(normalizeRoleName('SomeNewRole')).toBe('SomeNewRole');
    });
  });

  // -----------------------------------------------------------------------
  // resolvePermissionsFromConfig
  // -----------------------------------------------------------------------
  describe('resolvePermissionsFromConfig', () => {
    it('uses config when available', () => {
      const configs: IRoleConfiguration[] = [
        makeConfig({
          roleName: 'Administrator',
          defaultPermissions: [PERMISSIONS.ADMIN_ROLES, PERMISSIONS.ADMIN_FLAGS],
        }),
      ];

      const result = resolvePermissionsFromConfig(configs, ['SharePoint Admin']);
      // 'SharePoint Admin' normalizes to 'Administrator' per LEGACY_ROLE_MAP
      expect(result).toContain(PERMISSIONS.ADMIN_ROLES);
      expect(result).toContain(PERMISSIONS.ADMIN_FLAGS);
      expect(result).toHaveLength(2);
    });

    it('falls back to ROLE_PERMISSIONS when no config matches', () => {
      // 'Estimating Coordinator' normalizes to 'Estimator' per LEGACY_ROLE_MAP.
      // ROLE_PERMISSIONS has 'Estimator' (canonical 16-role system).
      const resultEC = resolvePermissionsFromConfig([], ['Estimating Coordinator']);
      const expected = ROLE_PERMISSIONS['Estimator'];
      expect(resultEC).toEqual(expect.arrayContaining(expected));
      expect(resultEC).toHaveLength(expected.length);
    });

    it('deduplicates permissions across multiple roles', () => {
      // Both configs grant LEAD_READ — result should contain it only once
      const configs: IRoleConfiguration[] = [
        makeConfig({
          id: 1,
          roleName: 'Leadership',
          defaultPermissions: [PERMISSIONS.LEAD_READ, PERMISSIONS.ADMIN_ROLES],
        }),
        makeConfig({
          id: 2,
          roleName: 'Project Executive',
          defaultPermissions: [PERMISSIONS.LEAD_READ, PERMISSIONS.SCHEDULE_VIEW],
        }),
      ];

      const result = resolvePermissionsFromConfig(configs, [
        'Executive Leadership', // normalizes to 'Leadership'
        'Project Executive',    // passes through (not in LEGACY_ROLE_MAP)
      ]);

      // LEAD_READ should appear exactly once
      const leadReadCount = result.filter(p => p === PERMISSIONS.LEAD_READ).length;
      expect(leadReadCount).toBe(1);
      expect(result).toContain(PERMISSIONS.ADMIN_ROLES);
      expect(result).toContain(PERMISSIONS.SCHEDULE_VIEW);
      expect(result).toHaveLength(3);
    });
  });

  // -----------------------------------------------------------------------
  // hasGlobalAccess
  // -----------------------------------------------------------------------
  describe('hasGlobalAccess', () => {
    it('returns true when user has a role with isGlobal: true', () => {
      const configs: IRoleConfiguration[] = [
        makeConfig({ roleName: 'Leadership', isGlobal: true }),
      ];

      // 'Executive Leadership' normalizes to 'Leadership'
      expect(hasGlobalAccess(configs, ['Executive Leadership'])).toBe(true);
    });

    it('returns false for Commercial Operations Manager (isGlobal: false)', () => {
      const configs: IRoleConfiguration[] = [
        makeConfig({ roleName: 'Commercial Operations Manager', isGlobal: false }),
      ];

      // 'Operations Team' normalizes to 'Commercial Operations Manager'
      expect(hasGlobalAccess(configs, ['Operations Team'])).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // resolveNavGroupAccess
  // -----------------------------------------------------------------------
  describe('resolveNavGroupAccess', () => {
    it('uses config navGroupAccess when available', () => {
      const configs: IRoleConfiguration[] = [
        makeConfig({
          roleName: 'Administrator',
          navGroupAccess: ['Admin', 'Operations', 'Marketing'],
        }),
      ];

      // 'SharePoint Admin' normalizes to 'Administrator' per LEGACY_ROLE_MAP
      const result = resolveNavGroupAccess(configs, ['SharePoint Admin']);
      expect(result).toEqual(
        expect.arrayContaining(['Admin', 'Operations', 'Marketing']),
      );
      expect(result).toHaveLength(3);
    });

    it('falls back to NAV_GROUP_ROLES for unknown role', () => {
      // 'Estimating Coordinator' normalizes to 'Estimator'; NAV_GROUP_ROLES uses
      // ALL_ROLE_NAMES (includes 'Estimator') for all groups
      const result = resolveNavGroupAccess([], ['Estimating Coordinator']);

      const expectedGroups: string[] = [];
      for (const [group, roles] of Object.entries(NAV_GROUP_ROLES)) {
        if (roles.includes('Estimator')) {
          expectedGroups.push(group);
        }
      }

      expect(expectedGroups.length).toBeGreaterThan(0);
      expect(result).toEqual(expect.arrayContaining(expectedGroups));
      expect(result).toHaveLength(expectedGroups.length);
    });
  });
});
