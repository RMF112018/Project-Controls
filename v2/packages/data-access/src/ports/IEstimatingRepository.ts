import type {
  IEstimatingTracker,
  IEstimatingKickoff,
  IEstimatingKickoffItem,
  IKeyPersonnelEntry,
} from '@hbc/models';
import type { IPagedResult, IListQueryOptions } from '@hbc/models';

/**
 * Estimating repository — tracker records, kickoff management.
 */
export interface IEstimatingRepository {
  // Estimating Tracker
  getRecords(options?: IListQueryOptions): Promise<IPagedResult<IEstimatingTracker>>;
  getRecordById(id: number): Promise<IEstimatingTracker | null>;
  getByLeadId(leadId: number): Promise<IEstimatingTracker | null>;
  createRecord(data: Partial<IEstimatingTracker>): Promise<IEstimatingTracker>;
  updateRecord(id: number, data: Partial<IEstimatingTracker>): Promise<IEstimatingTracker>;
  getCurrentPursuits(): Promise<IEstimatingTracker[]>;
  getPreconEngagements(): Promise<IEstimatingTracker[]>;
  getEstimateLog(): Promise<IEstimatingTracker[]>;

  // Estimating Kick-Off
  getKickoff(projectCode: string): Promise<IEstimatingKickoff | null>;
  getKickoffByLeadId(leadId: number): Promise<IEstimatingKickoff | null>;
  createKickoff(data: Partial<IEstimatingKickoff>): Promise<IEstimatingKickoff>;
  updateKickoff(id: number, data: Partial<IEstimatingKickoff>): Promise<IEstimatingKickoff>;
  updateKickoffItem(kickoffId: number, itemId: number, data: Partial<IEstimatingKickoffItem>): Promise<IEstimatingKickoffItem>;
  addKickoffItem(kickoffId: number, item: Partial<IEstimatingKickoffItem>): Promise<IEstimatingKickoffItem>;
  removeKickoffItem(kickoffId: number, itemId: number): Promise<void>;
  updateKickoffKeyPersonnel(kickoffId: number, personnel: IKeyPersonnelEntry[]): Promise<IEstimatingKickoff>;
}
