/**
 * SOC2-oriented before/after snapshot serialized into IAuditEntry.Details as JSON.
 * correlationId links all audit entries for a single provisioning run.
 */
export interface IAuditSnapshot {
  operation: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown>;
  durationMs?: number;
  correlationId: string;
}
