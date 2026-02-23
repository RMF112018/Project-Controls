export interface IProjectKpiSnapshot {
  projectCode: string;
  projectName: string;
  clientName?: string;
  currentContractValue?: number;
  percentComplete?: number;
  overallHealth?: 'Green' | 'Yellow' | 'Red';
  lastActivityDate?: string; // ISO date
}
