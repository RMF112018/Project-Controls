import { IDataService } from './IDataService';
import { AuditAction, EntityType } from '../models/enums';
import { ITemplateRegistry } from '../models/ITemplateManifest';

/**
 * GitOpsProvisioningService — orchestrates template application from committed registry.
 * Used by ProvisioningService step 5 as the permanent template application path.
 */
export class GitOpsProvisioningService {
  constructor(private dataService: IDataService) {}

  /**
   * Fetch committed template registry from GitHub, filter by division,
   * apply applicable templates to the new project site.
   * Fire-and-forget audit log on success.
   */
  async applyTemplates(siteUrl: string, division: string): Promise<{ appliedCount: number }> {
    const registry: ITemplateRegistry = await this.dataService.getCommittedTemplateRegistry();
    const result = await this.dataService.applyGitOpsTemplates(siteUrl, division, registry);

    // Fire-and-forget audit log
    this.dataService.logAudit({
      Action: AuditAction.TemplateAppliedFromGitOps,
      EntityType: EntityType.TemplateRegistry,
      EntityId: siteUrl,
      User: 'system',
      Details: `Applied ${result.appliedCount} templates to ${siteUrl} (division: ${division}) via GitOps`,
    }).catch(console.error);

    return result;
  }
}
