/**
 * ProcoreAdapter — Connector adapter for Procore integration (Phase 4B).
 * Procore is bidirectional: project, RFI, budget, and submittal data flows both ways.
 *
 * Phase 5A.1: Optional GraphBatchEnforcer wiring. When provided, Graph operations
 * route through enqueue() for batching/coalescence. Mock behaviour unchanged.
 */
import type { ConnectorType, SyncDirection, ISyncStatus } from '../models/IExternalConnector';
import type { IConnectorAdapter, IConnectorTestResult, ISyncResult, IConnectorRetryPolicy } from './IConnectorAdapter';
import type { GraphBatchEnforcer } from './GraphBatchEnforcer';

export class ProcoreAdapter implements IConnectorAdapter {
  public readonly connectorType: ConnectorType = 'Procore';

  /** 429-aware retry: Procore rate-limits aggressively */
  public readonly retryPolicy: IConnectorRetryPolicy = {
    retryableStatuses: [429, 500, 502, 503, 504],
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
  };

  constructor(private readonly enforcer?: GraphBatchEnforcer) {}

  public async testConnection(config: Record<string, string>): Promise<IConnectorTestResult> {
    if (this.enforcer) {
      await this.enforcer.enqueue({ method: 'GET', url: '/test' }).catch(() => {});
    }
    // Mock: always succeeds
    return {
      success: true,
      message: `Connected to Procore at ${config.apiUrl ?? 'configured endpoint'}`,
    };
  }

  public async sync(_config: Record<string, string>, _direction: SyncDirection): Promise<ISyncResult> {
    if (this.enforcer) {
      await this.enforcer.enqueue({ method: 'POST', url: '/sync' }).catch(() => {});
    }
    // Mock: simulate sync
    return {
      recordsSynced: Math.floor(Math.random() * 50) + 10,
      errors: 0,
    };
  }

  public async getStatus(_config: Record<string, string>): Promise<ISyncStatus> {
    if (this.enforcer) {
      await this.enforcer.enqueue({ method: 'GET', url: '/status' }).catch(() => {});
    }
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
