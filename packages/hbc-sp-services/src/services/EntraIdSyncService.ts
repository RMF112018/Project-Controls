import { IDataService } from './IDataService';
import type { IProjectTeamAssignment, IRoleGroupMapping } from '../models';
import type { IEntraGroupSyncResult } from '../models/IEntraGroupSyncResult';
import { AuditAction, EntityType } from '../models/enums';

/**
 * Orchestrates Entra ID group creation and membership sync during provisioning.
 * In mock mode (useRealOps=false), delegates entirely to IDataService mock stubs.
 * In real mode, would call Graph API — placeholder for future Phase 2/3 implementation.
 */
export class EntraIdSyncService {
  private dataService: IDataService;
  private useRealOps: boolean;

  constructor(
    dataService: IDataService,
    useRealOps: boolean = false
  ) {
    this.dataService = dataService;
    this.useRealOps = useRealOps;
  }

  async syncGroupsForProject(
    projectCode: string,
    siteUrl: string,
    teamAssignments: IProjectTeamAssignment[],
    roleGroupMappings: IRoleGroupMapping[]
  ): Promise<IEntraGroupSyncResult> {
    const correlationId = `entra-${projectCode}-${Date.now()}`;

    // In both mock and real modes, delegate to IDataService for data consistency
    const result = await this.dataService.syncEntraGroupsForProject(
      projectCode, siteUrl, teamAssignments, roleGroupMappings
    );

    // Log completion audit with snapshot
    await this.dataService.logAuditWithSnapshot(
      {
        Action: result.errors.length > 0
          ? AuditAction.EntraGroupSyncFailed
          : AuditAction.EntraGroupSyncCompleted,
        EntityType: EntityType.Project,
        EntityId: projectCode,
        ProjectCode: projectCode,
        User: 'system',
      },
      {
        operation: 'EntraGroupSync',
        before: null,
        after: {
          groupsCreated: result.groupsCreated.length,
          membersAdded: result.membersAdded.filter(m => m.success).length,
          errors: result.errors.length,
        },
        correlationId,
      }
    );

    return result;
  }
}
