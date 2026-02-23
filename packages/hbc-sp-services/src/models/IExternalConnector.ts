/**
 * IExternalConnector — Models for the external connector framework (Phase 4A).
 * Supports pluggable integrations (Procore, BambooHR, future SAGE Intacct).
 */

// ─── Enums ──────────────────────────────────────────────────────────────────

export type ConnectorType = 'Procore' | 'BambooHR';

export type ConnectorStatus = 'Active' | 'Inactive' | 'Error' | 'Configuring';

export type SyncDirection = 'Inbound' | 'Outbound' | 'Bidirectional';

export type SyncRunStatus = 'Running' | 'Completed' | 'Failed' | 'Cancelled';

// ─── Core Model ─────────────────────────────────────────────────────────────

export interface IExternalConnector {
  id: number;
  name: string;
  connectorType: ConnectorType;
  status: ConnectorStatus;
  /** Connector-specific configuration (API URL, tenant ID, etc.) — never contains secrets */
  config: Record<string, string>;
  lastSyncAt: string | null;
  syncDirection: SyncDirection;
  createdBy: string;
  createdAt: string;
  modifiedAt: string;
}

// ─── Sync Status ────────────────────────────────────────────────────────────

export interface ISyncStatus {
  lastRun: string | null;
  nextRun: string | null;
  recordsSynced: number;
  errors: number;
  status: SyncRunStatus | 'Idle';
}

// ─── Sync History ───────────────────────────────────────────────────────────

export interface ISyncHistoryEntry {
  id: number;
  connectorId: number;
  startedAt: string;
  completedAt: string | null;
  direction: SyncDirection;
  recordsSynced: number;
  errors: number;
  status: SyncRunStatus;
  errorDetails?: string;
}
