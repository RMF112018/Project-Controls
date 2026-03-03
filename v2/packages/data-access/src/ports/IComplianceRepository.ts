import type {
  IComplianceEntry,
  IComplianceSummary,
  IComplianceLogFilter,
} from '@hbc/models';
import type { ICursorPageRequest, ICursorPageResult } from '@hbc/models';

/**
 * Compliance repository — compliance log, summary.
 */
export interface IComplianceRepository {
  getLog(filters?: IComplianceLogFilter): Promise<IComplianceEntry[]>;
  getLogPage(request: ICursorPageRequest): Promise<ICursorPageResult<IComplianceEntry>>;
  getSummary(): Promise<IComplianceSummary>;
}
