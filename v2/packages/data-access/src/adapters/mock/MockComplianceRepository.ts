import type { IComplianceEntry, IComplianceSummary, IComplianceLogFilter, ICursorPageRequest, ICursorPageResult } from '@hbc/models';
import type { IComplianceRepository } from '../../ports/IComplianceRepository';

export class MockComplianceRepository implements IComplianceRepository {
  async getLog(_filters?: IComplianceLogFilter): Promise<IComplianceEntry[]> { return []; }
  async getLogPage(_request: ICursorPageRequest): Promise<ICursorPageResult<IComplianceEntry>> { return { items: [], nextToken: null, hasMore: false }; }
  async getSummary(): Promise<IComplianceSummary> { return { totalEntries: 0, compliantCount: 0, nonCompliantCount: 0, pendingCount: 0, complianceRate: 100 } as unknown as IComplianceSummary; }
}
