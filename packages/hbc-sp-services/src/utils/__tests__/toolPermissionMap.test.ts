/**
 * toolPermissionMap — Phase 5D.1 gap tests for branch coverage.
 *
 * Tests resolveToolPermissions branches (unknown toolKey, level perms,
 * granular flags, missing flagDef) and getToolsByGroup.
 */
import {
  resolveToolPermissions,
  getToolsByGroup,
  TOOL_DEFINITIONS,
  TOOL_GROUPS,
} from '../toolPermissionMap';
import type { IToolAccess } from '../../models/IPermissionTemplate';
import { PermissionLevel } from '../../models/enums';

describe('toolPermissionMap', () => {
  // ── resolveToolPermissions ─────────────────────────────────────────────

  describe('resolveToolPermissions', () => {
    it('returns base read permissions for empty tool access array', () => {
      const result = resolveToolPermissions([]);
      expect(result).toContain('meeting:read');
      expect(result).toContain('precon:read');
    });

    it('skips unknown toolKey without error', () => {
      const access: IToolAccess[] = [
        { toolKey: 'nonexistent_tool', level: PermissionLevel.STANDARD },
      ];
      const result = resolveToolPermissions(access);
      // Should still have base read permissions, nothing extra
      expect(result).toContain('meeting:read');
      expect(result.length).toBe(7); // 7 base read permissions
    });

    it('resolves level-based permissions for a known tool', () => {
      const access: IToolAccess[] = [
        { toolKey: 'marketing_dashboard', level: PermissionLevel.STANDARD },
      ];
      const result = resolveToolPermissions(access);
      expect(result).toContain('marketing:dashboard:view');
      expect(result).toContain('marketing:edit');
    });

    it('resolves NONE level to no extra permissions', () => {
      const access: IToolAccess[] = [
        { toolKey: 'marketing_dashboard', level: PermissionLevel.NONE },
      ];
      const result = resolveToolPermissions(access);
      // NONE level has empty array, so only base read perms
      expect(result.length).toBe(7);
    });

    it('resolves granular flag permissions when flags match', () => {
      const access: IToolAccess[] = [
        {
          toolKey: 'procore_integration',
          level: PermissionLevel.READ_ONLY,
          granularFlags: ['can_sync_procore'],
        },
      ];
      const result = resolveToolPermissions(access);
      expect(result).toContain('procore:view');
      expect(result).toContain('procore:sync');
    });

    it('ignores unknown granular flags without error', () => {
      const access: IToolAccess[] = [
        {
          toolKey: 'procore_integration',
          level: PermissionLevel.READ_ONLY,
          granularFlags: ['nonexistent_flag'],
        },
      ];
      const result = resolveToolPermissions(access);
      expect(result).toContain('procore:view');
      expect(result).not.toContain('procore:sync');
    });
  });

  // ── getToolsByGroup ────────────────────────────────────────────────────

  describe('getToolsByGroup', () => {
    it('returns tools for a known group', () => {
      const marketing = getToolsByGroup('marketing');
      expect(marketing.length).toBeGreaterThan(0);
      expect(marketing.every(t => t.toolGroup === 'marketing')).toBe(true);
    });

    it('returns empty array for unknown group', () => {
      const result = getToolsByGroup('nonexistent_group');
      expect(result).toEqual([]);
    });
  });

  // ── TOOL_GROUPS constant ───────────────────────────────────────────────

  it('TOOL_GROUPS contains all expected groups', () => {
    expect(TOOL_GROUPS).toContain('marketing');
    expect(TOOL_GROUPS).toContain('admin');
    expect(TOOL_GROUPS.length).toBe(6);
  });

  it('TOOL_DEFINITIONS covers all groups', () => {
    const groupsInDefs = new Set(TOOL_DEFINITIONS.map(t => t.toolGroup));
    for (const g of TOOL_GROUPS) {
      expect(groupsInDefs.has(g)).toBe(true);
    }
  });
});
