export type ContractStatus = 'Draft' | 'In Review' | 'Executed';

export interface IContractInfo {
  id: number;
  leadId: number;
  projectCode: string;
  contractStatus: ContractStatus;
  contractType?: string;
  contractValue?: number;
  insuranceRequirements?: string;
  bondRequirements?: string;
  executionDate?: string;
  noticeToProceed?: string;
  substantialCompletion?: string;
  finalCompletion?: string;
  documents?: string[];
}
