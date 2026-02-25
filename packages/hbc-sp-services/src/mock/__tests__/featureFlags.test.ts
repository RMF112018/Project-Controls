/**
 * Feature Flag Registry Integrity Tests
 * Phase 7 Stage 5 Wave 2 — Feature Flag Debt Cleanup
 *
 * Guards against:
 * - Accidental flag duplication (IDs or FeatureNames)
 * - Missing required properties
 * - Dead flags creeping back in
 * - Production-ready flags regressing to disabled
 * - ID sequencing gaps after removals
 */

import featureFlags from '../featureFlags.json';

interface IFeatureFlag {
  id: number;
  FeatureName: string;
  DisplayName: string;
  Enabled: boolean;
  EnabledForRoles: string[] | null;
  TargetDate: string | null;
  Notes: string;
  Category: string;
}

const flags = featureFlags as IFeatureFlag[];

describe('Feature Flag Registry Integrity', () => {
  describe('total flag count', () => {
    it('should contain exactly 56 flags (60 original - 4 removed in Phase 7S5)', () => {
      expect(flags).toHaveLength(56);
    });
  });

  describe('no duplicate IDs', () => {
    it('should have all unique IDs', () => {
      const ids = flags.map((f) => f.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('no duplicate FeatureNames', () => {
    it('should have all unique FeatureNames', () => {
      const names = flags.map((f) => f.FeatureName);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });
  });

  describe('production-ready flags are enabled', () => {
    it('VirtualizedListsV1 should be present and enabled', () => {
      const flag = flags.find((f) => f.FeatureName === 'VirtualizedListsV1');
      expect(flag).toBeDefined();
      expect(flag!.Enabled).toBe(true);
    });

    it('VirtualizedListsV1 should have no role restriction (globally enabled)', () => {
      const flag = flags.find((f) => f.FeatureName === 'VirtualizedListsV1');
      expect(flag).toBeDefined();
      expect(flag!.EnabledForRoles).toBeNull();
    });

    it('GraphBatchingEnabled should be present and enabled', () => {
      const flag = flags.find((f) => f.FeatureName === 'GraphBatchingEnabled');
      expect(flag).toBeDefined();
      expect(flag!.Enabled).toBe(true);
    });
  });

  describe('dead flags must not exist', () => {
    it('TanStackRouterEnabled should NOT exist (removed Phase 7S5)', () => {
      const flag = flags.find((f) => f.FeatureName === 'TanStackRouterEnabled');
      expect(flag).toBeUndefined();
    });

    it('InfinitePaging_AuditCompliance should NOT exist (removed Phase 7S5)', () => {
      const flag = flags.find((f) => f.FeatureName === 'InfinitePaging_AuditCompliance');
      expect(flag).toBeUndefined();
    });

    it('InfinitePaging_OpsLogs should NOT exist (removed Phase 7S5)', () => {
      const flag = flags.find((f) => f.FeatureName === 'InfinitePaging_OpsLogs');
      expect(flag).toBeUndefined();
    });

    it('InfinitePaging_StartupRisk should NOT exist (removed Phase 7S5)', () => {
      const flag = flags.find((f) => f.FeatureName === 'InfinitePaging_StartupRisk');
      expect(flag).toBeUndefined();
    });
  });

  describe('required properties', () => {
    it('every flag should have id, FeatureName, DisplayName, and Enabled', () => {
      flags.forEach((flag) => {
        expect(flag).toHaveProperty('id');
        expect(typeof flag.id).toBe('number');

        expect(flag).toHaveProperty('FeatureName');
        expect(typeof flag.FeatureName).toBe('string');
        expect(flag.FeatureName.length).toBeGreaterThan(0);

        expect(flag).toHaveProperty('DisplayName');
        expect(typeof flag.DisplayName).toBe('string');
        expect(flag.DisplayName.length).toBeGreaterThan(0);

        expect(flag).toHaveProperty('Enabled');
        expect(typeof flag.Enabled).toBe('boolean');
      });
    });
  });

  describe('sequential IDs (no gaps)', () => {
    it('IDs should be sequential from 1 to 56 with no gaps', () => {
      const sortedIds = flags.map((f) => f.id).sort((a, b) => a - b);
      for (let i = 0; i < sortedIds.length; i++) {
        expect(sortedIds[i]).toBe(i + 1);
      }
    });
  });
});
