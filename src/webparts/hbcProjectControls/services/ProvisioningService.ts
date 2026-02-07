import { IDataService } from './IDataService';
import { IProvisioningLog, ProvisioningStatus, PROVISIONING_STEPS, TOTAL_PROVISIONING_STEPS } from '../models';

export interface IProvisioningInput {
  leadId: number;
  projectCode: string;
  projectName: string;
  clientName: string;
  division: string;
  region: string;
  requestedBy: string;
}

const STEP_DELAY_MS = 500;

export class ProvisioningService {
  private dataService: IDataService;

  constructor(dataService: IDataService) {
    this.dataService = dataService;
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

    // Run steps asynchronously so the caller can poll for status
    this.runSteps(input).catch(console.error);

    return log;
  }

  /**
   * Run through provisioning steps sequentially.
   * Updates the provisioning log at each step.
   */
  private async runSteps(input: IProvisioningInput): Promise<void> {
    const { projectCode } = input;
    const siteUrl = `https://hedrickbrothers.sharepoint.com/sites/${projectCode.replace(/-/g, '')}`;

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
    const log = await this.dataService.retryProvisioning(projectCode, fromStep);

    // Resume steps from the failed step
    const currentLog = await this.dataService.getProvisioningStatus(projectCode);
    if (currentLog) {
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

    const siteUrl = `https://hedrickbrothers.sharepoint.com/sites/${projectCode.replace(/-/g, '')}`;
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
}
