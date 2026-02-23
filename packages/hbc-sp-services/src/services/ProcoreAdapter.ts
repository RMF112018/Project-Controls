/**
 * ProcoreAdapter — Connector adapter for Procore integration (Phase 4B).
 * Procore is bidirectional: project, RFI, budget, and submittal data flows both ways.
 */
import type { ConnectorType, SyncDirection, ISyncStatus } from '../models/IExternalConnector';
import type { IConnectorAdapter, IConnectorTestResult, ISyncResult, IConnectorRetryPolicy } from './IConnectorAdapter';

export class ProcoreAdapter implements IConnectorAdapter {
  public readonly connectorType: ConnectorType = 'Procore';

  /** 429-aware retry: Procore rate-limits aggressively */
  public readonly retryPolicy: IConnectorRetryPolicy = {
    retryableStatuses: [429, 500, 502, 503, 504],
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
  };

  public async testConnection(config: Record<string, string>): Promise<IConnectorTestResult> {
    // Mock: always succeeds
    return {
      success: true,
      message: `Connected to Procore at ${config.apiUrl ?? 'configured endpoint'}`,
    };
  }

  public async sync(_config: Record<string, string>, _direction: SyncDirection): Promise<ISyncResult> {
    // Mock: simulate sync
    return {
      recordsSynced: Math.floor(Math.random() * 50) + 10,
      errors: 0,
    };
  }

  public async getStatus(_config: Record<string, string>): Promise<ISyncStatus> {
    return {
      lastRun: new Date().toISOString(),
      nextRun: null,
      recordsSynced: 47,
      errors: 0,
      status: 'Idle',
    };
  }

  public mapToInternal(externalData: unknown): unknown {
    // Identity mapping for now — real implementation would transform Procore API response
    return externalData;
  }

  public mapToExternal(internalData: unknown): unknown {
    // Identity mapping for now — real implementation would transform to Procore API format
    return internalData;
  }
}
