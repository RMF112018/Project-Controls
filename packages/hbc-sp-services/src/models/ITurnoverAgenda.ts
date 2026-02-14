import { TurnoverStatus } from './enums';

export interface ITurnoverAgenda {
  id: number;
  projectCode: string;
  leadId: number;
  status: TurnoverStatus;
  /** @denormalized — source: Leads_Master.Title */
  projectName: string;
  header: ITurnoverProjectHeader;
  estimateOverview: ITurnoverEstimateOverview;
  prerequisites: ITurnoverPrerequisite[];
  discussionItems: ITurnoverDiscussionItem[];
  subcontractors: ITurnoverSubcontractor[];
  exhibits: ITurnoverExhibit[];
  signatures: ITurnoverSignature[];
  meetingDate?: string;
  recordingUrl?: string;
  turnoverFolderUrl?: string;
  bcPublished?: boolean;
  pmName?: string;
  apmName?: string;
  createdBy: string;
  createdDate: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
}

export interface ITurnoverProjectHeader {
  id: number;
  turnoverAgendaId: number;
  projectName: string;
  projectCode: string;
  clientName: string;
  projectValue: number;
  deliveryMethod: string;
  projectExecutive: string;
  projectManager: string;
  leadEstimator: string;
  overrides: Record<string, boolean>;
}

export interface ITurnoverPrerequisite {
  id: number;
  turnoverAgendaId: number;
  sortOrder: number;
  label: string;
  description: string;
  completed: boolean;
  completedBy?: string;
  completedDate?: string;
}

export interface ITurnoverEstimateOverview {
  id: number;
  turnoverAgendaId: number;
  /** @denormalized — source: Leads_Master.ProjectValue */
  contractAmount: number;
  originalEstimate: number;
  buyoutTarget: number;
  estimatedFee: number;
  estimatedGrossMargin: number;
  contingency: number;
  notes: string;
  overrides: Record<string, boolean>;
}

export interface ITurnoverDiscussionItem {
  id: number;
  turnoverAgendaId: number;
  sortOrder: number;
  label: string;
  description: string;
  discussed: boolean;
  notes: string;
  attachments: ITurnoverAttachment[];
}

export interface ITurnoverSubcontractor {
  id: number;
  turnoverAgendaId: number;
  trade: string;
  subcontractorName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  qScore: number | null;
  isPreferred: boolean;
  isRequired: boolean;
  notes: string;
}

export interface ITurnoverExhibit {
  id: number;
  turnoverAgendaId: number;
  sortOrder: number;
  label: string;
  isDefault: boolean;
  reviewed: boolean;
  reviewedBy?: string;
  reviewedDate?: string;
  linkedDocumentUrl?: string;
  uploadedFileName?: string;
  uploadedFileUrl?: string;
}

export interface ITurnoverSignature {
  id: number;
  turnoverAgendaId: number;
  sortOrder: number;
  role: string;
  signerName: string;
  signerEmail: string;
  affidavitText: string;
  signed: boolean;
  signedDate?: string;
  comment?: string;
}

export interface ITurnoverAttachment {
  id: number;
  discussionItemId: number;
  fileName: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedDate: string;
}
