import type { IEstimatingTracker, IEstimatingKickoff, IEstimatingKickoffItem, IKeyPersonnelEntry, IPagedResult, IListQueryOptions } from '@hbc/models';
import type { IEstimatingRepository } from '../../ports/IEstimatingRepository';

export class MockEstimatingRepository implements IEstimatingRepository {
  async getRecords(_options?: IListQueryOptions): Promise<IPagedResult<IEstimatingTracker>> { return { items: [], totalCount: 0, hasMore: false }; }
  async getRecordById(_id: number): Promise<IEstimatingTracker | null> { return null; }
  async getByLeadId(_leadId: number): Promise<IEstimatingTracker | null> { return null; }
  async createRecord(data: Partial<IEstimatingTracker>): Promise<IEstimatingTracker> { return { id: 1, ...data } as IEstimatingTracker; }
  async updateRecord(_id: number, _data: Partial<IEstimatingTracker>): Promise<IEstimatingTracker> { throw new Error('Not implemented'); }
  async getCurrentPursuits(): Promise<IEstimatingTracker[]> { return []; }
  async getPreconEngagements(): Promise<IEstimatingTracker[]> { return []; }
  async getEstimateLog(): Promise<IEstimatingTracker[]> { return []; }
  async getKickoff(_projectCode: string): Promise<IEstimatingKickoff | null> { return null; }
  async getKickoffByLeadId(_leadId: number): Promise<IEstimatingKickoff | null> { return null; }
  async createKickoff(data: Partial<IEstimatingKickoff>): Promise<IEstimatingKickoff> { return { id: 1, ...data } as IEstimatingKickoff; }
  async updateKickoff(_id: number, _data: Partial<IEstimatingKickoff>): Promise<IEstimatingKickoff> { throw new Error('Not implemented'); }
  async updateKickoffItem(_kickoffId: number, _itemId: number, _data: Partial<IEstimatingKickoffItem>): Promise<IEstimatingKickoffItem> { throw new Error('Not implemented'); }
  async addKickoffItem(_kickoffId: number, _item: Partial<IEstimatingKickoffItem>): Promise<IEstimatingKickoffItem> { throw new Error('Not implemented'); }
  async removeKickoffItem(_kickoffId: number, _itemId: number): Promise<void> {}
  async updateKickoffKeyPersonnel(_kickoffId: number, _personnel: IKeyPersonnelEntry[]): Promise<IEstimatingKickoff> { throw new Error('Not implemented'); }
}
