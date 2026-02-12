import { IDataService } from './IDataService';
import { NotificationService } from './NotificationService';
import { PowerAutomateService } from './PowerAutomateService';
import { OfflineQueueService } from './OfflineQueueService';
import { IHubNavigationService } from './HubNavigationService';
import { IProvisioningLog, ProvisioningStatus, PROVISIONING_STEPS, TOTAL_PROVISIONING_STEPS, NotificationEvent, AuditAction, EntityType } from '../models';
import { HubNavLinkStatus } from '../models/IProvisioningLog';

export interface IProvisioningInput {
  leadId: number;
  projectCode: string;
  projectName: string;
  clientName: string;
  division: string;
  region: string;
  requestedBy: string;
  siteNameOverride?: string;
}

const STEP_DELAY_MS = 500;
const MAX_RETRIES = 3;

export class ProvisioningService {
  private dataService: IDataService;
  private notificationService: NotificationService;
  private hubNavService?: IHubNavigationService;
  private powerAutomateService?: PowerAutomateService;
  private offlineQueueService?: OfflineQueueService;
  private usePowerAutomate: boolean;

  constructor(
    dataService: IDataService,
    hubNavService?: IHubNavigationService,
    powerAutomateService?: PowerAutomateService,
    offlineQueueService?: OfflineQueueService,
    usePowerAutomate?: boolean
  ) {
    this.dataService = dataService;
    this.notificationService = new NotificationService(dataService);
    this.hubNavService = hubNavService;
    this.powerAutomateService = powerAutomateService;
    this.offlineQueueService = offlineQueueService;
    this.usePowerAutomate = usePowerAutomate ?? false;
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
      input.requestedBy
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

    // Run steps asynchronously so the caller can poll for status
    this.runSteps(input).catch(console.error);

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
   * Run through provisioning steps sequentially.
   * Updates the provisioning log at each step.
   */
  private async runSteps(input: IProvisioningInput): Promise<void> {
    const { projectCode } = input;
    // Use siteNameOverride when provided (e.g., project name without code prefix)
    const siteSuffix = input.siteNameOverride
      ? input.siteNameOverride.replace(/[^a-zA-Z0-9-]/g, '')
      : projectCode.replace(/-/g, '');
    const siteUrl = `https://hedrickbrotherscom.sharepoint.com/sites/${siteSuffix}`;

    for (let step = 1; step <= TOTAL_PROVISIONING_STEPS; step++) {
      // Mark step as in-progress
      await this.dataService.updateProvisioningLog(projectCode, {
        status: ProvisioningStatus.InProgress,
        currentStep: step,
        completedSteps: step - 1,
      });

      // Simulate step work
      await this.simulateStep(step);

      // Mark step completed
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

    // Update the lead with the site URL
    const log = await this.dataService.getProvisioningStatus(projectCode);
    if (log) {
      await this.dataService.updateLead(log.leadId, { ProjectSiteURL: siteUrl });
      // Fire SiteProvisioned notification
      this.notificationService.notify(
        NotificationEvent.SiteProvisioned,
        { projectCode, siteUrl, leadTitle: input.projectName },
        input.requestedBy
      ).catch(console.error);
      // Fire-and-forget audit log for provisioning completion
      this.dataService.logAudit({
        Action: AuditAction.SiteProvisioningCompleted,
        EntityType: EntityType.Project,
        EntityId: String(log.leadId),
        ProjectCode: projectCode,
        User: input.requestedBy,
        Details: `Site provisioning completed for "${input.projectName}" (${projectCode}). Site URL: ${siteUrl}`,
      }).catch(console.error);

      // Hub Navigation Link (independent, non-blocking)
      this.addHubNavLink(projectCode, input.projectName, siteUrl, input.requestedBy)
        .catch(console.error);
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
    for (let step = fromStep; step <= TOTAL_PROVISIONING_STEPS; step++) {
      await this.dataService.updateProvisioningLog(projectCode, {
        status: ProvisioningStatus.InProgress,
        currentStep: step,
        completedSteps: step - 1,
      });

      await this.simulateStep(step);

      await this.dataService.updateProvisioningLog(projectCode, {
        currentStep: step,
        completedSteps: step,
      });
    }

    const siteUrl = `https://hedrickbrotherscom.sharepoint.com/sites/${projectCode.replace(/-/g, '')}`;
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

      // Hub Navigation Link (independent, non-blocking)
      this.addHubNavLink(projectCode, log.projectName, siteUrl, log.requestedBy)
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
   * In production, this uses PnP JS to create the list schema with all required columns.
   */
  public async createBuyoutLogList(siteUrl: string): Promise<void> {
    // In mock mode, simulate the delay
    await new Promise(resolve => setTimeout(resolve, STEP_DELAY_MS));

    this.dataService.logAudit({
      Action: AuditAction.SiteProvisioningCompleted,
      EntityType: EntityType.Project,
      EntityId: siteUrl,
      Details: `Buyout_Log list created for ${siteUrl}`,
      User: 'system',
    }).catch(console.error);
  }

  /**
   * Update the title of an existing project site.
   * Used during the re-key operation to reflect the official job number.
   * In mock mode this is a no-op; in production it would call SP REST API.
   */
  public async updateSiteTitle(siteUrl: string, newTitle: string): Promise<void> {
    // In mock mode, just simulate the delay
    await new Promise(resolve => setTimeout(resolve, STEP_DELAY_MS));
    // Log for auditing purposes
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
   * This list aggregates data from all project sites for executive dashboard.
   * In production, this uses PnP JS to create the list schema with all required columns.
   */
  public async createActiveProjectsPortfolioList(hubSiteUrl: string): Promise<void> {
    // In mock mode, simulate the delay
    await new Promise(resolve => setTimeout(resolve, STEP_DELAY_MS));

    // In production, this would create the list with the following schema:
    // - Title (ProjectName)
    // - JobNumber (Text)
    // - ProjectCode (Text, Indexed)
    // - Status (Choice: Precon, Construction, Final Payment)
    // - Sector (Choice: Commercial, Residential)
    // - Region (Text)
    // - ProjectExecutive, LeadPM, AdditionalPM, AssistantPM (Text)
    // - ProjectAccountant, ProjectAssistant, LeadSuper, Superintendent, AssistantSuper (Text)
    // - OriginalContract, ChangeOrders, CurrentContractValue, BillingsToDate, Unbilled (Currency)
    // - ProjectedFee, ProjectedFeePct, ProjectedCost, RemainingValue (Number)
    // - StartDate, SubstantialCompletionDate, NOCExpiration (DateTime)
    // - CurrentPhase (Text)
    // - PercentComplete (Number)
    // - AverageQScore, OpenWaiverCount, PendingCommitments (Number)
    // - ComplianceStatus (Choice: Green, Yellow, Red)
    // - StatusComments (Note)
    // - ProjectSiteUrl (Hyperlink)
    // - LastSyncDate, LastModified (DateTime)
    // - HasUnbilledAlert, HasScheduleAlert, HasFeeErosionAlert (Yes/No)

    this.dataService.logAudit({
      Action: AuditAction.SiteProvisioningCompleted,
      EntityType: EntityType.Config,
      EntityId: hubSiteUrl,
      Details: `Active_Projects_Portfolio list created for ${hubSiteUrl}`,
      User: 'system',
    }).catch(console.error);
  }
}
