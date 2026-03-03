import type { IAuditEntry } from '@hbc/models';
import type { ICursorPageRequest, ICursorPageResult } from '@hbc/models';

/**
 * Audit log repository — logging, querying, purging audit entries.
 */
export interface IAuditRepository {
  log(entry: Partial<IAuditEntry>): Promise<void>;
  getLog(entityType?: string, entityId?: string, startDate?: string, endDate?: string): Promise<IAuditEntry[]>;
  getLogPage(request: ICursorPageRequest): Promise<ICursorPageResult<IAuditEntry>>;
  purgeOldEntries(olderThanDays: number): Promise<number>;
}
