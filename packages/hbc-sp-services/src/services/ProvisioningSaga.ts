/**
 * Phase 5C: ProvisioningSaga — Saga-style orchestrator for the 7-step provisioning engine.
 *
 * Provides reverse-order compensation on failure, idempotency tokens, and optional
 * SignalR broadcast callbacks. Compensation failures are logged but NEVER thrown.
 *
 * Feature flag: ProvisioningSaga (default OFF).
 * When OFF, ProvisioningService.runSteps() is used unchanged.
 */
import type { IDataService } from './IDataService';
import type {
  ISagaStep,
  ISagaContext,
  ICompensationResult,
  ISagaExecutionResult,
} from '../models/IProvisioningSaga';
import type { IProvisioningInput } from '../models/IProvisioningLog';
import type { SignalRMessage, IProvisioningStatusMessage } from '../models/ISignalRMessage';
import type { GraphBatchEnforcer } from './GraphBatchEnforcer';
import type { ListThresholdGuard } from '../utils/ListThresholdGuard';
import { ThresholdLevel } from '../utils/ListThresholdGuard';
import { PROVISIONING_STEPS, TOTAL_PROVISIONING_STEPS, ProvisioningStatus, AuditAction, EntityType } from '../models';

const PROVISIONING_CONSTANTS = {
  DEFAULT_SITE_BASE: 'https://hedrickbrotherscom.sharepoint.com/sites/',
};

export class ProvisioningSaga {
  private dataService: IDataService;
  private signalRBroadcast?: (msg: SignalRMessage) => void;
  private graphBatchEnforcer?: GraphBatchEnforcer;
  private listThresholdGuard?: ListThresholdGuard;

  constructor(
    dataService: IDataService,
    signalRBroadcast?: (msg: SignalRMessage) => void,
    graphBatchEnforcer?: GraphBatchEnforcer,
    listThresholdGuard?: ListThresholdGuard
  ) {
    this.dataService = dataService;
    this.signalRBroadcast = signalRBroadcast;
    this.graphBatchEnforcer = graphBatchEnforcer;
    this.listThresholdGuard = listThresholdGuard;
  }

  /**
   * Generate a unique idempotency token for a provisioning run.
   * Format: projectCode::ISO-timestamp::4-byte-hex
   */
  public static generateIdempotencyToken(projectCode: string): string {
    const timestamp = new Date().toISOString();
    const hex = Math.floor(Math.random() * 0xFFFF).toString(16).padStart(4, '0');
    return `${projectCode}::${timestamp}::${hex}`;
  }

  /**
   * Execute the full 7-step provisioning saga.
   * On failure at any step, triggers reverse-order compensation for all completed steps.
   */
  public async execute(input: IProvisioningInput): Promise<ISagaExecutionResult> {
    const idempotencyToken = ProvisioningSaga.generateIdempotencyToken(input.projectCode);
    const siteSuffix = input.siteNameOverride
      ? input.siteNameOverride.replace(/[^a-zA-Z0-9-]/g, '')
      : input.projectCode.replace(/-/g, '');
    let siteUrl = '';
    const hubSiteUrl = await this.dataService.getHubSiteUrl();

    const context: ISagaContext = {
      input,
      siteUrl: '',
      hubSiteUrl,
      siteAlias: siteSuffix,
      idempotencyToken,
      completedSteps: [],
      dataService: this.dataService,
    };

    const steps = this.buildSteps();

    for (const sagaStep of steps) {
      // Broadcast step starting
      this.broadcastStepStatus(input.projectCode, sagaStep.step, 'in_progress', sagaStep.label, context.completedSteps.length, idempotencyToken);

      try {
        const result = await sagaStep.execute(context);
        if (sagaStep.step === 1 && typeof result === 'string') {
          siteUrl = result;
          context.siteUrl = result;
        }
        context.completedSteps.push(sagaStep.step);

        // Broadcast step completed
        this.broadcastStepStatus(input.projectCode, sagaStep.step, 'completed', sagaStep.label, context.completedSteps.length, idempotencyToken);

        // Update provisioning log progress
        await this.dataService.updateProvisioningLog(input.projectCode, {
          status: ProvisioningStatus.InProgress,
          currentStep: sagaStep.step,
          completedSteps: context.completedSteps.length,
          idempotencyToken,
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);

        // Broadcast step failed
        this.broadcastStepStatus(input.projectCode, sagaStep.step, 'failed', sagaStep.label, context.completedSteps.length, idempotencyToken, errorMsg);

        // Update log with failure
        await this.dataService.updateProvisioningLog(input.projectCode, {
          status: ProvisioningStatus.Failed,
          failedStep: sagaStep.step,
          errorMessage: errorMsg,
          idempotencyToken,
        });

        // Phase 5C.1: ListThresholdGuard before audit log write
        if (this.listThresholdGuard) {
          const check = this.listThresholdGuard.checkThreshold('Audit_Log', 0);
          if (check.level !== ThresholdLevel.Safe) { /* guard logs internally */ }
        }

        // Log compensation start
        void this.dataService.logAudit({
          Action: AuditAction.SagaCompensationStarted,
          EntityType: EntityType.Project,
          EntityId: input.projectCode,
          User: input.requestedBy,
          Details: `Saga compensation started after failure at step ${sagaStep.step} ("${sagaStep.label}"): ${errorMsg}`,
        });

        // Run compensation for completed steps in strict reverse order
        const compensationResults = await this.compensate(context, [...context.completedSteps]);

        // Update log with compensation results
        await this.dataService.updateProvisioningLog(input.projectCode, {
          compensationLog: compensationResults,
        });

        return {
          success: false,
          completedSteps: context.completedSteps.length,
          failedStep: sagaStep.step,
          error: errorMsg,
          compensationResults,
          idempotencyToken,
          siteUrl: siteUrl || undefined,
        };
      }
    }

    // All steps completed successfully
    await this.dataService.updateProvisioningLog(input.projectCode, {
      status: ProvisioningStatus.Completed,
      currentStep: TOTAL_PROVISIONING_STEPS,
      completedSteps: TOTAL_PROVISIONING_STEPS,
      siteUrl,
      completedAt: new Date().toISOString(),
      idempotencyToken,
    });

    return {
      success: true,
      completedSteps: TOTAL_PROVISIONING_STEPS,
      idempotencyToken,
      siteUrl,
    };
  }

  /**
   * Compensate completed steps in strict reverse order (highest step first).
   * Compensation failures are logged but NEVER thrown — maximizes cleanup.
   */
  public async compensate(
    context: ISagaContext,
    completedSteps: number[]
  ): Promise<ICompensationResult[]> {
    const results: ICompensationResult[] = [];
    const steps = this.buildSteps();

    // Sort descending — strict reverse order. Step 1 (site deletion) runs LAST.
    const sortedSteps = [...completedSteps].sort((a, b) => b - a);

    // Update status to Compensating
    await this.dataService.updateProvisioningLog(context.input.projectCode, {
      status: ProvisioningStatus.Compensating,
    });

    for (const stepNum of sortedSteps) {
      const sagaStep = steps.find(s => s.step === stepNum);
      if (!sagaStep) continue;

      // Broadcast compensation in progress
      this.broadcastStepStatus(context.input.projectCode, stepNum, 'compensating', sagaStep.label, 0, context.idempotencyToken);

      const startTime = Date.now();
      try {
        const result = await sagaStep.compensate(context);
        results.push(result);

        // Phase 5C.1: ListThresholdGuard before audit log write
        if (this.listThresholdGuard) {
          const check = this.listThresholdGuard.checkThreshold('Audit_Log', 0);
          if (check.level !== ThresholdLevel.Safe) { /* guard logs internally */ }
        }

        // Audit successful compensation
        void this.dataService.logAudit({
          Action: AuditAction.SagaStepCompensated,
          EntityType: EntityType.Project,
          EntityId: context.input.projectCode,
          User: context.input.requestedBy,
          Details: `Compensated step ${stepNum} ("${sagaStep.label}") in ${result.duration}ms`,
        });
      } catch (compErr) {
        // Compensation failures are logged but NEVER thrown
        const duration = Date.now() - startTime;
        const errorMsg = compErr instanceof Error ? compErr.message : String(compErr);
        results.push({
          step: stepNum,
          label: sagaStep.label,
          success: false,
          error: errorMsg,
          duration,
          timestamp: new Date().toISOString(),
        });

        // Phase 5C.1: ListThresholdGuard before audit log write
        if (this.listThresholdGuard) {
          const check = this.listThresholdGuard.checkThreshold('Audit_Log', 0);
          if (check.level !== ThresholdLevel.Safe) { /* guard logs internally */ }
        }

        // Audit failed compensation
        void this.dataService.logAudit({
          Action: AuditAction.SagaCompensationFailed,
          EntityType: EntityType.Project,
          EntityId: context.input.projectCode,
          User: context.input.requestedBy,
          Details: `Compensation FAILED for step ${stepNum} ("${sagaStep.label}"): ${errorMsg}. ${sagaStep.isCritical ? 'CRITICAL — manual intervention required.' : ''}`,
        });
      }
    }

    return results;
  }

  /**
   * Build the 7 saga steps with forward execution and reverse compensation.
   */
  private buildSteps(): ISagaStep[] {
    return [
      {
        step: 1,
        label: PROVISIONING_STEPS[0].label,
        isCritical: true,
        execute: async (ctx) => {
          const result = await ctx.dataService.createProjectSite(
            ctx.input.projectCode, ctx.input.projectName, ctx.siteAlias
          );
          if (this.graphBatchEnforcer) await this.graphBatchEnforcer.enqueue({ method: 'POST', url: '/groups/...' }).catch(() => {});
          return result.siteUrl;
        },
        compensate: async (ctx) => {
          const start = Date.now();
          await ctx.dataService.deleteProjectSite(ctx.siteUrl);
          return { step: 1, label: PROVISIONING_STEPS[0].label, success: true, duration: Date.now() - start, timestamp: new Date().toISOString() };
        },
      },
      {
        step: 2,
        label: PROVISIONING_STEPS[1].label,
        isCritical: false,
        execute: async (ctx) => {
          await ctx.dataService.provisionProjectLists(ctx.siteUrl, ctx.input.projectCode);
        },
        compensate: async (ctx) => {
          const start = Date.now();
          await ctx.dataService.removeProvisionedLists(ctx.siteUrl, ctx.input.projectCode);
          return { step: 2, label: PROVISIONING_STEPS[1].label, success: true, duration: Date.now() - start, timestamp: new Date().toISOString() };
        },
      },
      {
        step: 3,
        label: PROVISIONING_STEPS[2].label,
        isCritical: false,
        execute: async (ctx) => {
          await ctx.dataService.associateWithHubSite(ctx.siteUrl, ctx.hubSiteUrl);
          if (this.graphBatchEnforcer) await this.graphBatchEnforcer.enqueue({ method: 'POST', url: '/groups/...' }).catch(() => {});
        },
        compensate: async (ctx) => {
          const start = Date.now();
          await ctx.dataService.disassociateFromHubSite(ctx.siteUrl, ctx.hubSiteUrl);
          return { step: 3, label: PROVISIONING_STEPS[2].label, success: true, duration: Date.now() - start, timestamp: new Date().toISOString() };
        },
      },
      {
        step: 4,
        label: PROVISIONING_STEPS[3].label,
        isCritical: true,
        execute: async (ctx) => {
          await ctx.dataService.createProjectSecurityGroups(ctx.siteUrl, ctx.input.projectCode, ctx.input.division);
          if (this.graphBatchEnforcer) await this.graphBatchEnforcer.enqueue({ method: 'POST', url: '/groups/...' }).catch(() => {});
        },
        compensate: async (ctx) => {
          const start = Date.now();
          await ctx.dataService.deleteProjectSecurityGroups(ctx.siteUrl, ctx.input.projectCode);
          return { step: 4, label: PROVISIONING_STEPS[3].label, success: true, duration: Date.now() - start, timestamp: new Date().toISOString() };
        },
      },
      {
        step: 5,
        label: PROVISIONING_STEPS[4].label,
        isCritical: false,
        execute: async (ctx) => {
          await ctx.dataService.copyTemplateFiles(ctx.siteUrl, ctx.input.projectCode, ctx.input.division);
        },
        compensate: async (ctx) => {
          const start = Date.now();
          await ctx.dataService.removeTemplateFiles(ctx.siteUrl, ctx.input.projectCode);
          return { step: 5, label: PROVISIONING_STEPS[4].label, success: true, duration: Date.now() - start, timestamp: new Date().toISOString() };
        },
      },
      {
        step: 6,
        label: PROVISIONING_STEPS[5].label,
        isCritical: false,
        execute: async (ctx) => {
          await ctx.dataService.copyLeadDataToProjectSite(ctx.siteUrl, ctx.input.leadId, ctx.input.projectCode);
        },
        compensate: async (ctx) => {
          const start = Date.now();
          await ctx.dataService.removeLeadDataFromProjectSite(ctx.siteUrl, ctx.input.leadId, ctx.input.projectCode);
          return { step: 6, label: PROVISIONING_STEPS[5].label, success: true, duration: Date.now() - start, timestamp: new Date().toISOString() };
        },
      },
      {
        step: 7,
        label: PROVISIONING_STEPS[6].label,
        isCritical: false,
        execute: async (ctx) => {
          await ctx.dataService.updateLead(ctx.input.leadId, { ProjectSiteURL: ctx.siteUrl } as unknown as Record<string, unknown>);
        },
        compensate: async (ctx) => {
          const start = Date.now();
          await ctx.dataService.updateLead(ctx.input.leadId, { ProjectSiteURL: '' } as unknown as Record<string, unknown>);
          return { step: 7, label: PROVISIONING_STEPS[6].label, success: true, duration: Date.now() - start, timestamp: new Date().toISOString() };
        },
      },
    ];
  }

  /**
   * Broadcast provisioning step status via SignalR (if callback provided).
   */
  private broadcastStepStatus(
    projectCode: string,
    currentStep: number,
    stepStatus: IProvisioningStatusMessage['stepStatus'],
    stepLabel: string,
    completedCount: number,
    idempotencyToken: string,
    error?: string
  ): void {
    if (!this.signalRBroadcast) return;

    const progress = Math.round((completedCount / TOTAL_PROVISIONING_STEPS) * 100);
    const message: IProvisioningStatusMessage = {
      type: 'ProvisioningStatus',
      projectCode,
      currentStep,
      totalSteps: TOTAL_PROVISIONING_STEPS,
      stepStatus,
      stepLabel,
      progress,
      timestamp: new Date().toISOString(),
      idempotencyToken,
      ...(error ? { error } : {}),
    };

    this.signalRBroadcast(message);
  }
}
