/**
 * IConnectorAdapter — Interface for pluggable external system adapters (Phase 4A).
 * Each integration (Procore, BambooHR) implements this interface.
 */
import type { ConnectorType, SyncDirection, ISyncStatus } from '../models/IExternalConnector';

export interface IConnectorTestResult {
  success: boolean;
  message: string;
}

export interface ISyncResult {
  recordsSynced: number;
  errors: number;
  errorDetails?: string;
}

/** Retry policy for connector operations — classifies errors and configures backoff */
export interface IConnectorRetryPolicy {
  /** HTTP status codes that should trigger a retry */
  retryableStatuses: number[];
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Base delay in ms for exponential backoff (delay = baseDelayMs * 2^attempt) */
  baseDelayMs: number;
  /** Maximum delay in ms (caps exponential growth) */
  maxDelayMs: number;
}

/** Classifies an HTTP status code as transient (retryable) or permanent */
export function isTransientError(status: number, policy: IConnectorRetryPolicy): boolean {
  return policy.retryableStatuses.includes(status);
}

export interface IConnectorAdapter {
  readonly connectorType: ConnectorType;

  /** Retry policy for this adapter's operations */
  readonly retryPolicy: IConnectorRetryPolicy;

  /** Test the connection to the external system */
  testConnection(config: Record<string, string>): Promise<IConnectorTestResult>;

  /** Execute a sync operation */
  sync(config: Record<string, string>, direction: SyncDirection): Promise<ISyncResult>;

  /** Get current sync status */
  getStatus(config: Record<string, string>): Promise<ISyncStatus>;

  /** Map external data to internal HBC format */
  mapToInternal(externalData: unknown): unknown;

  /** Map internal HBC data to external format (throws for inbound-only connectors) */
  mapToExternal(internalData: unknown): unknown;
}
