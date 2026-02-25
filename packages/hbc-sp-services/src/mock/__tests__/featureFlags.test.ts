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
    it('should contain exactly 25 flags (30 post-Batch 5D - 5 Batch 5E Preconstruction + Misc)', () => {
      expect(flags).toHaveLength(25);
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
    it('PermissionEngine should be present and enabled', () => {
      const flag = flags.find((f) => f.FeatureName === 'PermissionEngine');
      expect(flag).toBeDefined();
      expect(flag!.Enabled).toBe(true);
    });

    it('PermissionEngine should have no role restriction (globally enabled)', () => {
      const flag = flags.find((f) => f.FeatureName === 'PermissionEngine');
      expect(flag).toBeDefined();
      expect(flag!.EnabledForRoles).toBeNull();
    });

    it('TelemetryDashboard should be present and enabled', () => {
      const flag = flags.find((f) => f.FeatureName === 'TelemetryDashboard');
      expect(flag).toBeDefined();
      expect(flag!.Enabled).toBe(true);
    });
  });

  describe('dead flags must not exist', () => {
    it('TanStackRouterEnabled should NOT exist (removed Phase 7S5)', () => {
      expect(flags.find((f) => f.FeatureName === 'TanStackRouterEnabled')).toBeUndefined();
    });

    it('InfinitePaging_AuditCompliance should NOT exist (removed Phase 7S5)', () => {
      expect(flags.find((f) => f.FeatureName === 'InfinitePaging_AuditCompliance')).toBeUndefined();
    });

    it('InfinitePaging_OpsLogs should NOT exist (removed Phase 7S5)', () => {
      expect(flags.find((f) => f.FeatureName === 'InfinitePaging_OpsLogs')).toBeUndefined();
    });

    it('InfinitePaging_StartupRisk should NOT exist (removed Phase 7S5)', () => {
      expect(flags.find((f) => f.FeatureName === 'InfinitePaging_StartupRisk')).toBeUndefined();
    });

    it('LeadIntake should NOT exist (removed Batch 5B)', () => {
      expect(flags.find((f) => f.FeatureName === 'LeadIntake')).toBeUndefined();
    });

    it('GoNoGoScorecard should NOT exist (removed Batch 5B)', () => {
      expect(flags.find((f) => f.FeatureName === 'GoNoGoScorecard')).toBeUndefined();
    });

    it('PipelineDashboard should NOT exist (removed Batch 5B)', () => {
      expect(flags.find((f) => f.FeatureName === 'PipelineDashboard')).toBeUndefined();
    });

    it('EstimatingTracker should NOT exist (removed Batch 5B)', () => {
      expect(flags.find((f) => f.FeatureName === 'EstimatingTracker')).toBeUndefined();
    });

    it('ExecutiveDashboard should NOT exist (removed Batch 5B)', () => {
      expect(flags.find((f) => f.FeatureName === 'ExecutiveDashboard')).toBeUndefined();
    });

    it('TurnoverWorkflow should NOT exist (removed Batch 5C)', () => {
      expect(flags.find((f) => f.FeatureName === 'TurnoverWorkflow')).toBeUndefined();
    });

    it('ProjectStartup should NOT exist (removed Batch 5C)', () => {
      expect(flags.find((f) => f.FeatureName === 'ProjectStartup')).toBeUndefined();
    });

    it('MarketingProjectRecord should NOT exist (removed Batch 5C)', () => {
      expect(flags.find((f) => f.FeatureName === 'MarketingProjectRecord')).toBeUndefined();
    });

    it('ProjectManagementPlan should NOT exist (removed Batch 5C)', () => {
      expect(flags.find((f) => f.FeatureName === 'ProjectManagementPlan')).toBeUndefined();
    });

    it('MonthlyProjectReview should NOT exist (removed Batch 5C)', () => {
      expect(flags.find((f) => f.FeatureName === 'MonthlyProjectReview')).toBeUndefined();
    });

    it('ContractTracking should NOT exist (removed Batch 5C)', () => {
      expect(flags.find((f) => f.FeatureName === 'ContractTracking')).toBeUndefined();
    });

    it('ContractTrackingDevPreview should NOT exist (removed Batch 5C)', () => {
      expect(flags.find((f) => f.FeatureName === 'ContractTrackingDevPreview')).toBeUndefined();
    });

    it('ScheduleModule should NOT exist (removed Batch 5C)', () => {
      expect(flags.find((f) => f.FeatureName === 'ScheduleModule')).toBeUndefined();
    });

    it('ConstraintsLog should NOT exist (removed Batch 5C)', () => {
      expect(flags.find((f) => f.FeatureName === 'ConstraintsLog')).toBeUndefined();
    });

    it('AutoSiteProvisioning should NOT exist (removed Batch 5D)', () => {
      expect(flags.find((f) => f.FeatureName === 'AutoSiteProvisioning')).toBeUndefined();
    });

    it('PerformanceMonitoring should NOT exist (removed Batch 5D)', () => {
      expect(flags.find((f) => f.FeatureName === 'PerformanceMonitoring')).toBeUndefined();
    });

    it('LazyHeavyLibsV1 should NOT exist (removed Batch 5D)', () => {
      expect(flags.find((f) => f.FeatureName === 'LazyHeavyLibsV1')).toBeUndefined();
    });

    it('PhaseChunkingV1 should NOT exist (removed Batch 5D)', () => {
      expect(flags.find((f) => f.FeatureName === 'PhaseChunkingV1')).toBeUndefined();
    });

    it('VirtualizedListsV1 should NOT exist (removed Batch 5D)', () => {
      expect(flags.find((f) => f.FeatureName === 'VirtualizedListsV1')).toBeUndefined();
    });

    it('SiteProvisioningWizard should NOT exist (removed Batch 5D)', () => {
      expect(flags.find((f) => f.FeatureName === 'SiteProvisioningWizard')).toBeUndefined();
    });

    it('RoleConfigurationEngine should NOT exist (removed Batch 5D)', () => {
      expect(flags.find((f) => f.FeatureName === 'RoleConfigurationEngine')).toBeUndefined();
    });

    it('GraphBatchingEnabled should NOT exist (removed Batch 5D)', () => {
      expect(flags.find((f) => f.FeatureName === 'GraphBatchingEnabled')).toBeUndefined();
    });

    it('MeetingScheduler should NOT exist (removed Batch 5E)', () => {
      expect(flags.find((f) => f.FeatureName === 'MeetingScheduler')).toBeUndefined();
    });

    it('LossAutopsy should NOT exist (removed Batch 5E)', () => {
      expect(flags.find((f) => f.FeatureName === 'LossAutopsy')).toBeUndefined();
    });

    it('WorkflowDefinitions should NOT exist (removed Batch 5E)', () => {
      expect(flags.find((f) => f.FeatureName === 'WorkflowDefinitions')).toBeUndefined();
    });

    it('EnableHelpSystem should NOT exist (removed Batch 5E)', () => {
      expect(flags.find((f) => f.FeatureName === 'EnableHelpSystem')).toBeUndefined();
    });

    it('DevUserManagement should NOT exist (removed Batch 5E)', () => {
      expect(flags.find((f) => f.FeatureName === 'DevUserManagement')).toBeUndefined();
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

  describe('ID uniqueness and ordering', () => {
    it('IDs should be unique and sorted ascending', () => {
      const ids = flags.map((f) => f.id);
      const uniqueIds = [...new Set(ids)];
      expect(uniqueIds.length).toBe(ids.length);
      const sorted = [...ids].sort((a, b) => a - b);
      expect(ids).toEqual(sorted);
    });
  });
});
