import { IEstimatingKickoffItem, EstimatingKickoffSection } from '../models/IEstimatingKickoff';

type TemplateEntry = {
  section: EstimatingKickoffSection;
  task: string;
  isCustom?: boolean;
  tabRequired?: boolean;
};

const TEMPLATE_ITEMS: TemplateEntry[] = [
  // Managing Information
  { section: 'managing', task: 'Finalize Subcontractor Bid List in BC' },
  { section: 'managing', task: 'Send ITB to Subcontractors' },
  { section: 'managing', task: 'Phone Calls to improve Sub coverage' },
  { section: 'managing', task: 'Send Mass Messages in Building Connected to improve Sub coverage' },
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
  { section: 'managing', task: 'Request Revit Files from Owner/Architect' },
  { section: 'managing', task: 'Assemble Closure Document Books' },
  { section: 'managing', task: 'Submit Permit and NOC' },

  // Final Deliverables (Standard)
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
  { section: 'deliverables_standard', task: 'By Who List' },
  { section: 'deliverables_standard', task: 'Back Cover', tabRequired: true },

  // Final Deliverables (Non-Standard)
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
    sortOrder: index + 1,
  }));
};
