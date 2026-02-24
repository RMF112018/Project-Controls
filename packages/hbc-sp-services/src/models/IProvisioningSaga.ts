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
}

export interface ICompensationResult {
  step: number;
  label: string;
  success: boolean;
  error?: string;
  duration: number;
  timestamp: string;
}

export interface ISagaExecutionResult {
  success: boolean;
  completedSteps: number;
  failedStep?: number;
  error?: string;
  compensationResults?: ICompensationResult[];
  idempotencyToken: string;
  siteUrl?: string;
}

export interface IIdempotencyToken {
  token: string;
  projectCode: string;
  createdAt: string;
  hexSuffix: string;
}
