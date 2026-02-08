export type ChecklistResponseType = 'yesNoNA' | 'yesNoWithComment' | 'textInput' | 'numeric';

export type ChecklistStatus = 'Conforming' | 'Deficient' | 'NA' | 'Neutral' | 'NoResponse';

export interface IChecklistActivityEntry {
  /** Auto-generated ID for flat storage */
  id?: number;
  /** FK to parent Startup_Checklist item */
  checklistItemId?: number;
  /** FK to project — enables direct queries */
  projectCode?: string;
  timestamp: string;
  user: string;
  previousValue: string | null;
  newValue: string | null;
  comment?: string;
}

export interface IStartupChecklistItem {
  id: number;
  projectCode: string;
  sectionNumber: number;
  sectionName: string;
  itemNumber: string;
  label: string;
  responseType: ChecklistResponseType;
  response: string | number | null;
  status: ChecklistStatus;
  respondedBy: string | null;
  respondedDate: string | null;
  assignedTo: string | null;
  assignedToName: string | null;
  comment: string | null;
  isHidden: boolean;
  isCustom: boolean;
  sortOrder: number;
  activityLog: IChecklistActivityEntry[];
}

export interface IStartupChecklistSummary {
  total: number;
  conforming: number;
  deficient: number;
  na: number;
  neutral: number;
  noResponse: number;
}

export interface IChecklistSection {
  number: number;
  name: string;
  itemCount: number;
}

export const CHECKLIST_SECTIONS: IChecklistSection[] = [
  { number: 1, name: 'Review Owner\'s Contract', itemCount: 4 },
  { number: 2, name: 'Job Start-up', itemCount: 33 },
  { number: 3, name: 'Order Services and Equipment', itemCount: 6 },
  { number: 4, name: 'Permits Posted on Jobsite', itemCount: 12 },
];

export const DEFAULT_CHECKLIST_ITEMS: Array<{
  sectionNumber: number;
  itemNumber: string;
  label: string;
  responseType: ChecklistResponseType;
}> = [
  // Section 1: Review Owner's Contract
  { sectionNumber: 1, itemNumber: '1.1', label: 'Review owner\'s contract', responseType: 'yesNoNA' },
  { sectionNumber: 1, itemNumber: '1.2', label: 'Contract type', responseType: 'textInput' },
  { sectionNumber: 1, itemNumber: '1.3', label: 'Owner-furnished items identified and documented', responseType: 'yesNoWithComment' },
  { sectionNumber: 1, itemNumber: '1.4', label: 'Liquidated damages clause reviewed', responseType: 'yesNoNA' },

  // Section 2: Job Start-up
  { sectionNumber: 2, itemNumber: '2.1', label: 'Project Executive assigned', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.2', label: 'Project Manager assigned', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.3', label: 'Superintendent assigned', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.4', label: 'Project Engineer/Assistant PM assigned', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.5', label: 'Project Accountant assigned', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.6', label: 'Internal kick-off meeting scheduled', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.7', label: 'Pre-construction meeting with owner scheduled', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.8', label: 'Project schedule developed', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.9', label: 'Subcontractor pre-qualification completed', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.10', label: 'Buyout schedule established', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.11', label: 'Subcontracts issued', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.12', label: 'Purchase orders issued', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.13', label: 'Insurance certificates obtained from subs', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.14', label: 'Builder\'s risk insurance in place', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.15', label: 'Payment and performance bonds obtained', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.16', label: 'Job cost code structure set up', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.17', label: 'Project budget entered in accounting system', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.18', label: 'Submittal log created', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.19', label: 'RFI log created', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.20', label: 'Change order log created', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.21', label: 'Drawing log/plan management system set up', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.22', label: 'Daily report system established', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.23', label: 'Photo documentation system established', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.24', label: 'Safety plan developed for project', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.25', label: 'Site-specific safety orientation developed', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.26', label: 'Emergency action plan established', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.27', label: 'Quality control plan developed', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.28', label: 'SWPPP/erosion control plan in place', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.29', label: 'Site logistics plan developed', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.30', label: 'Temporary facilities planned', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.31', label: 'Project sign installed', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.32', label: 'Project directory distributed', responseType: 'yesNoNA' },
  { sectionNumber: 2, itemNumber: '2.33', label: 'As-built document process established', responseType: 'yesNoNA' },

  // Section 3: Order Services and Equipment
  { sectionNumber: 3, itemNumber: '3.1', label: 'Temporary power arranged', responseType: 'yesNoNA' },
  { sectionNumber: 3, itemNumber: '3.2', label: 'Temporary water arranged', responseType: 'yesNoNA' },
  { sectionNumber: 3, itemNumber: '3.3', label: 'Portable toilets ordered', responseType: 'yesNoNA' },
  { sectionNumber: 3, itemNumber: '3.4', label: 'Dumpster/waste management arranged', responseType: 'yesNoNA' },
  { sectionNumber: 3, itemNumber: '3.5', label: 'Fencing and site security arranged', responseType: 'yesNoNA' },
  { sectionNumber: 3, itemNumber: '3.6', label: 'Surveying services arranged', responseType: 'yesNoNA' },

  // Section 4: Permits Posted on Jobsite
  { sectionNumber: 4, itemNumber: '4.1', label: 'Building permit obtained and posted', responseType: 'yesNoNA' },
  { sectionNumber: 4, itemNumber: '4.2', label: 'OSHA poster displayed', responseType: 'yesNoNA' },
  { sectionNumber: 4, itemNumber: '4.3', label: 'Equal opportunity poster displayed', responseType: 'yesNoNA' },
  { sectionNumber: 4, itemNumber: '4.4', label: 'Workers compensation poster displayed', responseType: 'yesNoNA' },
  { sectionNumber: 4, itemNumber: '4.5', label: 'Minimum wage poster displayed', responseType: 'yesNoNA' },
  { sectionNumber: 4, itemNumber: '4.6', label: 'NPDES/dewatering permit obtained', responseType: 'yesNoNA' },
  { sectionNumber: 4, itemNumber: '4.7', label: 'Environmental permits obtained', responseType: 'yesNoNA' },
  { sectionNumber: 4, itemNumber: '4.8', label: 'Fire department permit/notification', responseType: 'yesNoNA' },
  { sectionNumber: 4, itemNumber: '4.9', label: 'Street/sidewalk closure permit obtained', responseType: 'yesNoNA' },
  { sectionNumber: 4, itemNumber: '4.10', label: 'Crane permit obtained', responseType: 'yesNoNA' },
  { sectionNumber: 4, itemNumber: '4.11', label: 'Demolition permit obtained', responseType: 'yesNoNA' },
  { sectionNumber: 4, itemNumber: '4.12', label: 'Utility connection permits obtained', responseType: 'yesNoNA' },
];
