import { IAuditEntry } from '../models/IAuditEntry';
import { AuditAction, EntityType } from '../models/enums';

export class AuditService {
  private queue: Partial<IAuditEntry>[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private logFn: ((entry: Partial<IAuditEntry>) => Promise<void>) | null = null;

  initialize(logFunction: (entry: Partial<IAuditEntry>) => Promise<void>): void {
    this.logFn = logFunction;
  }

  log(
    action: AuditAction,
    entityType: EntityType,
    entityId: string,
    details: string,
    options?: {
      projectCode?: string;
      fieldChanged?: string;
      previousValue?: string;
      newValue?: string;
    }
  ): void {
    const entry: Partial<IAuditEntry> = {
      Timestamp: new Date().toISOString(),
      Action: action,
      EntityType: entityType,
      EntityId: entityId,
      Details: details,
      ProjectCode: options?.projectCode,
      FieldChanged: options?.fieldChanged,
      PreviousValue: options?.previousValue,
      NewValue: options?.newValue,
    };

    this.queue.push(entry);

    // Debounce flush - fire after 2 seconds of no new entries
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }
    this.flushTimer = setTimeout(() => this.flush(), 2000);
  }

  private async flush(): Promise<void> {
    if (!this.logFn || this.queue.length === 0) return;

    const entries = [...this.queue];
    this.queue = [];

    // Fire and forget - don't block UI on audit failures
    for (const entry of entries) {
      try {
        await this.logFn(entry);
      } catch (error) {
        console.warn('[AuditService] Failed to log audit entry:', error);
        // Don't re-queue - audit is non-critical
      }
    }
  }

  async flushNow(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flush();
  }
}

export const auditService = new AuditService();
