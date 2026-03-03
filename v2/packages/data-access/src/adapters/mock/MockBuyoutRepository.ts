import type { IBuyoutEntry, ICommitmentApproval, IContractTrackingApproval, ICursorPageRequest, ICursorPageResult } from '@hbc/models';
import type { IBuyoutRepository } from '../../ports/IBuyoutRepository';

export class MockBuyoutRepository implements IBuyoutRepository {
  async getEntries(_projectCode: string): Promise<IBuyoutEntry[]> { return []; }
  async getEntriesPage(_request: ICursorPageRequest): Promise<ICursorPageResult<IBuyoutEntry>> { return { items: [], nextToken: null, hasMore: false }; }
  async initializeLog(_projectCode: string): Promise<IBuyoutEntry[]> { return []; }
  async addEntry(_projectCode: string, entry: Partial<IBuyoutEntry>): Promise<IBuyoutEntry> { return { id: 1, ...entry } as IBuyoutEntry; }
  async updateEntry(_projectCode: string, _entryId: number, _data: Partial<IBuyoutEntry>): Promise<IBuyoutEntry> { throw new Error('Not implemented'); }
  async removeEntry(_projectCode: string, _entryId: number): Promise<void> {}
  async submitForApproval(_projectCode: string, _entryId: number, _submittedBy: string): Promise<IBuyoutEntry> { throw new Error('Not implemented'); }
  async respondToApproval(_projectCode: string, _entryId: number, _approved: boolean, _comment: string, _escalate?: boolean): Promise<IBuyoutEntry> { throw new Error('Not implemented'); }
  async getApprovalHistory(_projectCode: string, _entryId: number): Promise<ICommitmentApproval[]> { return []; }
  async submitContractTracking(_projectCode: string, _entryId: number, _submittedBy: string): Promise<IBuyoutEntry> { throw new Error('Not implemented'); }
  async respondToContractTracking(_projectCode: string, _entryId: number, _approved: boolean, _comment: string): Promise<IBuyoutEntry> { throw new Error('Not implemented'); }
  async getContractTrackingHistory(_projectCode: string, _entryId: number): Promise<IContractTrackingApproval[]> { return []; }
  async uploadDocument(_projectCode: string, _entryId: number, _file: File): Promise<{ fileId: string; fileName: string; fileUrl: string }> { return { fileId: '1', fileName: 'mock.pdf', fileUrl: '/mock.pdf' }; }
}
