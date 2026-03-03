import type {
  IBuyoutEntry,
  ICommitmentApproval,
  IContractTrackingApproval,
} from '@hbc/models';
import type { ICursorPageRequest, ICursorPageResult } from '@hbc/models';

/**
 * Buyout repository — buyout log, commitment approvals, contract tracking.
 */
export interface IBuyoutRepository {
  // Buyout Log
  getEntries(projectCode: string): Promise<IBuyoutEntry[]>;
  getEntriesPage(request: ICursorPageRequest): Promise<ICursorPageResult<IBuyoutEntry>>;
  initializeLog(projectCode: string): Promise<IBuyoutEntry[]>;
  addEntry(projectCode: string, entry: Partial<IBuyoutEntry>): Promise<IBuyoutEntry>;
  updateEntry(projectCode: string, entryId: number, data: Partial<IBuyoutEntry>): Promise<IBuyoutEntry>;
  removeEntry(projectCode: string, entryId: number): Promise<void>;

  // Commitment Approval
  submitForApproval(projectCode: string, entryId: number, submittedBy: string): Promise<IBuyoutEntry>;
  respondToApproval(projectCode: string, entryId: number, approved: boolean, comment: string, escalate?: boolean): Promise<IBuyoutEntry>;
  getApprovalHistory(projectCode: string, entryId: number): Promise<ICommitmentApproval[]>;

  // Contract Tracking Workflow
  submitContractTracking(projectCode: string, entryId: number, submittedBy: string): Promise<IBuyoutEntry>;
  respondToContractTracking(projectCode: string, entryId: number, approved: boolean, comment: string): Promise<IBuyoutEntry>;
  getContractTrackingHistory(projectCode: string, entryId: number): Promise<IContractTrackingApproval[]>;

  // File Upload
  uploadDocument(projectCode: string, entryId: number, file: File): Promise<{ fileId: string; fileName: string; fileUrl: string }>;
}
