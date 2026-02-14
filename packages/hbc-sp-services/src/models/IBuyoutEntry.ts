import { CommitmentStatus, WaiverType, ApprovalStep, ICommitmentApproval } from './ICommitmentApproval';

export type BuyoutStatus = 'Not Started' | 'In Progress' | 'Awarded' | 'Executed';

export type CompassPreQualStatus = 'Approved' | 'Pending' | 'Expired' | 'Not Registered';

export type EVerifyStatus = 'Not Sent' | 'Sent' | 'Reminder Sent' | 'Received' | 'Overdue';

export interface IBuyoutEntry {
  id: number;
  projectCode: string;
  divisionCode: string;        // e.g., "02-300", "05-120"
  divisionDescription: string; // e.g., "Staking", "Structural Steel"
  isStandard: boolean;         // true for pre-populated divisions

  // Budgeting
  originalBudget: number;      // Manual entry
  estimatedTax: number;
  totalBudget: number;         // Calculated: originalBudget + estimatedTax

  // Award Information
  subcontractorName?: string;
  contractValue?: number;
  overUnder?: number;          // Calculated: totalBudget - contractValue

  // Compliance (Tracking Only)
  enrolledInSDI: boolean;      // Yes/No
  bondRequired: boolean;       // Yes/No

  // Risk Profile (Compass Integration)
  qScore?: number;                          // Compass Q-Score (0-100)
  compassPreQualStatus?: CompassPreQualStatus;

  // Compliance Checklist
  scopeMatchesBudget?: boolean;
  exhibitCInsuranceConfirmed?: boolean;
  exhibitDScheduleConfirmed?: boolean;
  exhibitESafetyConfirmed?: boolean;

  // Commitment Status & Workflow
  commitmentStatus: CommitmentStatus;
  waiverRequired: boolean;
  waiverType?: WaiverType;
  waiverReason?: string;

  // Compiled Commitment Document
  compiledCommitmentPdfUrl?: string;
  compiledCommitmentFileId?: string;
  compiledCommitmentFileName?: string;

  // E-Verify Compliance
  eVerifyContractNumber?: string;
  eVerifySentDate?: string;
  eVerifyReminderDate?: string;
  eVerifyReceivedDate?: string;
  eVerifyStatus?: EVerifyStatus;

  // Approval Tracking
  currentApprovalStep?: ApprovalStep;
  approvalHistory: ICommitmentApproval[];

  // Milestone Dates
  loiSentDate?: string;
  loiReturnedDate?: string;
  contractSentDate?: string;
  contractExecutedDate?: string;
  insuranceCOIReceivedDate?: string;

  // Status (legacy — kept for backward compatibility)
  status: BuyoutStatus;
  notes?: string;
  createdDate: string;
  modifiedDate: string;
}
