import { IPersonAssignment } from './IWorkflowDefinition';

export type EstimatingKickoffSection =
  | 'project_info'
  | 'managing'
  | 'key_dates'
  | 'deliverables_standard'
  | 'deliverables_nonstandard';

export type EstimatingKickoffStatus = 'yes' | 'no' | 'na' | null;

export type KickoffDeliverableStatus = 'Pending' | 'In Progress' | 'Complete' | null;

export interface IKeyPersonnelEntry {
  id: number;
  label: string;
  person: IPersonAssignment;
}

export interface IEstimatingKickoffItem {
  id: number;
  /** FK to parent Estimating_Kickoffs.id */
  kickoffId?: number;
  /** FK to project — enables direct queries */
  projectCode?: string;
  section: EstimatingKickoffSection;
  task: string;
  status: EstimatingKickoffStatus;
  responsibleParty?: string;
  assignees?: IPersonAssignment[];
  deadline?: string;
  frequency?: string;
  notes?: string;
  tabRequired?: boolean;
  isCustom?: boolean;
  deliverableStatus?: KickoffDeliverableStatus;
  /** For project_info/key_dates items, maps to a parent IEstimatingKickoff field */
  parentField?: string;
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
  RFIFormat?: 'Excel' | 'Procore' | 'Other';
  PrimaryOwnerContact?: string;
  OwnerContactPhone?: string;
  OwnerContactEmail?: string;
  RFIFormatOther?: string;
  ProposalDeliveryMethod?: string;
  CopiesIfHandDelivered?: number;

  // Key Dates (sync to milestone schedule)
  HBProposalDue?: string;
  SubcontractorProposalsDue?: string;
  PreSubmissionReview?: string;
  SubcontractorSiteWalkThru?: string;
  WinStrategyMeeting?: string;
  OwnerEstimateReview?: string;

  // Key Personnel
  keyPersonnel?: IKeyPersonnelEntry[];

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
