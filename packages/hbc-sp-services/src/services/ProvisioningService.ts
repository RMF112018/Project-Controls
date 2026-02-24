import { IDataService } from './IDataService';
import { NotificationService } from './NotificationService';
import { PowerAutomateService } from './PowerAutomateService';
import { OfflineQueueService } from './OfflineQueueService';
import { IHubNavigationService } from './HubNavigationService';
import { GitOpsProvisioningService } from './GitOpsProvisioningService';
import { IProvisioningLog, IProvisioningInput, ProvisioningStatus, PROVISIONING_STEPS, TOTAL_PROVISIONING_STEPS, NotificationEvent, AuditAction, EntityType } from '../models';
import type { ISiteProvisioningDefaults } from '../models/ISiteProvisioningDefaults';
import { HubNavLinkStatus } from '../models/IProvisioningLog';
import { getBuyoutLogSchema, getActiveProjectsPortfolioSchema } from '../utils/projectListSchemas';
import type { EntraIdSyncService } from './EntraIdSyncService';
import { ProvisioningSaga } from './ProvisioningSaga';
import { graphBatchEnforcer } from './GraphBatchEnforcer';
import { listThresholdGuard } from '../utils/ListThresholdGuard';
import type { SignalRMessage } from '../models/ISignalRMessage';

// Re-export for backward compatibility (moved to models/IProvisioningLog.ts)
export type { IProvisioningInput } from '../models';

const STEP_DELAY_MS = 500;
const MAX_RETRIES = 3;
const PROVISIONING_CONSTANTS = {
  DEFAULT_SITE_BASE: 'https://hedrickbrotherscom.sharepoint.com/sites/',
};

export class ProvisioningService {
  private dataService: IDataService;
  private notificationService: NotificationService;
  private hubNavService?: IHubNavigationService;
  private powerAutomateService?: PowerAutomateService;
  private offlineQueueService?: OfflineQueueService;
  private usePowerAutomate: boolean;
  private useRealOps: boolean;
  private useGitOpsProvisioning: boolean;
  private entraIdSyncService?: EntraIdSyncService;
  private siteDefaults?: ISiteProvisioningDefaults;
  private isFeatureEnabled?: (flag: string) => boolean;
  private signalRBroadcast?: (msg: SignalRMessage) => void;

  constructor(
    dataService: IDataService,
    hubNavService?: IHubNavigationService,
    powerAutomateService?: PowerAutomateService,
    offlineQueueService?: OfflineQueueService,
    usePowerAutomate?: boolean,
    useRealOps?: boolean,
    useGitOpsProvisioning?: boolean,
    entraIdSyncService?: EntraIdSyncService,
    isFeatureEnabled?: (flag: string) => boolean,
    signalRBroadcast?: (msg: SignalRMessage) => void
  ) {
    this.dataService = dataService;
    this.notificationService = new NotificationService(dataService);
    this.hubNavService = hubNavService;
    this.powerAutomateService = powerAutomateService;
    this.offlineQueueService = offlineQueueService;
    this.usePowerAutomate = usePowerAutomate ?? false;
    this.useRealOps = useRealOps ?? false;
    this.useGitOpsProvisioning = useGitOpsProvisioning ?? false;
    this.entraIdSyncService = entraIdSyncService;
    this.isFeatureEnabled = isFeatureEnabled;
    this.signalRBroadcast = signalRBroadcast;
  }

  /**
   * Kick off the full 7-step provisioning sequence.
   * In mock mode each step simulates with a 500ms delay.
   * Returns the initial provisioning log; consumers should poll
   * getProvisioningStatus() for progress updates.
   */
  public async provisionSite(input: IProvisioningInput): Promise<IProvisioningLog> {
    // Create the provisioning log entry
    const log = await this.dataService.triggerProvisioning(
      input.leadId,
      input.projectCode,
      input.projectName,
      input.requestedBy,
      { division: input.division, region: input.region, clientName: input.clientName }
    );

    // Fire-and-forget audit log for provisioning trigger
    this.dataService.logAudit({
      Action: AuditAction.SiteProvisioningTriggered,
      EntityType: EntityType.Project,
      EntityId: String(input.leadId),
      ProjectCode: input.projectCode,
      User: input.requestedBy,
      Details: `Site provisioning triggered for "${input.projectName}" (${input.projectCode})`,
    }).catch(console.error);

    // Phase 5C: Dual-path — saga with compensation when flag ON, legacy runSteps when OFF
    if (this.isFeatureEnabled?.('ProvisioningSaga')) {
      const saga = new ProvisioningSaga(this.dataService, this.signalRBroadcast, graphBatchEnforcer, listThresholdGuard);
      saga.execute(input).then(result => {
        if (result.success && result.siteUrl) {
          this.handlePostCompletion(input, result.siteUrl).catch(console.error);
        }
      }).catch(console.error);
    } else {
      // Unchanged legacy path
      this.runSteps(input).catch(console.error);
    }

    return log;
  }

  /**
   * Provision with a three-tier fallback chain:
   * 1. PowerAutomate (if usePowerAutomate=true)
   * 2. Local 7-step engine (provisionSite)
   * 3. Offline queue (if offlineQueueService provided)
   */
  public async provisionSiteWithFallback(input: IProvisioningInput): Promise<IProvisioningLog> {
    // Try 1: Power Automate
    if (this.usePowerAutomate && this.powerAutomateService) {
      try {
        await this.powerAutomateService.triggerProvisioning({
          leadId: input.leadId,
          projectCode: input.projectCode,
          projectName: input.projectName,
          clientName: input.clientName,
          division: input.division,
          region: input.region,
          sector: '',
          requestedBy: input.requestedBy,
          requestedAt: new Date().toISOString(),
        });
        // PA accepted — create log and return
        const log = await this.dataService.triggerProvisioning(
          input.leadId, input.projectCode, input.projectName, input.requestedBy
        );
        this.dataService.logAudit({
          Action: AuditAction.SiteProvisioningTriggered,
          EntityType: EntityType.Project,
          EntityId: String(input.leadId),
          ProjectCode: input.projectCode,
          User: input.requestedBy,
          Details: `Site provisioning triggered via Power Automate for "${input.projectName}" (${input.projectCode})`,
        }).catch(console.error);
        return log;
      } catch (err) {
        // PA failed — log warning and fall through
        this.dataService.logAudit({
          Action: AuditAction.SiteProvisioningTriggered,
          EntityType: EntityType.Project,
          EntityId: String(input.leadId),
          ProjectCode: input.projectCode,
          User: input.requestedBy,
          Details: `Power Automate provisioning failed, falling back to local engine: ${err instanceof Error ? err.message : String(err)}`,
        }).catch(console.error);
      }
    }

    // Try 2: Local 7-step engine
    try {
      return await this.provisionSite(input);
    } catch (localErr) {
      // Local engine failed — try offline queue
      if (this.offlineQueueService) {
        this.offlineQueueService.enqueue('create', 'provisioning', input);
        const log = await this.dataService.triggerProvisioning(
          input.leadId, input.projectCode, input.projectName, input.requestedBy
        );
        this.dataService.logAudit({
          Action: AuditAction.SiteProvisioningTriggered,
          EntityType: EntityType.Project,
          EntityId: String(input.leadId),
          ProjectCode: input.projectCode,
          User: input.requestedBy,
          Details: `Provisioning queued offline for "${input.projectName}" (${input.projectCode})`,
        }).catch(console.error);
        return log;
      }
      throw localErr;
    }
  }

  /**
   * Provision with site defaults: validates input, stores defaults for use
   * by Step 4 (Entra sync) and post-completion (feature flag init).
   */
  public async provisionSiteWithDefaults(
    input: IProvisioningInput,
    defaults: ISiteProvisioningDefaults
  ): Promise<IProvisioningLog> {
    const validation = await this.dataService.validateProvisioningInput(input);
    if (!validation.isValid) {
      throw new Error(`Provisioning validation failed: ${validation.errors.join('; ')}`);
    }
    this.siteDefaults = defaults;
    return this.provisionSite(input);
  }

  /**
   * Run through provisioning steps sequentially.
   * Updates the provisioning log at each step.
   */
  private async runSteps(input: IProvisioningInput): Promise<void> {
    const { projectCode } = input;
    const siteSuffix = input.siteNameOverride
      ? input.siteNameOverride.replace(/[^a-zA-Z0-9-]/g, '')
      : projectCode.replace(/-/g, '');
    let siteUrl = '';
    const hubSiteUrl = await this.dataService.getHubSiteUrl();

    for (let step = 1; step <= TOTAL_PROVISIONING_STEPS; step++) {
      await this.dataService.updateProvisioningLog(projectCode, {
        status: ProvisioningStatus.InProgress,
        currentStep: step,
        completedSteps: step - 1,
      });

      try {
        const result = await this.executeStep(step, input, siteUrl, siteSuffix, hubSiteUrl);
        if (step === 1 && typeof result === 'string') siteUrl = result;
      } catch (err) {
        await this.dataService.updateProvisioningLog(projectCode, {
          status: ProvisioningStatus.Failed,
          failedStep: step,
          errorMessage: err instanceof Error ? err.message : String(err),
        });
        throw err;
      }

      await this.dataService.updateProvisioningLog(projectCode, {
        currentStep: step,
        completedSteps: step,
      });
    }

    // All steps done — mark completed with site URL
    await this.dataService.updateProvisioningLog(projectCode, {
      status: ProvisioningStatus.Completed,
      currentStep: TOTAL_PROVISIONING_STEPS,
      completedSteps: TOTAL_PROVISIONING_STEPS,
      siteUrl,
      completedAt: new Date().toISOString(),
    });

    const log = await this.dataService.getProvisioningStatus(projectCode);
    if (log) {
      await this.dataService.updateLead(log.leadId, { ProjectSiteURL: siteUrl });
      this.notificationService.notify(
        NotificationEvent.SiteProvisioned,
        { projectCode, siteUrl, leadTitle: input.projectName },
        input.requestedBy
      ).catch(console.error);
      this.dataService.logAudit({
        Action: AuditAction.SiteProvisioningCompleted,
        EntityType: EntityType.Project,
        EntityId: String(log.leadId),
        ProjectCode: projectCode,
        User: input.requestedBy,
        Details: `Site provisioning completed for "${input.projectName}" (${projectCode}). Site URL: ${siteUrl}`,
      }).catch(console.error);

      // Initialize project feature flags from defaults (non-blocking)
      if (this.siteDefaults?.defaultProjectFeatureFlags?.length) {
        try {
          await this.dataService.initializeProjectFeatureFlags(
            projectCode, this.siteDefaults.defaultProjectFeatureFlags
          );
          this.dataService.logAudit({
            Action: AuditAction.ProjectFeatureFlagsInitialized,
            EntityType: EntityType.Config,
            EntityId: projectCode,
            ProjectCode: projectCode,
            User: input.requestedBy,
            Details: `Initialized ${this.siteDefaults.defaultProjectFeatureFlags.length} feature flags`,
          }).catch(console.error);
        } catch (err) {
          console.warn(`[Provisioning] Feature flag init failed for ${projectCode}:`, err);
        }
      }

      this.addHubNavLink(projectCode, input.projectName, siteUrl, input.requestedBy)
        .catch(console.error);
    }
  }

  /**
   * Post-completion handler: notifications, audit, feature flags, hub nav.
   * Called by both legacy runSteps path and saga path.
   */
  private async handlePostCompletion(input: IProvisioningInput, siteUrl: string): Promise<void> {
    const { projectCode } = input;
    this.notificationService.notify(
      NotificationEvent.SiteProvisioned,
      { projectCode, siteUrl, leadTitle: input.projectName },
      input.requestedBy
    ).catch(console.error);
    this.dataService.logAudit({
      Action: AuditAction.SiteProvisioningCompleted,
      EntityType: EntityType.Project,
      EntityId: String(input.leadId),
      ProjectCode: projectCode,
      User: input.requestedBy,
      Details: `Site provisioning completed for "${input.projectName}" (${projectCode}). Site URL: ${siteUrl}`,
    }).catch(console.error);

    // Initialize project feature flags from defaults (non-blocking)
    if (this.siteDefaults?.defaultProjectFeatureFlags?.length) {
      try {
        await this.dataService.initializeProjectFeatureFlags(
          projectCode, this.siteDefaults.defaultProjectFeatureFlags
        );
        this.dataService.logAudit({
          Action: AuditAction.ProjectFeatureFlagsInitialized,
          EntityType: EntityType.Config,
          EntityId: projectCode,
          ProjectCode: projectCode,
          User: input.requestedBy,
          Details: `Initialized ${this.siteDefaults.defaultProjectFeatureFlags.length} feature flags`,
        }).catch(console.error);
      } catch (err) {
        console.warn(`[Provisioning] Feature flag init failed for ${projectCode}:`, err);
      }
    }

    this.addHubNavLink(projectCode, input.projectName, siteUrl, input.requestedBy)
      .catch(console.error);
  }

  /**
   * Execute a single provisioning step.
   * When useRealOps is false, delegates to simulateStep().
   * When true, dispatches to real IDataService methods.
   */
  private async executeStep(
    step: number, input: IProvisioningInput,
    siteUrl: string, siteAlias: string, hubSiteUrl: string
  ): Promise<string | void> {
    if (!this.useRealOps) {
      await this.simulateStep(step);
      return step === 1 ? `${PROVISIONING_CONSTANTS.DEFAULT_SITE_BASE}${siteAlias}` : undefined;
    }
    switch (step) {
      case 1: {
        const result = await this.dataService.createProjectSite(input.projectCode, input.projectName, siteAlias);
        return result.siteUrl;
      }
      case 2: await this.dataService.provisionProjectLists(siteUrl, input.projectCode); break;
      case 3: await this.dataService.associateWithHubSite(siteUrl, hubSiteUrl); break;
      case 4:
        await this.dataService.createProjectSecurityGroups(siteUrl, input.projectCode, input.division);
        // Entra ID group sync if service and defaults available
        if (this.entraIdSyncService && this.siteDefaults) {
          try {
            const teamAssignments = await this.dataService.getProjectTeamAssignments(input.projectCode);
            await this.entraIdSyncService.syncGroupsForProject(
              input.projectCode, siteUrl, teamAssignments, this.siteDefaults.roleToGroupMappings
            );
          } catch (err) {
            // Non-blocking: log but don't fail the provisioning step
            console.warn(`[Provisioning] Entra group sync error for ${input.projectCode}:`, err);
          }
        }
        break;
      case 5:
        if (this.useGitOpsProvisioning) {
          await new GitOpsProvisioningService(this.dataService).applyTemplates(siteUrl, input.division);
        } else {
          await this.dataService.copyTemplateFiles(siteUrl, input.projectCode, input.division);
        }
        break;
      case 6: await this.dataService.copyLeadDataToProjectSite(siteUrl, input.leadId, input.projectCode); break;
      case 7: break; // Handled post-loop via updateLead()
      default: throw new Error(`Unknown provisioning step: ${step}`);
    }
  }

  /**
   * Simulate a single provisioning step with a delay.
   */
  private simulateStep(_step: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, STEP_DELAY_MS));
  }

  /**
   * Retry provisioning from a specific failed step.
   */
  public async retryFromStep(projectCode: string, fromStep: number): Promise<IProvisioningLog> {
    // Check retry count before allowing retry
    const currentLog = await this.dataService.getProvisioningStatus(projectCode);
    if (currentLog && currentLog.retryCount >= MAX_RETRIES) {
      throw new Error(`Maximum retries (${MAX_RETRIES}) exceeded for project ${projectCode}. Manual intervention required.`);
    }

    const log = await this.dataService.retryProvisioning(projectCode, fromStep);

    // Resume steps from the failed step
    if (log) {
      this.resumeSteps(projectCode, fromStep).catch(console.error);
    }

    return log;
  }

  /**
   * Resume step execution from a given step number.
   */
  private async resumeSteps(projectCode: string, fromStep: number): Promise<void> {
    const log = await this.dataService.getProvisioningStatus(projectCode);
    let siteUrl = log?.siteUrl || '';
    const hubSiteUrl = await this.dataService.getHubSiteUrl();
    const siteSuffix = projectCode.replace(/-/g, '');

    for (let step = fromStep; step <= TOTAL_PROVISIONING_STEPS; step++) {
      await this.dataService.updateProvisioningLog(projectCode, {
        status: ProvisioningStatus.InProgress,
        currentStep: step,
        completedSteps: step - 1,
      });

      try {
        const result = await this.executeStep(step, {
          leadId: log?.leadId || 0,
          projectCode,
          projectName: log?.projectName || '',
          clientName: log?.clientName || '',
          division: log?.division || '',
          region: log?.region || '',
          requestedBy: log?.requestedBy || '',
        }, siteUrl, siteSuffix, hubSiteUrl);
        if (step === 1 && typeof result === 'string') siteUrl = result;
      } catch (err) {
        await this.dataService.updateProvisioningLog(projectCode, {
          status: ProvisioningStatus.Failed,
          failedStep: step,
          errorMessage: err instanceof Error ? err.message : String(err),
        });
        throw err;
      }

      await this.dataService.updateProvisioningLog(projectCode, {
        currentStep: step,
        completedSteps: step,
      });
    }

    if (!siteUrl) siteUrl = `${PROVISIONING_CONSTANTS.DEFAULT_SITE_BASE}${siteSuffix}`;
    await this.dataService.updateProvisioningLog(projectCode, {
      status: ProvisioningStatus.Completed,
      currentStep: TOTAL_PROVISIONING_STEPS,
      completedSteps: TOTAL_PROVISIONING_STEPS,
      siteUrl,
      completedAt: new Date().toISOString(),
    });

    const finalLog = await this.dataService.getProvisioningStatus(projectCode);
    if (finalLog) {
      await this.dataService.updateLead(finalLog.leadId, { ProjectSiteURL: siteUrl });
      this.addHubNavLink(projectCode, finalLog.projectName, siteUrl, finalLog.requestedBy)
        .catch(console.error);
    }
  }

  /**
   * Get current provisioning status.
   */
  public async getProvisioningStatus(projectCode: string): Promise<IProvisioningLog | null> {
    return this.dataService.getProvisioningStatus(projectCode);
  }

  /**
   * Get the step labels for display.
   */
  public static getStepLabels(): readonly { step: number; label: string }[] {
    return PROVISIONING_STEPS;
  }

  /**
   * Add a hub navigation link for a provisioned project.
   * Independent and non-blocking — nav link failure never blocks provisioning.
   */
  private async addHubNavLink(
    projectCode: string,
    projectName: string,
    siteUrl: string,
    requestedBy: string
  ): Promise<void> {
    if (!this.hubNavService) return;
    let hubNavStatus: HubNavLinkStatus = 'not_applicable';
    try {
      const hubSiteUrl = await this.dataService.getHubSiteUrl();
      const result = await this.hubNavService.addProjectNavigationLink(
        hubSiteUrl, projectCode, projectName, siteUrl
      );
      hubNavStatus = result.success ? 'success' : 'failed';
      this.dataService.logAudit({
        Action: AuditAction.HubNavLinkCreated,
        EntityType: EntityType.Project,
        EntityId: projectCode,
        ProjectCode: projectCode,
        User: requestedBy,
        Details: `Hub nav link ${result.action} for "${projectName}" under "${result.yearLabel}"`,
      }).catch(console.error);
    } catch (err) {
      hubNavStatus = 'failed';
      this.dataService.logAudit({
        Action: AuditAction.HubNavLinkFailed,
        EntityType: EntityType.Project,
        EntityId: projectCode,
        ProjectCode: projectCode,
        User: requestedBy,
        Details: `Hub nav link failed for "${projectName}": ${err instanceof Error ? err.message : String(err)}`,
      }).catch(console.error);
    }
    this.dataService.updateProvisioningLog(projectCode, { hubNavLinkStatus: hubNavStatus })
      .catch(console.error);
  }

  /**
   * Retry adding a hub navigation link for a completed provisioning.
   * For use by AdminPanel retry button.
   */
  public async retryHubNavLink(projectCode: string, requestedBy: string): Promise<void> {
    if (!this.hubNavService) throw new Error('Hub navigation service not available');
    const log = await this.dataService.getProvisioningStatus(projectCode);
    if (!log) throw new Error(`No provisioning log found for ${projectCode}`);
    if (!log.siteUrl) throw new Error(`No site URL found for ${projectCode}`);

    let hubNavStatus: HubNavLinkStatus = 'failed';
    try {
      const hubSiteUrl = await this.dataService.getHubSiteUrl();
      const result = await this.hubNavService.addProjectNavigationLink(
        hubSiteUrl, projectCode, log.projectName, log.siteUrl
      );
      hubNavStatus = result.success ? 'success' : 'failed';
      this.dataService.logAudit({
        Action: AuditAction.HubNavLinkRetried,
        EntityType: EntityType.Project,
        EntityId: projectCode,
        ProjectCode: projectCode,
        User: requestedBy,
        Details: `Hub nav link retry ${result.action} for "${log.projectName}" under "${result.yearLabel}"`,
      }).catch(console.error);
    } catch (err) {
      this.dataService.logAudit({
        Action: AuditAction.HubNavLinkFailed,
        EntityType: EntityType.Project,
        EntityId: projectCode,
        ProjectCode: projectCode,
        User: requestedBy,
        Details: `Hub nav link retry failed for "${log.projectName}": ${err instanceof Error ? err.message : String(err)}`,
      }).catch(console.error);
    }
    await this.dataService.updateProvisioningLog(projectCode, { hubNavLinkStatus: hubNavStatus });
  }

  /**
   * Create the Buyout_Log list on a project site.
   * Called during site provisioning or on-demand initialization.
   * When useRealOps is true, uses PnP JS to create the list schema.
   */
  public async createBuyoutLogList(siteUrl: string): Promise<void> {
    if (this.useRealOps) {
      const schema = getBuyoutLogSchema();
      await this.dataService.createList(siteUrl, schema.listName, schema.templateType, schema.fields);
    } else {
      await new Promise(resolve => setTimeout(resolve, STEP_DELAY_MS));
    }
    this.dataService.logAudit({
      Action: AuditAction.SiteListsProvisioned,
      EntityType: EntityType.Project,
      EntityId: siteUrl,
      Details: `Buyout_Log list created for ${siteUrl}`,
      User: 'system',
    }).catch(console.error);
  }

  /**
   * Update the title of an existing project site.
   * Used during the re-key operation to reflect the official job number.
   * When useRealOps is true, calls real SP REST API.
   */
  public async updateSiteTitle(siteUrl: string, newTitle: string): Promise<void> {
    if (this.useRealOps) {
      await this.dataService.updateSiteProperties(siteUrl, { Title: newTitle });
    } else {
      await new Promise(resolve => setTimeout(resolve, STEP_DELAY_MS));
    }
    this.dataService.logAudit({
      Action: AuditAction.SiteProvisioningCompleted,
      EntityType: EntityType.Project,
      EntityId: siteUrl,
      Details: `Site title updated to "${newTitle}" for ${siteUrl}`,
      User: 'system',
    }).catch(console.error);
  }

  /**
   * Create the Active_Projects_Portfolio list on the Hub site.
   * When useRealOps is true, uses PnP JS to create the list schema.
   */
  public async createActiveProjectsPortfolioList(hubSiteUrl: string): Promise<void> {
    if (this.useRealOps) {
      const schema = getActiveProjectsPortfolioSchema();
      await this.dataService.createList(hubSiteUrl, schema.listName, schema.templateType, schema.fields);
    } else {
      await new Promise(resolve => setTimeout(resolve, STEP_DELAY_MS));
    }
    this.dataService.logAudit({
      Action: AuditAction.SiteProvisioningCompleted,
      EntityType: EntityType.Config,
      EntityId: hubSiteUrl,
      Details: `Active_Projects_Portfolio list created for ${hubSiteUrl}`,
      User: 'system',
    }).catch(console.error);
  }
}
