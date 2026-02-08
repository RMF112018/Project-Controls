import { EVerifyStatus } from './IBuyoutEntry';
import { CommitmentStatus } from './ICommitmentApproval';

export interface IComplianceSummary {
  totalCommitments: number;
  fullyCompliant: number;
  eVerifyPending: number;
  eVerifyOverdue: number;
  waiversPending: number;
  documentsMissing: number;
}

export interface IComplianceEntry {
  id: number;
  projectCode: string;
  projectName: string;
  divisionCode: string;
  divisionDescription: string;
  subcontractorName: string;
  contractValue: number;

  // Risk Profile Status
  riskCompliant: boolean;
  qScore?: number;
  compassStatus?: string;

  // Document Status
  documentsCompliant: boolean;
  scopeMatch: boolean;
  exhibitC: boolean;
  exhibitD: boolean;
  exhibitE: boolean;
  hasCommitmentDocument: boolean;

  // Insurance/Bonding Status
  insuranceCompliant: boolean;
  sdiEnrolled: boolean;
  bondRequired: boolean;
  coiReceived: boolean;

  // E-Verify Status
  eVerifyCompliant: boolean;
  eVerifyStatus: EVerifyStatus;
  eVerifyContractNumber?: string;
  eVerifySentDate?: string;
  eVerifyReminderDate?: string;
  eVerifyReceivedDate?: string;

  // Overall
  commitmentStatus: CommitmentStatus;
  overallCompliant: boolean;
}

export interface IComplianceLogFilter {
  commitmentStatus?: CommitmentStatus;
  eVerifyStatus?: EVerifyStatus;
  projectCode?: string;
  searchQuery?: string;
}
