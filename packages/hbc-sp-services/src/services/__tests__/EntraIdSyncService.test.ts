import { MockDataService } from '../MockDataService';
import { EntraIdSyncService } from '../EntraIdSyncService';
import { AuditAction } from '../../models/enums';
import type { IRoleGroupMapping } from '../../models/ISiteProvisioningDefaults';
import type { IProjectTeamAssignment } from '../../models/IPermissionTemplate';

describe('EntraIdSyncService', () => {
  let ds: MockDataService;
  let service: EntraIdSyncService;

  const defaultMappings: IRoleGroupMapping[] = [
    { roleName: 'Executive Leadership', spGroupType: 'Owners' },
    { roleName: 'Operations Team', spGroupType: 'Members' },
    { roleName: 'Accounting Manager', spGroupType: 'Visitors' },
  ];

  beforeEach(() => {
    ds = new MockDataService();
    service = new EntraIdSyncService(ds, false);
  });

  // 1. Constructor accepts dataService and useRealOps
  it('constructor accepts dataService and useRealOps', () => {
    expect(service).toBeDefined();
    const realService = new EntraIdSyncService(ds, true);
    expect(realService).toBeDefined();
  });

  // 2. syncGroupsForProject delegates to dataService.syncEntraGroupsForProject
  it('syncGroupsForProject delegates to dataService', async () => {
    const spy = jest.spyOn(ds, 'syncEntraGroupsForProject');
    await service.syncGroupsForProject('TEST-001', 'https://test.sharepoint.com/sites/TEST-001', [], defaultMappings);
    expect(spy).toHaveBeenCalledWith('TEST-001', 'https://test.sharepoint.com/sites/TEST-001', [], defaultMappings);
  });

  // 3. syncGroupsForProject logs completion audit on success
  it('logs completion audit on success', async () => {
    await service.syncGroupsForProject('TEST-002', 'https://test.sharepoint.com/sites/TEST-002', [], defaultMappings);
    const audits = await ds.getAuditLog();
    const match = audits.find(a => a.Action === AuditAction.EntraGroupSyncCompleted && a.EntityId === 'TEST-002');
    expect(match).toBeDefined();
  });

  // 4. syncGroupsForProject uses correlation ID in snapshot
  it('uses correlation ID in snapshot', async () => {
    await service.syncGroupsForProject('TEST-003', 'https://test.sharepoint.com', [], defaultMappings);
    const audits = await ds.getAuditLog();
    // The logAuditWithSnapshot call stores JSON in Details — find the one with a correlationId
    const match = audits.find(a => {
      if (a.EntityId !== 'TEST-003') return false;
      try {
        const parsed = JSON.parse(a.Details);
        return parsed.correlationId !== undefined;
      } catch {
        return false;
      }
    });
    expect(match).toBeDefined();
    const parsed = JSON.parse(match!.Details);
    expect(parsed.correlationId).toMatch(/^entra-TEST-003-/);
  });

  // 5. Returns comprehensive IEntraGroupSyncResult
  it('returns comprehensive IEntraGroupSyncResult', async () => {
    const result = await service.syncGroupsForProject('TEST-004', 'https://test.sharepoint.com', [], defaultMappings);
    expect(result.projectCode).toBe('TEST-004');
    expect(result.groupsCreated).toBeDefined();
    expect(result.membersAdded).toBeDefined();
    expect(result.errors).toBeDefined();
    expect(result.timestamp).toBeTruthy();
  });

  // 6. Handles empty teamAssignments array gracefully
  it('handles empty teamAssignments gracefully', async () => {
    const result = await service.syncGroupsForProject('TEST-005', 'https://test.sharepoint.com', [], defaultMappings);
    expect(result).toBeDefined();
    // MockDataService always creates 3 groups (Owners, Members, Visitors) regardless of team assignments
    expect(result.groupsCreated.length).toBe(3);
    expect(result.membersAdded.length).toBe(0);
  });

  // 7. Handles empty roleGroupMappings gracefully
  it('handles empty roleGroupMappings gracefully', async () => {
    const result = await service.syncGroupsForProject('TEST-006', 'https://test.sharepoint.com', [], []);
    expect(result).toBeDefined();
    // MockDataService always creates 3 groups (hardcoded group types)
    expect(result.groupsCreated.length).toBe(3);
  });

  // 8. syncGroupsForProject logs failure audit when errors exist
  it('logs failure audit when sync has errors', async () => {
    // Spy on syncEntraGroupsForProject to return a result with errors
    jest.spyOn(ds, 'syncEntraGroupsForProject').mockResolvedValueOnce({
      projectCode: 'ERR-001',
      groupsCreated: [],
      membersAdded: [],
      errors: [{ operation: 'CreateGroup', message: 'Graph API failure' }],
      timestamp: new Date().toISOString(),
    });

    await service.syncGroupsForProject('ERR-001', 'https://test.sharepoint.com', [], defaultMappings);
    const audits = await ds.getAuditLog();
    // EntraIdSyncService checks result.errors.length > 0 and logs EntraGroupSyncFailed
    const match = audits.find(a => a.Action === AuditAction.EntraGroupSyncFailed && a.EntityId === 'ERR-001');
    expect(match).toBeDefined();
    const parsed = JSON.parse(match!.Details);
    expect(parsed.after.errors).toBe(1);
  });
});
