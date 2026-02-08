export type CommitmentStatus =
  | 'Budgeted'
  | 'PendingReview'
  | 'WaiverPending'
  | 'PXApproved'
  | 'ComplianceReview'
  | 'CFOReview'
  | 'Committed'
  | 'Rejected';

export type WaiverType = 'SDI' | 'Bond' | 'Insurance' | 'Multiple';

export type ApprovalStep = 'PX' | 'ComplianceManager' | 'CFO';

export interface ICommitmentApproval {
  id: number;
  buyoutEntryId: number;
  projectCode: string;
  step: ApprovalStep;
  approverName: string;
  approverEmail: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Escalated';
  comment?: string;
  actionDate?: string;
  waiverType?: WaiverType;
}

export interface IRiskAssessment {
  triggers: string[];
  requiresWaiver: boolean;
  escalationLevel: ApprovalStep;
  qScoreWarning: boolean;
}
