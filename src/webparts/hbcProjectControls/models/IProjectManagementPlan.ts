export type PMPStatus = 'Draft' | 'PendingSignatures' | 'PendingApproval' | 'Approved' | 'Returned' | 'Closed';
export type PMPSignatureStatus = 'Pending' | 'Signed' | 'Declined';
export type PMPSignatureType = 'Startup' | 'Completion';

export interface IPMPSignature {
  id: number;
  projectCode: string;
  signatureType: PMPSignatureType;
  role: string;
  personName: string;
  personEmail: string;
  isRequired: boolean;
  isLead: boolean;
  status: PMPSignatureStatus;
  signedDate: string | null;
  affidavitText: string;
  comment: string;
}

export interface IPMPApprovalStep {
  id: number;
  projectCode: string;
  stepOrder: number;
  approverRole: string;
  approverName: string;
  approverEmail: string;
  status: 'Pending' | 'Approved' | 'Returned';
  comment: string;
  actionDate: string | null;
  approvalCycleNumber: number;
}

export interface IPMPApprovalCycle {
  cycleNumber: number;
  submittedBy: string;
  submittedDate: string;
  status: 'InProgress' | 'Approved' | 'Returned';
  steps: IPMPApprovalStep[];
  changesFromPrevious: string[];
}

export interface IPMPBoilerplateSection {
  sectionNumber: string;
  sectionTitle: string;
  content: string;
  sourceDocumentUrl: string;
  lastSourceUpdate: string;
}

export interface IDivisionApprover {
  id: number;
  division: 'Commercial' | 'Luxury Residential';
  approverName: string;
  approverEmail: string;
  approverTitle: string;
}

export interface IProjectManagementPlan {
  id: number;
  projectCode: string;
  projectName: string;
  jobNumber: string;
  status: PMPStatus;
  currentCycleNumber: number;
  division: string;

  // PMP-only fields
  superintendentPlan: string;
  preconMeetingNotes: string;
  siteManagementNotes: string;
  projectAdminBuyoutDate: string | null;
  attachmentUrls: string[];

  // Aggregated references
  riskCostData: { contractType: string; contractAmount: number } | null;
  qualityConcerns: string[];
  safetyConcerns: string[];
  scheduleData: { startDate: string | null; completionDate: string | null } | null;
  superintendentPlanData: { completionPercentage: number } | null;
  lessonsLearned: string[];
  teamAssignments: string[];

  // Signatures & Approval
  startupSignatures: IPMPSignature[];
  completionSignatures: IPMPSignature[];
  approvalCycles: IPMPApprovalCycle[];
  boilerplate: IPMPBoilerplateSection[];

  // Meta
  createdBy: string;
  createdAt: string;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
}

export interface IPMPSectionDef {
  number: string;
  title: string;
  sourceType: 'boilerplate' | 'module' | 'pmp-only' | 'mixed' | 'link';
}

export const PMP_SECTIONS: IPMPSectionDef[] = [
  { number: 'I', title: 'Project Team Philosophy', sourceType: 'boilerplate' },
  { number: 'II', title: 'Team Assignment & Signatures', sourceType: 'mixed' },
  { number: 'III', title: 'Quality Control', sourceType: 'mixed' },
  { number: 'IV', title: 'Preconstruction Meeting', sourceType: 'mixed' },
  { number: 'V', title: 'Safety', sourceType: 'mixed' },
  { number: 'VI', title: 'Maintaining Cost Control', sourceType: 'mixed' },
  { number: 'VII', title: 'Project Schedule', sourceType: 'module' },
  { number: 'VIII', title: 'Team Responsibilities', sourceType: 'boilerplate' },
  { number: 'IX', title: 'Site Management', sourceType: 'mixed' },
  { number: 'X', title: "Superintendent's Plan", sourceType: 'module' },
  { number: 'XI', title: 'Project Administration', sourceType: 'mixed' },
  { number: 'XII', title: 'Project Closeout', sourceType: 'link' },
  { number: 'XIII', title: 'Attachments', sourceType: 'pmp-only' },
  { number: 'XIV', title: 'Lessons Learned', sourceType: 'link' },
  { number: 'XV', title: 'Pre-Work Meeting Agenda', sourceType: 'boilerplate' },
  { number: 'XVI', title: 'Job Start Up Checklist', sourceType: 'link' },
];
