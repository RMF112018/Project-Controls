export type EstimatingKickoffSection = 'managing' | 'deliverables_standard' | 'deliverables_nonstandard';

export type EstimatingKickoffStatus = 'yes' | 'no' | 'na' | null;

export interface IEstimatingKickoffItem {
  id: number;
  section: EstimatingKickoffSection;
  task: string;
  status: EstimatingKickoffStatus;
  responsibleParty?: string;
  deadline?: string;
  frequency?: string;
  notes?: string;
  tabRequired?: boolean;
  isCustom?: boolean;
  sortOrder: number;
}

export interface IEstimatingKickoff {
  id: number;
  LeadID: number;
  ProjectCode: string;

  // Project Information (bi-directional sync with ILead)
  Architect?: string;
  ProposalDueDateTime?: string;
  ProposalType?: string;
  RFIFormat?: 'Excel' | 'Procore';
  PrimaryOwnerContact?: string;
  ProposalDeliveryMethod?: string;
  CopiesIfHandDelivered?: number;

  // Key Dates (sync to milestone schedule)
  HBProposalDue?: string;
  SubcontractorProposalsDue?: string;
  PreSubmissionReview?: string;
  SubcontractorSiteWalkThru?: string;
  OwnerEstimateReview?: string;

  // Checklist Items
  items: IEstimatingKickoffItem[];

  // Meeting
  KickoffMeetingId?: string;
  KickoffMeetingDate?: string;

  // Metadata
  CreatedBy: string;
  CreatedDate: string;
  ModifiedBy?: string;
  ModifiedDate?: string;
}
