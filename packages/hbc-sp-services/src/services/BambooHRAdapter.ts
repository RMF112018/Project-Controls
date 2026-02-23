/**
 * BambooHRAdapter — Connector adapter for BambooHR integration (Phase 4C).
 * BambooHR is inbound-only: employee data flows from BambooHR into HBC.
 */
import type { ConnectorType, SyncDirection, ISyncStatus } from '../models/IExternalConnector';
import type { IConnectorAdapter, IConnectorTestResult, ISyncResult, IConnectorRetryPolicy } from './IConnectorAdapter';

export class BambooHRAdapter implements IConnectorAdapter {
  public readonly connectorType: ConnectorType = 'BambooHR';

  /** Simpler retry: BambooHR is inbound-only with lower rate limits */
  public readonly retryPolicy: IConnectorRetryPolicy = {
    retryableStatuses: [500, 502, 503],
    maxRetries: 2,
    baseDelayMs: 1000,
    maxDelayMs: 15000,
  };

  public async testConnection(_config: Record<string, string>): Promise<IConnectorTestResult> {
    // Mock: always succeeds
    return {
      success: true,
      message: 'Successfully connected to BambooHR API',
    };
  }

  public async sync(_config: Record<string, string>, direction: SyncDirection): Promise<ISyncResult> {
    if (direction === 'Outbound') {
      return { recordsSynced: 0, errors: 1, errorDetails: 'BambooHR connector is inbound-only' };
    }
    // Mock: return simulated inbound sync result
    return {
      recordsSynced: 25,
      errors: 0,
    };
  }

  public async getStatus(_config: Record<string, string>): Promise<ISyncStatus> {
    return {
      lastRun: new Date().toISOString(),
      nextRun: null,
      recordsSynced: 25,
      errors: 0,
      status: 'Idle',
    };
  }

  public mapToInternal(externalData: unknown): unknown {
    // Identity mapping for now — real implementation would transform BambooHR API response
    return externalData;
  }

  public mapToExternal(_internalData: unknown): unknown {
    throw new Error('BambooHR is inbound-only');
  }
}
