import type { IDataService } from '../services/IDataService';
import type { IProvisioningInput } from './IProvisioningLog';

/**
 * Phase 5C: Provisioning Saga Types
 *
 * Saga-style reverse compensation for the 7-step provisioning engine.
 * Compensation runs in strict reverse order over completed steps only.
 * Compensation failures are logged but NEVER thrown.
 */

export interface ISagaStep {
  step: number;
  label: string;
  execute: (context: ISagaContext) => Promise<string | void>;
  compensate: (context: ISagaContext) => Promise<ICompensationResult>;
  isCritical: boolean;
}

export interface ISagaContext {
  input: IProvisioningInput;
  siteUrl: string;
  hubSiteUrl: string;
  siteAlias: string;
  idempotencyToken: string;
  completedSteps: number[];
  dataService: IDataService;
  /** Phase 7S3: Template version resolved at Step 5 */
  templateVersion?: string;
}

export interface ICompensationResult {
  step: number;
  label: string;
  success: boolean;
  error?: string;
  duration: number;
  timestamp: string;
  /** Phase 7S3: Distinguishes automatic failure compensation from manual rollback */
  compensationType?: 'forward_failure' | 'manual_rollback';
}

export interface ISagaExecutionResult {
  success: boolean;
  completedSteps: number;
  failedStep?: number;
  error?: string;
  compensationResults?: ICompensationResult[];
  idempotencyToken: string;
  siteUrl?: string;
  /** Phase 7S3: Template version applied during provisioning */
  templateVersion?: string;
  /** Phase 7S3: Template type applied during provisioning */
  templateType?: string;
}

export interface IIdempotencyToken {
  token: string;
  projectCode: string;
  createdAt: string;
  hexSuffix: string;
}
