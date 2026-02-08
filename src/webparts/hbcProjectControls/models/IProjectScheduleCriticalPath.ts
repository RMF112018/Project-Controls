export type CriticalPathStatus = 'Active' | 'Monitoring' | 'Resolved';

export interface ICriticalPathItem {
  id: number;
  letter: string;
  description: string;
  impactDescription: string;
  status: CriticalPathStatus;
  mitigationPlan: string;
  createdDate: string;
  updatedDate: string;
}

export interface IProjectScheduleCriticalPath {
  id: number;
  projectCode: string;
  startDate: string | null;
  substantialCompletionDate: string | null;
  ntpDate: string | null;
  nocDate: string | null;
  contractCalendarDays: number | null;
  contractBasisType: string;
  teamGoalDaysAhead: number | null;
  teamGoalDescription: string;
  hasLiquidatedDamages: boolean;
  liquidatedDamagesAmount: number | null;
  liquidatedDamagesTerms: string;
  criticalPathConcerns: ICriticalPathItem[];
  createdBy: string;
  createdAt: string;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
}
