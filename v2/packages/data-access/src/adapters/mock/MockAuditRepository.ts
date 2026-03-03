import type { IAuditEntry, ICursorPageRequest, ICursorPageResult } from '@hbc/models';
import type { IAuditRepository } from '../../ports/IAuditRepository';

export class MockAuditRepository implements IAuditRepository {
  private entries: IAuditEntry[] = [];

  async log(entry: Partial<IAuditEntry>): Promise<void> {
    this.entries.push({
      id: this.entries.length + 1,
      ...entry,
    } as IAuditEntry);
  }

  async getLog(entityType?: string, entityId?: string, _startDate?: string, _endDate?: string): Promise<IAuditEntry[]> {
    return this.entries.filter((e) => {
      if (entityType && e.EntityType !== entityType) return false;
      if (entityId && e.EntityId !== entityId) return false;
      return true;
    });
  }

  async getLogPage(request: ICursorPageRequest): Promise<ICursorPageResult<IAuditEntry>> {
    const start = request.token?.lastId ?? 0;
    const items = this.entries.slice(start, start + request.pageSize);
    return {
      items,
      nextToken: items.length === request.pageSize ? { lastId: start + request.pageSize } : null,
      hasMore: start + request.pageSize < this.entries.length,
    };
  }

  async purgeOldEntries(_olderThanDays: number): Promise<number> {
    return 0;
  }
}
