export type ContractTrackingStep = 'APM_PA' | 'ProjectManager' | 'RiskManager' | 'ProjectExecutive';

export type ContractTrackingStatus =
  | 'NotStarted'      // No workflow started
  | 'PendingAPM'      // Step 1: APM/PA review
  | 'PendingPM'       // Step 2: PM review
  | 'PendingRiskMgr'  // Step 3: Risk Manager review
  | 'PendingPX'       // Step 4: PX final approval
  | 'Tracked'         // Fully approved
  | 'Rejected';       // Rejected at any step

export interface IContractTrackingApproval {
  id: number;
  buyoutEntryId: number;
  projectCode: string;
  step: ContractTrackingStep;
  approverName: string;
  approverEmail: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Skipped';
  comment?: string;
  actionDate?: string;
  skippedReason?: string;
}
