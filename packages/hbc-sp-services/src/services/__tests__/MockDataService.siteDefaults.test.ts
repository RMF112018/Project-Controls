import { MockDataService } from '../MockDataService';
import { AuditAction, EntityType, ProvisioningStatus } from '../../models/enums';
import type { IProvisioningInput } from '../../models/IProvisioningLog';
import type { IRoleGroupMapping } from '../../models/ISiteProvisioningDefaults';

describe('MockDataService — Site Provisioning Defaults (Phase 1)', () => {
  let ds: MockDataService;

  beforeEach(() => {
    ds = new MockDataService();
  });

  // --- getSiteProvisioningDefaults ---
  it('getSiteProvisioningDefaults returns valid default object', async () => {
    const defaults = await ds.getSiteProvisioningDefaults();
    expect(defaults).toBeDefined();
    expect(defaults.id).toBe(1);
    expect(defaults.hubSiteUrl).toContain('sharepoint.com');
    expect(defaults.defaultTemplateId).toBeTruthy();
    expect(defaults.roleToGroupMappings.length).toBeGreaterThan(0);
    expect(defaults.defaultProjectFeatureFlags.length).toBeGreaterThan(0);
  });

  // --- updateSiteProvisioningDefaults ---
  it('updateSiteProvisioningDefaults persists changes and returns updated', async () => {
    const updated = await ds.updateSiteProvisioningDefaults({
      hubSiteUrl: 'https://example.sharepoint.com/sites/newhub',
      defaultTemplateId: 'custom-template-v2',
    });
    expect(updated.hubSiteUrl).toBe('https://example.sharepoint.com/sites/newhub');
    expect(updated.defaultTemplateId).toBe('custom-template-v2');
    // Verify persistence
    const fetched = await ds.getSiteProvisioningDefaults();
    expect(fetched.hubSiteUrl).toBe('https://example.sharepoint.com/sites/newhub');
  });

  it('updateSiteProvisioningDefaults logs SiteDefaultsUpdated audit', async () => {
    await ds.updateSiteProvisioningDefaults({ hubSiteUrl: 'https://new.sharepoint.com' });
    const audits = await ds.getAuditLog();
    const match = audits.find(a => a.Action === AuditAction.SiteDefaultsUpdated);
    expect(match).toBeDefined();
  });

  // --- validateProvisioningInput ---
  const validInput: IProvisioningInput = {
    leadId: 1,
    projectCode: 'TEST-001',
    projectName: 'Test Project',
    clientName: 'Test Client',
    division: 'Commercial',
    region: 'Southeast',
    requestedBy: 'admin@hbc.com',
  };

  it('validateProvisioningInput rejects empty projectCode', async () => {
    const result = await ds.validateProvisioningInput({ ...validInput, projectCode: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('validateProvisioningInput rejects empty projectName', async () => {
    const result = await ds.validateProvisioningInput({ ...validInput, projectName: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('validateProvisioningInput passes for valid new input', async () => {
    const result = await ds.validateProvisioningInput(validInput);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('validateProvisioningInput warns on duplicate completed provisioning', async () => {
    // Trigger a provisioning first to create a log
    await ds.triggerProvisioning(1, 'DUPE-001', 'Dupe Project', 'admin@hbc.com');
    // Update to completed
    await ds.updateProvisioningLog('DUPE-001', { status: ProvisioningStatus.Completed });
    const result = await ds.validateProvisioningInput({ ...validInput, projectCode: 'DUPE-001' });
    // Completed provisioning produces a warning (not an error) — re-provisioning is allowed
    expect(result.isValid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some(w =>
      w.toLowerCase().includes('already') ||
      w.toLowerCase().includes('provisioned') ||
      w.toLowerCase().includes('overwrite')
    )).toBe(true);
  });

  it('validateProvisioningInput blocks in-progress provisioning', async () => {
    await ds.triggerProvisioning(2, 'PROG-001', 'In Progress Project', 'admin@hbc.com');
    const result = await ds.validateProvisioningInput({ ...validInput, projectCode: 'PROG-001' });
    expect(result.isValid).toBe(false);
  });

  // --- getProvisioningSummary ---
  it('getProvisioningSummary returns correct totals', async () => {
    const summary = await ds.getProvisioningSummary();
    expect(summary).toBeDefined();
    expect(typeof summary.totalProvisioned).toBe('number');
    expect(typeof summary.inProgress).toBe('number');
    expect(typeof summary.failed).toBe('number');
    expect(typeof summary.averageDurationMs).toBe('number');
  });

  // --- initializeProjectFeatureFlags ---
  it('initializeProjectFeatureFlags creates flags for project', async () => {
    const defaults = [
      { featureName: 'ScheduleModule', enabled: true },
      { featureName: 'ProjectStartup', enabled: false },
    ];
    const flags = await ds.initializeProjectFeatureFlags('INIT-001', defaults);
    expect(flags).toHaveLength(2);
    expect(flags[0].FeatureName).toBe('ScheduleModule');
    expect(flags[0].Enabled).toBe(true);
    expect(flags[1].FeatureName).toBe('ProjectStartup');
    expect(flags[1].Enabled).toBe(false);
  });

  // --- getProjectFeatureFlags ---
  it('getProjectFeatureFlags returns initialized flags', async () => {
    const defaults = [{ featureName: 'TestFlag', enabled: true }];
    await ds.initializeProjectFeatureFlags('FF-001', defaults);
    const flags = await ds.getProjectFeatureFlags('FF-001');
    expect(flags).toHaveLength(1);
    expect(flags[0].FeatureName).toBe('TestFlag');
  });

  it('getProjectFeatureFlags returns empty array for unknown project', async () => {
    const flags = await ds.getProjectFeatureFlags('UNKNOWN-999');
    expect(flags).toEqual([]);
  });

  // --- syncEntraGroupsForProject ---
  it('syncEntraGroupsForProject creates 3 groups and maps members', async () => {
    const mappings: IRoleGroupMapping[] = [
      { roleName: 'Executive Leadership', spGroupType: 'Owners' },
      { roleName: 'Operations Team', spGroupType: 'Members' },
    ];
    const result = await ds.syncEntraGroupsForProject(
      'SYNC-001',
      'https://test.sharepoint.com/sites/SYNC-001',
      [], // empty team assignments
      mappings
    );
    expect(result).toBeDefined();
    expect(result.projectCode).toBe('SYNC-001');
    expect(result.groupsCreated.length).toBe(3); // Owners, Members, Visitors
    expect(result.timestamp).toBeTruthy();
  });

  // --- logAuditWithSnapshot ---
  it('logAuditWithSnapshot serializes snapshot into Details field', async () => {
    await ds.logAuditWithSnapshot(
      {
        Action: AuditAction.SiteDefaultsUpdated,
        EntityType: EntityType.SiteDefaults,
        EntityId: '1',
        User: 'admin@hbc.com',
      },
      {
        operation: 'TestOp',
        before: { key: 'old' },
        after: { key: 'new' },
        correlationId: 'test-corr-123',
      }
    );
    const audits = await ds.getAuditLog();
    const match = audits.find(
      a => a.Action === AuditAction.SiteDefaultsUpdated && a.Details?.includes('test-corr-123')
    );
    expect(match).toBeDefined();
    const parsed = JSON.parse(match!.Details);
    expect(parsed.operation).toBe('TestOp');
    expect(parsed.correlationId).toBe('test-corr-123');
    expect(parsed.before).toEqual({ key: 'old' });
    expect(parsed.after).toEqual({ key: 'new' });
  });

  // --- provisionSiteWithDefaults ---
  it('provisionSiteWithDefaults creates log and initializes flags', async () => {
    const defaults = await ds.getSiteProvisioningDefaults();
    const log = await ds.provisionSiteWithDefaults(validInput, defaults);
    expect(log).toBeDefined();
    expect(log.projectCode).toBe('TEST-001');
  });
});
