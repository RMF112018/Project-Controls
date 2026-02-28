/**
 * Stage 8/11 — Estimating Kickoff Template Factory
 *
 * Generates the full set of template items matching 100% of rows from
 * reference/Estimating Kickoff Template.xlsx across all 5 sections.
 *
 * Items with `parentField` map to fields on the parent IEstimatingKickoff
 * record rather than being standalone checklist items.
 */
import { IEstimatingKickoffItem, EstimatingKickoffSection } from '../models/IEstimatingKickoff';

type TemplateEntry = {
  section: EstimatingKickoffSection;
  task: string;
  isCustom?: boolean;
  tabRequired?: boolean;
  /** For project_info/key_dates items, maps to a parent IEstimatingKickoff field */
  parentField?: string;
};

const TEMPLATE_ITEMS: TemplateEntry[] = [
  // ── Section 1: Project Information (14 rows) ───────────────────────
  { section: 'project_info', task: 'Job Name', parentField: 'Title' },
  { section: 'project_info', task: 'Job Number', parentField: 'ProjectCode' },
  { section: 'project_info', task: 'Architect', parentField: 'Architect' },
  { section: 'project_info', task: 'Proposal Due Date & Time', parentField: 'ProposalDueDateTime' },
  { section: 'project_info', task: 'Proposal to be Delivered Via', parentField: 'ProposalDeliveryMethod' },
  { section: 'project_info', task: 'How Many Copies if Hand Delivered', parentField: 'CopiesIfHandDelivered' },
  { section: 'project_info', task: 'Type of Proposal', parentField: 'ProposalType' },
  { section: 'project_info', task: 'RFI Format', parentField: 'RFIFormat' },
  { section: 'project_info', task: 'RFI Format - Other (Specify)', parentField: 'RFIFormatOther' },
  { section: 'project_info', task: 'Project Executive', parentField: 'keyPersonnel:PX' },
  { section: 'project_info', task: "Owner's Point of Contact", parentField: 'PrimaryOwnerContact' },
  { section: 'project_info', task: 'Owner Contact Phone', parentField: 'OwnerContactPhone' },
  { section: 'project_info', task: 'Owner Contact Email', parentField: 'OwnerContactEmail' },
  { section: 'project_info', task: 'Assigned Estimator(s)', parentField: 'keyPersonnel:Lead Estimator' },

  // ── Section 2: Managing Information (26 rows) ─────────────────────
  { section: 'managing', task: 'Finalize Subcontractor Bid List in BC' },
  { section: 'managing', task: 'Send ITB to Subcontractors' },
  { section: 'managing', task: 'Phone Calls to improve Sub coverage' },
  { section: 'managing', task: 'Send Mass Messages in Building Connected' },
  { section: 'managing', task: 'Complete Bid Packages' },
  { section: 'managing', task: 'Complete Scope Sheets' },
  { section: 'managing', task: 'RFI Management (Point Person)' },
  { section: 'managing', task: 'Invite Project Team to Procore' },
  { section: 'managing', task: 'Request Bid Bond from CFO' },
  { section: 'managing', task: 'Request CCIP proposal from CFO' },
  { section: 'managing', task: 'Request financials from CFO' },
  { section: 'managing', task: 'AIA Contract Review by Legal' },
  { section: 'managing', task: 'Are there bid forms to be used?' },
  { section: 'managing', task: 'Submit/obtain Builders Risk Insurance Quote' },
  { section: 'managing', task: 'Review other ITB Requirements (Self Performance, SBE, etc.)' },
  { section: 'managing', task: 'Add Warranty line item?' },
  { section: 'managing', task: 'Milestone Schedule' },
  { section: 'managing', task: 'Detailed Precon Schedule' },
  { section: 'managing', task: 'Detailed Project Schedule' },
  { section: 'managing', task: 'Site Logistics Plan' },
  { section: 'managing', task: 'BIM Modeling or Scanning' },
  { section: 'managing', task: 'VDC Coordination' },
  { section: 'managing', task: 'VDC Clash Detection' },
  { section: 'managing', task: 'Request Revit Files from Owner/Architect' },
  { section: 'managing', task: 'Assemble Closure Document Books' },
  { section: 'managing', task: 'Submit Permit and NOC' },

  // ── Section 3: Key Dates (6 rows) ─────────────────────────────────
  { section: 'key_dates', task: "HB's Proposal Due", parentField: 'HBProposalDue' },
  { section: 'key_dates', task: 'Subcontractor Proposals Due', parentField: 'SubcontractorProposalsDue' },
  { section: 'key_dates', task: 'Schedule Pre-Submission Estimate Review', parentField: 'PreSubmissionReview' },
  { section: 'key_dates', task: 'Schedule Win Strategy Meeting', parentField: 'WinStrategyMeeting' },
  { section: 'key_dates', task: 'Schedule Subcontractor Site Walk-Thru', parentField: 'SubcontractorSiteWalkThru' },
  { section: 'key_dates', task: 'Schedule Owner Estimate Review', parentField: 'OwnerEstimateReview' },

  // ── Section 4: Final Deliverables – Standard Sections (16 rows) ───
  { section: 'deliverables_standard', task: 'Front Cover', tabRequired: true },
  { section: 'deliverables_standard', task: 'Executive Summary', tabRequired: true },
  { section: 'deliverables_standard', task: 'Cost Summary', tabRequired: true },
  { section: 'deliverables_standard', task: 'Detailed GC/GC Breakdown (optional)' },
  { section: 'deliverables_standard', task: 'Detailed COW Breakdown (optional)' },
  { section: 'deliverables_standard', task: 'List of Allowances', tabRequired: true },
  { section: 'deliverables_standard', task: 'Clarifications and Assumptions', tabRequired: true },
  { section: 'deliverables_standard', task: 'Value Analysis log', tabRequired: true },
  { section: 'deliverables_standard', task: 'Schedule', tabRequired: true },
  { section: 'deliverables_standard', task: 'Logistics Plan', tabRequired: true },
  { section: 'deliverables_standard', task: 'List of Documents', tabRequired: true },
  { section: 'deliverables_standard', task: 'Team Organization Chart and Resumes' },
  { section: 'deliverables_standard', task: 'Previous Experience' },
  { section: 'deliverables_standard', task: 'BIM Proposal Required' },
  { section: 'deliverables_standard', task: 'By Who List' },
  { section: 'deliverables_standard', task: 'Back Cover', tabRequired: true },

  // ── Section 5: Final Deliverables – Non-Standard Sections (9 rows) ─
  { section: 'deliverables_nonstandard', task: 'Financials' },
  { section: 'deliverables_nonstandard', task: 'GC License' },
  { section: 'deliverables_nonstandard', task: 'BIM' },
  { section: 'deliverables_nonstandard', task: 'Contract' },
  { section: 'deliverables_nonstandard', task: 'Bid Bond' },
  { section: 'deliverables_nonstandard', task: 'Business Terms' },
  { section: 'deliverables_nonstandard', task: 'Other', isCustom: true },
  { section: 'deliverables_nonstandard', task: 'Other', isCustom: true },
  { section: 'deliverables_nonstandard', task: 'Other', isCustom: true },
];

export const createEstimatingKickoffTemplate = (): IEstimatingKickoffItem[] => {
  let nextId = 1;
  return TEMPLATE_ITEMS.map((entry, index) => ({
    id: nextId++,
    section: entry.section,
    task: entry.task,
    status: null,
    responsibleParty: '',
    deadline: '',
    frequency: '',
    notes: '',
    tabRequired: entry.tabRequired,
    isCustom: entry.isCustom ?? false,
    parentField: entry.parentField,
    deliverableStatus: null,
    sortOrder: index + 1,
  }));
};
