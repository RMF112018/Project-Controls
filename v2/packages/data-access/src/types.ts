import type { ILeadRepository } from './ports/ILeadRepository';
import type { IScorecardRepository } from './ports/IScorecardRepository';
import type { IEstimatingRepository } from './ports/IEstimatingRepository';
import type { IScheduleRepository } from './ports/IScheduleRepository';
import type { IBuyoutRepository } from './ports/IBuyoutRepository';
import type { IComplianceRepository } from './ports/IComplianceRepository';
import type { IContractRepository } from './ports/IContractRepository';
import type { IRiskRepository } from './ports/IRiskRepository';
import type { IPMPRepository } from './ports/IPMPRepository';
import type { IProjectRepository } from './ports/IProjectRepository';
import type { ITurnoverRepository } from './ports/ITurnoverRepository';
import type { IAuthRepository } from './ports/IAuthRepository';
import type { IAuditRepository } from './ports/IAuditRepository';
import type { IWorkflowRepository } from './ports/IWorkflowRepository';
import type { IInfraRepository } from './ports/IInfraRepository';

/**
 * The complete set of domain repositories.
 * Replaces the monolithic IDataService with focused, domain-scoped interfaces.
 */
export interface IRepositories {
  leads: ILeadRepository;
  scorecards: IScorecardRepository;
  estimating: IEstimatingRepository;
  schedule: IScheduleRepository;
  buyout: IBuyoutRepository;
  compliance: IComplianceRepository;
  contracts: IContractRepository;
  risk: IRiskRepository;
  pmp: IPMPRepository;
  project: IProjectRepository;
  turnover: ITurnoverRepository;
  auth: IAuthRepository;
  audit: IAuditRepository;
  workflow: IWorkflowRepository;
  infra: IInfraRepository;
}

export type DataServiceMode = 'mock' | 'sharepoint' | 'api';

export interface SpConfig {
  /** PnPjs SPFI instance */
  sp: unknown;
  /** Hub site URL */
  hubUrl: string;
}
