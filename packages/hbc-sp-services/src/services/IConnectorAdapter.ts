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

export interface IConnectorAdapter {
  readonly connectorType: ConnectorType;

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
