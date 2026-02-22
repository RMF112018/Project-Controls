/**
 * ProvisioningService — Defaults & Phase 1 Enhancements
 *
 * Tests provisionSiteWithDefaults, Step 4 Entra ID sync integration,
 * and post-completion feature flag initialization.
 *
 * Uses the real MockDataService (not a manual mock) and EntraIdSyncService
 * directly. Fire-and-forget runSteps is handled by polling for completion.
 */
import { MockDataService } from '../MockDataService';
import { ProvisioningService } from '../ProvisioningService';
import { EntraIdSyncService } from '../EntraIdSyncService';
import { AuditAction, ProvisioningStatus } from '../../models/enums';
import type { IProvisioningInput } from '../../models/IProvisioningLog';
import type { ISiteProvisioningDefaults } from '../../models/ISiteProvisioningDefaults';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Poll MockDataService for provisioning completion (or failure).
 * Each simulated step takes 500ms; 7 steps = 3.5s + MockDataService delay overhead.
 * Polls every 100ms up to maxMs to keep tests tight.
 */
const waitForCompletion = async (
  ds: MockDataService,
  projectCode: string,
  maxMs = 10000
): Promise<void> => {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const status = await ds.getProvisioningStatus(projectCode);
    if (
      status?.status === ProvisioningStatus.Completed ||
      status?.status === ProvisioningStatus.Failed
    ) {
      return;
    }
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error(`Timed out waiting for provisioning to complete for ${projectCode}`);
};

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('ProvisioningService — Defaults & Phase 1 Enhancements', () => {
  let ds: MockDataService;
  let defaults: ISiteProvisioningDefaults;

  const validInput: IProvisioningInput = {
    leadId: 100,
    projectCode: 'PSD-001',
    projectName: 'Provisioning Defaults Test',
    clientName: 'Test Client',
    division: 'Commercial',
    region: 'Southeast',
    requestedBy: 'admin@hbc.com',
  };

  beforeEach(async () => {
    ds = new MockDataService();
    defaults = await ds.getSiteProvisioningDefaults();
  });

  // ---------- 1. Validation is invoked ----------

  it('provisionSiteWithDefaults calls validateProvisioningInput', async () => {
    const service = new ProvisioningService(ds);
    const spy = jest.spyOn(ds, 'validateProvisioningInput');
    await service.provisionSiteWithDefaults(validInput, defaults);
    expect(spy).toHaveBeenCalledWith(validInput);
  });

  // ---------- 2. Validation failure throws ----------

  it('provisionSiteWithDefaults throws on validation failure', async () => {
    const service = new ProvisioningService(ds);
    jest.spyOn(ds, 'validateProvisioningInput').mockResolvedValueOnce({
      isValid: false,
      errors: ['Project code is required', 'Project name is required'],
      warnings: [],
    });
    await expect(
      service.provisionSiteWithDefaults(validInput, defaults)
    ).rejects.toThrow('Provisioning validation failed');
  });

  // ---------- 3. Returns provisioning log on success ----------

  it('provisionSiteWithDefaults returns provisioning log on success', async () => {
    const service = new ProvisioningService(ds);
    const log = await service.provisionSiteWithDefaults(validInput, defaults);
    expect(log).toBeDefined();
    expect(log.projectCode).toBe('PSD-001');
    expect(log.status).toBe(ProvisioningStatus.Queued);
  });

  // ---------- 4. Constructor backward compatible (7 params) ----------

  it('constructor backward compatible with 7 params', () => {
    const svc = new ProvisioningService(
      ds, undefined, undefined, undefined, false, false, false
    );
    expect(svc).toBeDefined();
  });

  // ---------- 5. Constructor accepts 8th param (EntraIdSyncService) ----------

  it('constructor accepts EntraIdSyncService as 8th param', () => {
    const entraService = new EntraIdSyncService(ds, false);
    const svc = new ProvisioningService(
      ds, undefined, undefined, undefined, false, false, false, entraService
    );
    expect(svc).toBeDefined();
  });

  // ---------- 6. Step 4 calls syncGroupsForProject (useRealOps=true) ----------

  it('Step 4 calls syncGroupsForProject when entraIdSyncService is provided', async () => {
    const entraService = new EntraIdSyncService(ds, false);
    const spy = jest.spyOn(entraService, 'syncGroupsForProject');
    const svc = new ProvisioningService(
      ds, undefined, undefined, undefined, false, /* useRealOps */ true, false, entraService
    );

    const input: IProvisioningInput = {
      ...validInput,
      projectCode: 'ENTRA-001',
    };
    await svc.provisionSiteWithDefaults(input, defaults);
    await waitForCompletion(ds, 'ENTRA-001');

    expect(spy).toHaveBeenCalledWith(
      'ENTRA-001',
      expect.any(String),            // siteUrl produced by createProjectSite
      expect.any(Array),             // teamAssignments from getProjectTeamAssignments
      defaults.roleToGroupMappings
    );
  }, 15000);

  // ---------- 7. Step 4 skips Entra sync when no entraIdSyncService ----------

  it('Step 4 skips Entra sync when no entraIdSyncService', async () => {
    const spy = jest.spyOn(ds, 'syncEntraGroupsForProject');
    const svc = new ProvisioningService(
      ds, undefined, undefined, undefined, false, /* useRealOps */ true, false
    );

    const input: IProvisioningInput = {
      ...validInput,
      projectCode: 'SKIP-001',
    };
    await svc.provisionSiteWithDefaults(input, defaults);
    await waitForCompletion(ds, 'SKIP-001');

    // syncEntraGroupsForProject is on MockDataService; it should NOT be called
    // directly because EntraIdSyncService was never provided to ProvisioningService.
    expect(spy).not.toHaveBeenCalled();
  }, 15000);

  // ---------- 8. Step 4 continues on Entra sync error (non-blocking) ----------

  it('Step 4 continues on Entra sync error', async () => {
    const entraService = new EntraIdSyncService(ds, false);
    jest
      .spyOn(entraService, 'syncGroupsForProject')
      .mockRejectedValueOnce(new Error('Graph API down'));
    const svc = new ProvisioningService(
      ds, undefined, undefined, undefined, false, /* useRealOps */ true, false, entraService
    );

    const input: IProvisioningInput = {
      ...validInput,
      projectCode: 'ERRSYNC-001',
    };
    await svc.provisionSiteWithDefaults(input, defaults);
    await waitForCompletion(ds, 'ERRSYNC-001');

    const status = await ds.getProvisioningStatus('ERRSYNC-001');
    expect(status?.status).toBe(ProvisioningStatus.Completed);
  }, 15000);

  // ---------- 9. Feature flags initialized after completion ----------

  it('feature flags initialized after completion', async () => {
    const svc = new ProvisioningService(ds);
    const input: IProvisioningInput = {
      ...validInput,
      leadId: 1, // Must reference an existing mock lead so updateLead succeeds
      projectCode: 'FLAGS-001',
    };
    await svc.provisionSiteWithDefaults(input, defaults);
    await waitForCompletion(ds, 'FLAGS-001');
    // Extra wait for post-completion async (feature flag init, notification, hub nav)
    await new Promise(r => setTimeout(r, 500));

    const flags = await ds.getProjectFeatureFlags('FLAGS-001');
    expect(flags.length).toBe(defaults.defaultProjectFeatureFlags.length);
    // Verify the flag names match the defaults
    const flagNames = flags.map(f => f.FeatureName).sort();
    const defaultNames = defaults.defaultProjectFeatureFlags.map(d => d.featureName).sort();
    expect(flagNames).toEqual(defaultNames);
  }, 15000);

  // ---------- 10. Feature flag init audit logged ----------

  it('feature flag init audit logged with ProjectFeatureFlagsInitialized', async () => {
    const svc = new ProvisioningService(ds);
    const input: IProvisioningInput = {
      ...validInput,
      leadId: 1, // Must reference an existing mock lead so updateLead succeeds
      projectCode: 'FLAGAUDIT-001',
    };
    await svc.provisionSiteWithDefaults(input, defaults);
    await waitForCompletion(ds, 'FLAGAUDIT-001');
    // Extra wait for post-completion async (feature flag init, audit log)
    await new Promise(r => setTimeout(r, 500));

    const audits = await ds.getAuditLog();
    const match = audits.find(
      a =>
        a.Action === AuditAction.ProjectFeatureFlagsInitialized &&
        a.ProjectCode === 'FLAGAUDIT-001'
    );
    expect(match).toBeDefined();
  }, 15000);
});
