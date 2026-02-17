import { ChecklistResponseType, ChecklistStatus } from './IStartupChecklist';

export type CloseoutItemStatus = 'Not Started' | 'In Progress' | 'Complete';

export interface ICloseoutItem {
  id: number;
  projectCode: string;
  // Legacy fields (kept for backward compat)
  category: string;
  description: string;
  status: CloseoutItemStatus | ChecklistStatus;
  assignedTo: string;
  assignedToId?: number;
  completedDate?: string;
  notes?: string;
  // Section-based fields
  sectionNumber: number;
  sectionName: string;
  itemNumber: string;
  label: string;
  responseType: ChecklistResponseType;
  response: string | number | null;
  respondedBy?: string;
  respondedDate?: string;
  comment?: string;
  isHidden: boolean;
  isCustom: boolean;
  sortOrder: number;
  dateValue?: string;
  calculatedFrom?: string;
  placeholder?: string;
  details?: string;
}

export interface ICloseoutSection {
  number: number;
  name: string;
  itemCount: number;
}

export const CLOSEOUT_SECTIONS: ICloseoutSection[] = [
  { number: 1, name: 'Tasks', itemCount: 5 },
  { number: 2, name: 'Document Tracking', itemCount: 13 },
  { number: 3, name: 'Inspections', itemCount: 11 },
  { number: 4, name: 'Turnover', itemCount: 15 },
  { number: 5, name: 'Post Turnover', itemCount: 5 },
  { number: 6, name: 'Complete Project Closeout Documents for PX', itemCount: 5 },
  { number: 7, name: 'PBC Close-Out Requirements', itemCount: 16 },
];

export const DEFAULT_CLOSEOUT_ITEMS: Array<{
  sectionNumber: number;
  itemNumber: string;
  label: string;
  responseType: ChecklistResponseType;
  calculatedFrom?: string;
  details?: string;
}> = [
  // Section 1: Tasks
  { sectionNumber: 1, itemNumber: '1.1', label: 'Notify subcontractors of project completion and closeout requirements', responseType: 'yesNoNA' },
  { sectionNumber: 1, itemNumber: '1.2', label: 'Compile punch list and distribute to responsible parties', responseType: 'yesNoNA' },
  { sectionNumber: 1, itemNumber: '1.3', label: 'Schedule final walk-through with owner', responseType: 'yesNoNA' },
  { sectionNumber: 1, itemNumber: '1.4', label: 'Obtain owner sign-off on punch list completion', responseType: 'yesNoNA' },
  { sectionNumber: 1, itemNumber: '1.5', label: 'Submit final punch list status report', responseType: 'yesNoNA' },

  // Section 2: Document Tracking
  { sectionNumber: 2, itemNumber: '2.1', label: 'As-built drawings submitted and approved', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.2', label: 'O&M manuals collected and submitted', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.3', label: 'Warranty documents collected and submitted', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.4', label: 'Attic stock delivered and documented', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.5', label: 'Final lien waivers collected from all subcontractors', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.6', label: 'Final pay application submitted', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.7', label: 'Consent of surety obtained', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.8', label: 'Certificate of Substantial Completion issued', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.9', label: 'Final change orders processed', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.10', label: 'All RFIs closed out', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.11', label: 'All submittals closed out', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.12', label: 'Project photos organized and archived', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.13', label: 'Daily reports finalized and archived', responseType: 'yesNoNA' },

  // Section 3: Inspections
  { sectionNumber: 3, itemNumber: '3.1', label: 'Final building inspection passed', responseType: 'yesNoNA' },
  { sectionNumber: 3, itemNumber: '3.2', label: 'Fire alarm inspection and certification', responseType: 'yesNoNA' },
  { sectionNumber: 3, itemNumber: '3.3', label: 'Elevator inspection and certification', responseType: 'yesNoNA' },
  { sectionNumber: 3, itemNumber: '3.4', label: 'Mechanical systems commissioning complete', responseType: 'yesNoNA' },
  { sectionNumber: 3, itemNumber: '3.5', label: 'Electrical systems commissioning complete', responseType: 'yesNoNA' },
  { sectionNumber: 3, itemNumber: '3.6', label: 'Plumbing systems inspection passed', responseType: 'yesNoNA' },
  { sectionNumber: 3, itemNumber: '3.7', label: 'Life safety systems tested and certified', responseType: 'yesNoNA' },
  { sectionNumber: 3, itemNumber: '3.8', label: 'Environmental compliance verification', responseType: 'yesNoNA' },
  { sectionNumber: 3, itemNumber: '3.9', label: 'ADA compliance verification', responseType: 'yesNoNA' },
  { sectionNumber: 3, itemNumber: '3.10', label: 'Roof inspection and warranty certification', responseType: 'yesNoNA' },
  { sectionNumber: 3, itemNumber: '3.11', label: 'Site drainage and grading inspection', responseType: 'yesNoNA' },

  // Section 4: Turnover
  { sectionNumber: 4, itemNumber: '4.1', label: 'Owner training on building systems scheduled and completed', responseType: 'yesNoNA' },
  { sectionNumber: 4, itemNumber: '4.2', label: 'Keys and access devices turned over to owner', responseType: 'yesNoNA' },
  { sectionNumber: 4, itemNumber: '4.3', label: 'Security system codes and manuals provided', responseType: 'yesNoNA' },
  { sectionNumber: 4, itemNumber: '4.4', label: 'Utility accounts transferred to owner', responseType: 'yesNoNA' },
  { sectionNumber: 4, itemNumber: '4.5', label: 'Certificate of Occupancy obtained', responseType: 'yesNoNA' },
  { sectionNumber: 4, itemNumber: '4.6', label: 'Temporary facilities and equipment removed', responseType: 'yesNoNA' },
  { sectionNumber: 4, itemNumber: '4.7', label: 'Construction debris and waste removed from site', responseType: 'yesNoNA' },
  { sectionNumber: 4, itemNumber: '4.8', label: 'Final site cleanup completed', responseType: 'yesNoNA' },
  { sectionNumber: 4, itemNumber: '4.9', label: 'Signage and barricades removed', responseType: 'yesNoNA' },
  { sectionNumber: 4, itemNumber: '4.10', label: 'Landscaping and site restoration complete', responseType: 'yesNoNA' },
  { sectionNumber: 4, itemNumber: '4.11', label: 'Temporary utilities disconnected', responseType: 'yesNoNA' },
  { sectionNumber: 4, itemNumber: '4.12', label: 'Spare parts and extra materials delivered to owner', responseType: 'yesNoNA' },
  { sectionNumber: 4, itemNumber: '4.13', label: 'Date last contractual work on project was performed', responseType: 'date' },
  { sectionNumber: 4, itemNumber: '4.14', label: 'Flag 80 calendar days from last day HB worked on project', responseType: 'calculatedDate', calculatedFrom: '4.13' },
  { sectionNumber: 4, itemNumber: '4.15', label: 'Final turnover walk-through completed with owner', responseType: 'yesNoNA' },

  // Section 5: Post Turnover
  { sectionNumber: 5, itemNumber: '5.1', label: 'Warranty callback log established', responseType: 'yesNoNA' },
  { sectionNumber: 5, itemNumber: '5.2', label: 'One-year warranty walk-through scheduled', responseType: 'yesNoNA' },
  { sectionNumber: 5, itemNumber: '5.3', label: 'Lessons learned session completed', responseType: 'yesNoNA' },
  { sectionNumber: 5, itemNumber: '5.4', label: 'Subcontractor performance evaluations completed', responseType: 'yesNoNA' },
  { sectionNumber: 5, itemNumber: '5.5', label: 'Final project cost report submitted', responseType: 'yesNoNA' },

  // Section 6: Complete Project Closeout Documents for PX
  { sectionNumber: 6, itemNumber: '6.1', label: 'Final cost reconciliation complete', responseType: 'yesNoNA' },
  { sectionNumber: 6, itemNumber: '6.2', label: 'Project closeout binder compiled', responseType: 'yesNoNA' },
  { sectionNumber: 6, itemNumber: '6.3', label: 'Final project schedule submitted', responseType: 'yesNoNA' },
  { sectionNumber: 6, itemNumber: '6.4', label: 'Client satisfaction survey submitted', responseType: 'yesNoNA' },
  { sectionNumber: 6, itemNumber: '6.5', label: 'Project files archived per company standard', responseType: 'yesNoNA' },

  // Section 7: PBC Close-Out Requirements
  { sectionNumber: 7, itemNumber: '7.1', label: 'Final application for payment submitted', responseType: 'yesNoNA' },
  { sectionNumber: 7, itemNumber: '7.2', label: 'Contractor\'s final affidavit submitted', responseType: 'yesNoNA' },
  { sectionNumber: 7, itemNumber: '7.3', label: 'Final release of liens from all subcontractors', responseType: 'yesNoNA' },
  { sectionNumber: 7, itemNumber: '7.4', label: 'Consent of surety for final payment', responseType: 'yesNoNA' },
  { sectionNumber: 7, itemNumber: '7.5', label: 'Certificate of Substantial Completion executed', responseType: 'yesNoNA' },
  { sectionNumber: 7, itemNumber: '7.6', label: 'Structural letter of completion', responseType: 'yesNoNA', details: 'To be issued by Structural EOR, signed and sealed' },
  { sectionNumber: 7, itemNumber: '7.7', label: 'Final inspections by Authority Having Jurisdiction', responseType: 'yesNoNA', details: 'PBCFD (will include DDCV) & Plumbing' },
  { sectionNumber: 7, itemNumber: '7.8', label: 'All permits closed with final inspections', responseType: 'yesNoNA' },
  { sectionNumber: 7, itemNumber: '7.9', label: 'As-built survey submitted', responseType: 'yesNoNA' },
  { sectionNumber: 7, itemNumber: '7.10', label: 'Record drawings submitted', responseType: 'yesNoNA' },
  { sectionNumber: 7, itemNumber: '7.11', label: 'Operations and maintenance manuals submitted', responseType: 'yesNoNA' },
  { sectionNumber: 7, itemNumber: '7.12', label: 'Warranty documents submitted', responseType: 'yesNoNA' },
  { sectionNumber: 7, itemNumber: '7.13', label: 'TCO/CO issued by jurisdiction', responseType: 'yesNoNA', details: 'PBC will not issue TCO for phase if any inspections are recorded as incomplete / partial / failed' },
  { sectionNumber: 7, itemNumber: '7.14', label: 'Final inspections complete for all sub-permits', responseType: 'yesNoNA', details: 'As Required by Master Building Permit and All Associated Sub-Permits' },
  { sectionNumber: 7, itemNumber: '7.15', label: 'Impact fee credits reconciled', responseType: 'yesNoNA' },
  { sectionNumber: 7, itemNumber: '7.16', label: 'Special inspections final report', responseType: 'yesNoNA', details: 'May be required by PBC in addition to UES Final Inspection' },
];
