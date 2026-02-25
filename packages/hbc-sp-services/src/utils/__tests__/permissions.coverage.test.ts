import {
  resolvePermissionsFromConfig,
  hasGlobalAccess,
  resolveNavGroupAccess,
  ROLE_PERMISSIONS,
  NAV_GROUP_ROLES,
  PERMISSIONS,
} from '../permissions';
import { resolveToolPermissions, TOOL_DEFINITIONS } from '../toolPermissionMap';
import { normalizeRoleName } from '../../models/IRoleConfiguration';
import type { IRoleConfiguration } from '../../models/IRoleConfiguration';
import type { IToolAccess, IToolDefinition } from '../../models/IPermissionTemplate';
import { PermissionLevel } from '../../models/enums';

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

describe('Permission Resolution Coverage (Phase 7S4)', () => {
  // ---------------------------------------------------------------------------
  // resolvePermissionsFromConfig edge cases
  // ---------------------------------------------------------------------------
  describe('resolvePermissionsFromConfig edge cases', () => {
    test('returns empty array when configs empty and role not in ROLE_PERMISSIONS', () => {
      // 'Unknown Role' exists in neither configs nor ROLE_PERMISSIONS
      const result = resolvePermissionsFromConfig([], ['Unknown Role']);
      expect(result).toEqual([]);
    });

    test('inactive config is skipped, falls back to ROLE_PERMISSIONS', () => {
      // 'Estimating Coordinator' normalizes to itself per LEGACY_ROLE_MAP
      const inactiveConfig = makeConfig({
        roleName: 'Estimating Coordinator',
        isActive: false,
        defaultPermissions: ['custom:perm'],
      });

      const result = resolvePermissionsFromConfig(
        [inactiveConfig],
        ['Estimating Coordinator'],
      );

      // Should NOT contain the config permission since it is inactive
      expect(result).not.toContain('custom:perm');
      // Should fall back to the hard-coded ROLE_PERMISSIONS entry
      expect(result).toContain(PERMISSIONS.ESTIMATING_EDIT);
      expect(result).toEqual(
        expect.arrayContaining(ROLE_PERMISSIONS['Estimating Coordinator']),
      );
    });

    test('duplicate role names in userRoles are deduplicated', () => {
      const config = makeConfig({
        roleName: 'Estimating Coordinator',
        defaultPermissions: ['estimating:read', 'estimating:edit'],
      });

      const result = resolvePermissionsFromConfig(
        [config],
        ['Estimating Coordinator', 'Estimating Coordinator', 'Estimating Coordinator'],
      );

      // Each permission should appear exactly once
      expect(result).toHaveLength(2);
      expect(result).toContain('estimating:read');
      expect(result).toContain('estimating:edit');
    });

    test('multiple roles merge permissions without duplicates', () => {
      const configA = makeConfig({
        id: 1,
        roleName: 'Estimating Coordinator',
        defaultPermissions: ['estimating:read', 'shared:perm'],
      });
      const configB = makeConfig({
        id: 2,
        roleName: 'Project Manager',
        defaultPermissions: ['pmp:edit', 'shared:perm'],
      });

      // 'Estimating Coordinator' normalizes to itself, 'Operations Team' normalizes to 'Project Manager'
      const result = resolvePermissionsFromConfig(
        [configA, configB],
        ['Estimating Coordinator', 'Operations Team'],
      );

      // shared:perm should appear only once (deduplication via Set)
      const sharedCount = result.filter(p => p === 'shared:perm').length;
      expect(sharedCount).toBe(1);
      expect(result).toContain('estimating:read');
      expect(result).toContain('pmp:edit');
    });

    test('normalizes legacy role before config lookup (SharePoint Admin -> Admin)', () => {
      // 'SharePoint Admin' normalizes to 'Admin' per LEGACY_ROLE_MAP
      const adminConfig = makeConfig({
        roleName: 'Admin',
        defaultPermissions: ['admin:all'],
      });

      const result = resolvePermissionsFromConfig(
        [adminConfig],
        ['SharePoint Admin'],
      );

      expect(result).toContain('admin:all');
      // Should NOT fall through to ROLE_PERMISSIONS['Admin'] (which doesn't exist)
      // because the config was found
      expect(result).toHaveLength(1);
    });

    test('handles zero-length defaultPermissions from config', () => {
      const emptyConfig = makeConfig({
        roleName: 'Estimating Coordinator',
        defaultPermissions: [],
      });

      const result = resolvePermissionsFromConfig(
        [emptyConfig],
        ['Estimating Coordinator'],
      );

      // Active config was found, so fallback to ROLE_PERMISSIONS is NOT used
      // Config has empty defaultPermissions, so result is empty
      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // hasGlobalAccess edge cases
  // ---------------------------------------------------------------------------
  describe('hasGlobalAccess edge cases', () => {
    test('returns false when configs is empty array', () => {
      const result = hasGlobalAccess([], ['Executive Leadership']);
      expect(result).toBe(false);
    });

    test('returns false when config exists but isGlobal is false', () => {
      // 'Executive Leadership' normalizes to 'Leadership'
      const config = makeConfig({
        roleName: 'Leadership',
        isGlobal: false,
      });

      const result = hasGlobalAccess([config], ['Executive Leadership']);
      expect(result).toBe(false);
    });

    test('returns true when at least one role has isGlobal: true among multiple roles', () => {
      // 'Executive Leadership' -> 'Leadership', 'Estimating Coordinator' stays same
      const leadershipConfig = makeConfig({
        id: 1,
        roleName: 'Leadership',
        isGlobal: true,
      });
      const ecConfig = makeConfig({
        id: 2,
        roleName: 'Estimating Coordinator',
        isGlobal: false,
      });

      const result = hasGlobalAccess(
        [leadershipConfig, ecConfig],
        ['Estimating Coordinator', 'Executive Leadership'],
      );

      expect(result).toBe(true);
    });

    test('inactive config with isGlobal: true returns false', () => {
      const config = makeConfig({
        roleName: 'Leadership',
        isGlobal: true,
        isActive: false,
      });

      // 'Executive Leadership' normalizes to 'Leadership' — but config is inactive
      const result = hasGlobalAccess([config], ['Executive Leadership']);
      expect(result).toBe(false);
    });

    test('unknown role returns false', () => {
      const config = makeConfig({
        roleName: 'Leadership',
        isGlobal: true,
      });

      const result = hasGlobalAccess([config], ['Completely Unknown Role']);
      expect(result).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // resolveNavGroupAccess edge cases
  // ---------------------------------------------------------------------------
  describe('resolveNavGroupAccess edge cases', () => {
    test('config navGroupAccess takes precedence over NAV_GROUP_ROLES', () => {
      // 'Estimating Coordinator' stays 'Estimating Coordinator' after normalization.
      // NAV_GROUP_ROLES does not have 'Estimating Coordinator' in any group
      // except via Preconstruction which has 'Estimating Coordinator'.
      // But with a config, it should use config's navGroupAccess instead.
      const config = makeConfig({
        roleName: 'Estimating Coordinator',
        navGroupAccess: ['CustomGroup', 'Preconstruction'],
      });

      const result = resolveNavGroupAccess([config], ['Estimating Coordinator']);

      expect(result).toContain('CustomGroup');
      expect(result).toContain('Preconstruction');
      // Should have exactly what config says
      expect(result).toHaveLength(2);
    });

    test('empty navGroupAccess in config returns empty for that role', () => {
      const config = makeConfig({
        roleName: 'Estimating Coordinator',
        navGroupAccess: [],
      });

      const result = resolveNavGroupAccess([config], ['Estimating Coordinator']);

      // Config found with empty navGroupAccess -- no fallback
      expect(result).toEqual([]);
    });

    test('falls back correctly for roles in NAV_GROUP_ROLES', () => {
      // 'BD Representative' normalizes to 'Business Development Manager'
      // 'Business Development Manager' is NOT in NAV_GROUP_ROLES (legacy names are)
      // So no groups found via fallback. Let's use a role that stays as-is.
      // 'Estimating Coordinator' stays 'Estimating Coordinator' after normalization.
      // Check NAV_GROUP_ROLES: Preconstruction includes 'Estimating Coordinator'.
      const result = resolveNavGroupAccess([], ['Estimating Coordinator']);

      expect(result).toContain('Preconstruction');
    });

    test('multiple roles merge nav groups without duplicates', () => {
      // Both 'Executive Leadership' (-> 'Leadership') and 'SharePoint Admin' (-> 'Admin')
      // won't be found in NAV_GROUP_ROLES (since those use legacy names).
      // Use roles that don't normalize away from NAV_GROUP_ROLES keys.
      // 'Estimating Coordinator' -> 'Estimating Coordinator' (in Preconstruction)
      // 'Marketing' -> 'Business Development Manager' (NOT in NAV_GROUP_ROLES)
      // Let's use two roles that stay the same and share a NAV_GROUP:
      // Actually, need to use roles NOT in LEGACY_ROLE_MAP so they pass through unchanged.
      // Or use roles that map to themselves. 'Estimating Coordinator' maps to itself.
      // Let's create configs for two roles that share a nav group.
      const configA = makeConfig({
        id: 1,
        roleName: 'Estimating Coordinator',
        navGroupAccess: ['Preconstruction', 'Admin'],
      });
      const configB = makeConfig({
        id: 2,
        roleName: 'Project Manager',
        navGroupAccess: ['Operations', 'Admin'],
      });

      // 'Operations Team' normalizes to 'Project Manager'
      const result = resolveNavGroupAccess(
        [configA, configB],
        ['Estimating Coordinator', 'Operations Team'],
      );

      // 'Admin' should appear only once
      const adminCount = result.filter(g => g === 'Admin').length;
      expect(adminCount).toBe(1);
      expect(result).toContain('Preconstruction');
      expect(result).toContain('Operations');
      expect(result).toContain('Admin');
      expect(result).toHaveLength(3);
    });
  });

  // ---------------------------------------------------------------------------
  // resolveToolPermissions edge cases
  // ---------------------------------------------------------------------------
  describe('resolveToolPermissions edge cases', () => {
    // Common read permissions that are always added
    const COMMON_READ_PERMISSIONS = [
      'meeting:read',
      'precon:read',
      'proposal:read',
      'winloss:read',
      'contract:read',
      'turnover:read',
      'closeout:read',
    ];

    test('all 4 permission levels produce correct output for leads tool', () => {
      // NONE
      const noneResult = resolveToolPermissions([
        { toolKey: 'leads', level: PermissionLevel.NONE },
      ]);
      // NONE level gives empty array from definition, but common read perms are always added
      for (const commonPerm of COMMON_READ_PERMISSIONS) {
        expect(noneResult).toContain(commonPerm);
      }
      expect(noneResult).not.toContain('lead:read');

      // READ_ONLY
      const readResult = resolveToolPermissions([
        { toolKey: 'leads', level: PermissionLevel.READ_ONLY },
      ]);
      expect(readResult).toContain('lead:read');
      expect(readResult).not.toContain('lead:edit');

      // STANDARD
      const stdResult = resolveToolPermissions([
        { toolKey: 'leads', level: PermissionLevel.STANDARD },
      ]);
      expect(stdResult).toContain('lead:read');
      expect(stdResult).toContain('lead:edit');
      expect(stdResult).toContain('lead:create');
      expect(stdResult).not.toContain('lead:delete');

      // ADMIN
      const adminResult = resolveToolPermissions([
        { toolKey: 'leads', level: PermissionLevel.ADMIN },
      ]);
      expect(adminResult).toContain('lead:read');
      expect(adminResult).toContain('lead:edit');
      expect(adminResult).toContain('lead:create');
      expect(adminResult).toContain('lead:delete');
    });

    test('granular flags with no matching definition are silently skipped', () => {
      const access: IToolAccess[] = [
        {
          toolKey: 'leads',
          level: PermissionLevel.READ_ONLY,
          granularFlags: ['nonexistent_flag', 'also_fake'],
        },
      ];

      const result = resolveToolPermissions(access);

      // Should have lead:read from level + common read perms, no error thrown
      expect(result).toContain('lead:read');
      // No extra permissions from the fake flags
      const nonCommon = result.filter(p => !COMMON_READ_PERMISSIONS.includes(p));
      expect(nonCommon).toEqual(['lead:read']);
    });

    test('custom toolDefinitions override default TOOL_DEFINITIONS', () => {
      const customDefs: IToolDefinition[] = [
        {
          toolKey: 'custom_tool',
          toolGroup: 'admin',
          label: 'Custom Tool',
          description: 'A custom tool for testing',
          levels: {
            [PermissionLevel.NONE]: [],
            [PermissionLevel.READ_ONLY]: ['custom:read'],
            [PermissionLevel.STANDARD]: ['custom:read', 'custom:write'],
            [PermissionLevel.ADMIN]: ['custom:read', 'custom:write', 'custom:admin'],
          },
          granularFlags: [
            { key: 'can_export', label: 'Export', description: 'Allow export', permissions: ['custom:export'] },
          ],
        },
      ];

      const access: IToolAccess[] = [
        {
          toolKey: 'custom_tool',
          level: PermissionLevel.STANDARD,
          granularFlags: ['can_export'],
        },
      ];

      const result = resolveToolPermissions(access, customDefs);

      expect(result).toContain('custom:read');
      expect(result).toContain('custom:write');
      expect(result).toContain('custom:export');
      // Common read perms are always added regardless of custom definitions
      for (const commonPerm of COMMON_READ_PERMISSIONS) {
        expect(result).toContain(commonPerm);
      }
    });

    test('empty granularFlags array is handled correctly', () => {
      const access: IToolAccess[] = [
        {
          toolKey: 'leads',
          level: PermissionLevel.STANDARD,
          granularFlags: [],
        },
      ];

      const result = resolveToolPermissions(access);

      // Level-based permissions should be present
      expect(result).toContain('lead:read');
      expect(result).toContain('lead:edit');
      expect(result).toContain('lead:create');
      // No extra granular permissions (like lead:delete from can_delete_leads)
      expect(result).not.toContain('lead:delete');
      expect(result).not.toContain('gonogo:decide');
    });

    test('toolAccess with unknown toolKey is silently skipped', () => {
      const access: IToolAccess[] = [
        { toolKey: 'nonexistent_tool', level: PermissionLevel.ADMIN },
      ];

      const result = resolveToolPermissions(access);

      // Only common read permissions should be present
      expect(result).toHaveLength(COMMON_READ_PERMISSIONS.length);
      for (const commonPerm of COMMON_READ_PERMISSIONS) {
        expect(result).toContain(commonPerm);
      }
    });
  });
});
