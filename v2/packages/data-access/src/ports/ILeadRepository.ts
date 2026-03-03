import type { ILead, ILeadFormData } from '@hbc/models';
import type { IPagedResult, IListQueryOptions } from '@hbc/models';
import type { Stage } from '@hbc/models';

/**
 * Lead management repository — BD pipeline, lead lifecycle, search.
 */
export interface ILeadRepository {
  getAll(options?: IListQueryOptions): Promise<IPagedResult<ILead>>;
  getById(id: number): Promise<ILead | null>;
  getByStage(stage: Stage): Promise<ILead[]>;
  create(data: ILeadFormData): Promise<ILead>;
  update(id: number, data: Partial<ILead>): Promise<ILead>;
  delete(id: number): Promise<void>;
  search(query: string): Promise<ILead[]>;
}
