export type MatrixAssignment = 'X' | 'Support' | 'Sign-Off' | 'Review' | '';

export type OwnerContractParty = 'O' | 'A/E' | 'C' | '';

export interface IInternalMatrixTask {
  id: number;
  projectCode: string;
  sortOrder: number;
  taskCategory: string;
  taskDescription: string;
  PX: MatrixAssignment;
  SrPM: MatrixAssignment;
  PM2: MatrixAssignment;
  PM1: MatrixAssignment;
  PA: MatrixAssignment;
  QAQC: MatrixAssignment;
  ProjAcct: MatrixAssignment;
  isHidden: boolean;
  isCustom: boolean;
}

export interface ITeamRoleAssignment {
  projectCode: string;
  roleAbbreviation: string;
  assignedPerson: string;
  assignedPersonEmail: string;
}

export interface IRecurringCalendarItem {
  id: number;
  projectCode: string;
  role: string;
  duePattern: string;
  description: string;
  isActive: boolean;
}

export interface IOwnerContractArticle {
  id: number;
  projectCode: string;
  sortOrder: number;
  articleNumber: string;
  pageNumber: string;
  responsibleParty: OwnerContractParty;
  description: string;
  isHidden: boolean;
  isCustom: boolean;
}

export interface ISubContractClause {
  id: number;
  projectCode: string;
  sortOrder: number;
  refNumber: string;
  pageNumber: string;
  clauseDescription: string;
  ProjExec: MatrixAssignment;
  ProjMgr: MatrixAssignment;
  AsstPM: MatrixAssignment;
  Super: MatrixAssignment;
  ProjAdmin: MatrixAssignment;
  isHidden: boolean;
  isCustom: boolean;
}

export const MATRIX_ROLE_COLUMNS = ['PX', 'SrPM', 'PM2', 'PM1', 'PA', 'QAQC', 'ProjAcct'] as const;

export const MATRIX_ROLE_LABELS: Record<string, string> = {
  PX: 'Project Executive',
  SrPM: 'Sr. Project Manager',
  PM2: 'Project Manager 2',
  PM1: 'Project Manager 1',
  PA: 'Project Administrator',
  QAQC: 'QA/QC',
  ProjAcct: 'Project Accountant',
};

export const SUB_ROLE_COLUMNS = ['ProjExec', 'ProjMgr', 'AsstPM', 'Super', 'ProjAdmin'] as const;

export const SUB_ROLE_LABELS: Record<string, string> = {
  ProjExec: 'Project Exc.',
  ProjMgr: 'Project Mgr.',
  AsstPM: 'Asst. PM',
  Super: 'Super',
  ProjAdmin: 'Project Admin',
};

export const ASSIGNMENT_CYCLE: MatrixAssignment[] = ['', 'X', 'Support', 'Sign-Off', 'Review'];

export const OWNER_CONTRACT_PARTIES: { value: OwnerContractParty; label: string }[] = [
  { value: '', label: '' },
  { value: 'O', label: 'O — Owner Activity' },
  { value: 'A/E', label: 'A/E — Architect/Engineer Activity' },
  { value: 'C', label: 'C — Contractor Activity' },
];

export const DEFAULT_INTERNAL_MATRIX_TASKS: Array<{
  taskCategory: string;
  taskDescription: string;
  PX: MatrixAssignment;
  SrPM: MatrixAssignment;
  PM2: MatrixAssignment;
  PM1: MatrixAssignment;
  PA: MatrixAssignment;
  QAQC: MatrixAssignment;
  ProjAcct: MatrixAssignment;
}> = [
  // PX (4 tasks)
  { taskCategory: 'PX', taskDescription: 'Overall project oversight and client relationship', PX: 'X', SrPM: 'Support', PM2: '', PM1: '', PA: '', QAQC: '', ProjAcct: '' },
  { taskCategory: 'PX', taskDescription: 'Contract negotiations and execution', PX: 'X', SrPM: 'Support', PM2: '', PM1: '', PA: '', QAQC: '', ProjAcct: '' },
  { taskCategory: 'PX', taskDescription: 'Risk assessment and mitigation strategy', PX: 'X', SrPM: 'Review', PM2: '', PM1: '', PA: '', QAQC: 'Support', ProjAcct: '' },
  { taskCategory: 'PX', taskDescription: 'Executive reporting and stakeholder communication', PX: 'X', SrPM: 'Support', PM2: '', PM1: '', PA: '', QAQC: '', ProjAcct: '' },

  // Sr. PM (12 tasks)
  { taskCategory: 'Sr. PM', taskDescription: 'Project planning and scheduling', PX: 'Review', SrPM: 'X', PM2: 'Support', PM1: '', PA: '', QAQC: '', ProjAcct: '' },
  { taskCategory: 'Sr. PM', taskDescription: 'Subcontractor procurement and buyout', PX: 'Sign-Off', SrPM: 'X', PM2: 'Support', PM1: '', PA: 'Support', QAQC: '', ProjAcct: '' },
  { taskCategory: 'Sr. PM', taskDescription: 'Monthly cost reporting', PX: 'Review', SrPM: 'X', PM2: 'Support', PM1: '', PA: '', QAQC: '', ProjAcct: 'Support' },
  { taskCategory: 'Sr. PM', taskDescription: 'Change order management', PX: 'Sign-Off', SrPM: 'X', PM2: 'Support', PM1: '', PA: 'Support', QAQC: '', ProjAcct: '' },
  { taskCategory: 'Sr. PM', taskDescription: 'Owner pay application preparation', PX: 'Review', SrPM: 'X', PM2: '', PM1: '', PA: 'Support', QAQC: '', ProjAcct: 'Support' },
  { taskCategory: 'Sr. PM', taskDescription: 'Subcontractor pay application review', PX: '', SrPM: 'X', PM2: 'Support', PM1: '', PA: 'Support', QAQC: '', ProjAcct: 'Review' },
  { taskCategory: 'Sr. PM', taskDescription: 'Project safety oversight', PX: 'Review', SrPM: 'X', PM2: 'Support', PM1: '', PA: '', QAQC: 'Support', ProjAcct: '' },
  { taskCategory: 'Sr. PM', taskDescription: 'Quality assurance program management', PX: '', SrPM: 'X', PM2: 'Support', PM1: '', PA: '', QAQC: 'X', ProjAcct: '' },
  { taskCategory: 'Sr. PM', taskDescription: 'Design coordination and RFI management', PX: '', SrPM: 'X', PM2: 'X', PM1: '', PA: '', QAQC: '', ProjAcct: '' },
  { taskCategory: 'Sr. PM', taskDescription: 'Owner/architect meeting coordination', PX: 'Support', SrPM: 'X', PM2: 'Support', PM1: '', PA: 'Support', QAQC: '', ProjAcct: '' },
  { taskCategory: 'Sr. PM', taskDescription: 'Submittal processing and tracking', PX: '', SrPM: 'X', PM2: 'X', PM1: '', PA: 'Support', QAQC: '', ProjAcct: '' },
  { taskCategory: 'Sr. PM', taskDescription: 'Project closeout coordination', PX: 'Sign-Off', SrPM: 'X', PM2: 'Support', PM1: '', PA: 'Support', QAQC: 'Support', ProjAcct: 'Support' },

  // PM 2 (11 tasks)
  { taskCategory: 'PM 2', taskDescription: 'Daily field coordination and supervision', PX: '', SrPM: 'Review', PM2: 'X', PM1: 'Support', PA: '', QAQC: '', ProjAcct: '' },
  { taskCategory: 'PM 2', taskDescription: 'Three-week look-ahead schedule maintenance', PX: '', SrPM: 'Review', PM2: 'X', PM1: 'Support', PA: '', QAQC: '', ProjAcct: '' },
  { taskCategory: 'PM 2', taskDescription: 'Subcontractor coordination meetings', PX: '', SrPM: '', PM2: 'X', PM1: 'Support', PA: 'Support', QAQC: '', ProjAcct: '' },
  { taskCategory: 'PM 2', taskDescription: 'Material procurement and tracking', PX: '', SrPM: '', PM2: 'X', PM1: 'Support', PA: 'Support', QAQC: '', ProjAcct: '' },
  { taskCategory: 'PM 2', taskDescription: 'Field issue resolution and documentation', PX: '', SrPM: 'Review', PM2: 'X', PM1: 'Support', PA: '', QAQC: '', ProjAcct: '' },
  { taskCategory: 'PM 2', taskDescription: 'Site safety inspections and reporting', PX: '', SrPM: '', PM2: 'X', PM1: 'Support', PA: '', QAQC: 'Support', ProjAcct: '' },
  { taskCategory: 'PM 2', taskDescription: 'Daily reports and photo documentation', PX: '', SrPM: '', PM2: 'X', PM1: 'Support', PA: '', QAQC: '', ProjAcct: '' },
  { taskCategory: 'PM 2', taskDescription: 'Punchlist management', PX: '', SrPM: 'Review', PM2: 'X', PM1: 'Support', PA: '', QAQC: 'Support', ProjAcct: '' },
  { taskCategory: 'PM 2', taskDescription: 'As-built documentation tracking', PX: '', SrPM: '', PM2: 'X', PM1: 'Support', PA: '', QAQC: '', ProjAcct: '' },
  { taskCategory: 'PM 2', taskDescription: 'Temporary facilities management', PX: '', SrPM: '', PM2: 'X', PM1: 'Support', PA: '', QAQC: '', ProjAcct: '' },
  { taskCategory: 'PM 2', taskDescription: 'Site logistics and crane operations', PX: '', SrPM: '', PM2: 'X', PM1: 'Support', PA: '', QAQC: '', ProjAcct: '' },

  // PM 1 (10 tasks)
  { taskCategory: 'PM 1', taskDescription: 'Assist with submittal processing', PX: '', SrPM: '', PM2: 'Review', PM1: 'X', PA: '', QAQC: '', ProjAcct: '' },
  { taskCategory: 'PM 1', taskDescription: 'RFI drafting and tracking', PX: '', SrPM: '', PM2: 'Review', PM1: 'X', PA: '', QAQC: '', ProjAcct: '' },
  { taskCategory: 'PM 1', taskDescription: 'Meeting minutes preparation', PX: '', SrPM: '', PM2: 'Review', PM1: 'X', PA: '', QAQC: '', ProjAcct: '' },
  { taskCategory: 'PM 1', taskDescription: 'Document control and distribution', PX: '', SrPM: '', PM2: '', PM1: 'X', PA: 'Support', QAQC: '', ProjAcct: '' },
  { taskCategory: 'PM 1', taskDescription: 'Drawing log maintenance', PX: '', SrPM: '', PM2: 'Review', PM1: 'X', PA: '', QAQC: '', ProjAcct: '' },
  { taskCategory: 'PM 1', taskDescription: 'Permit application assistance', PX: '', SrPM: '', PM2: 'Review', PM1: 'X', PA: 'Support', QAQC: '', ProjAcct: '' },
  { taskCategory: 'PM 1', taskDescription: 'Subcontractor insurance tracking', PX: '', SrPM: '', PM2: '', PM1: 'X', PA: 'Support', QAQC: '', ProjAcct: '' },
  { taskCategory: 'PM 1', taskDescription: 'Schedule update data collection', PX: '', SrPM: '', PM2: 'Review', PM1: 'X', PA: '', QAQC: '', ProjAcct: '' },
  { taskCategory: 'PM 1', taskDescription: 'Cost code tracking assistance', PX: '', SrPM: '', PM2: '', PM1: 'X', PA: '', QAQC: '', ProjAcct: 'Support' },
  { taskCategory: 'PM 1', taskDescription: 'Safety documentation maintenance', PX: '', SrPM: '', PM2: '', PM1: 'X', PA: '', QAQC: 'Support', ProjAcct: '' },

  // PA (16 tasks)
  { taskCategory: 'PA', taskDescription: 'Project filing system setup and maintenance', PX: '', SrPM: '', PM2: '', PM1: '', PA: 'X', QAQC: '', ProjAcct: '' },
  { taskCategory: 'PA', taskDescription: 'Contract document management', PX: '', SrPM: 'Review', PM2: '', PM1: '', PA: 'X', QAQC: '', ProjAcct: '' },
  { taskCategory: 'PA', taskDescription: 'Subcontract preparation and distribution', PX: '', SrPM: 'Review', PM2: '', PM1: '', PA: 'X', QAQC: '', ProjAcct: '' },
  { taskCategory: 'PA', taskDescription: 'Purchase order processing', PX: '', SrPM: 'Sign-Off', PM2: '', PM1: '', PA: 'X', QAQC: '', ProjAcct: '' },
  { taskCategory: 'PA', taskDescription: 'Insurance certificate tracking', PX: '', SrPM: '', PM2: '', PM1: 'Support', PA: 'X', QAQC: '', ProjAcct: '' },
  { taskCategory: 'PA', taskDescription: 'Lien waiver collection and tracking', PX: '', SrPM: '', PM2: '', PM1: '', PA: 'X', QAQC: '', ProjAcct: 'Support' },
  { taskCategory: 'PA', taskDescription: 'Pay application distribution to subs', PX: '', SrPM: '', PM2: '', PM1: '', PA: 'X', QAQC: '', ProjAcct: 'Support' },
  { taskCategory: 'PA', taskDescription: 'Correspondence tracking and distribution', PX: '', SrPM: '', PM2: '', PM1: '', PA: 'X', QAQC: '', ProjAcct: '' },
  { taskCategory: 'PA', taskDescription: 'Transmittal preparation and logging', PX: '', SrPM: '', PM2: '', PM1: '', PA: 'X', QAQC: '', ProjAcct: '' },
  { taskCategory: 'PA', taskDescription: 'Meeting scheduling and logistics', PX: '', SrPM: 'Support', PM2: '', PM1: '', PA: 'X', QAQC: '', ProjAcct: '' },
  { taskCategory: 'PA', taskDescription: 'Project directory maintenance', PX: '', SrPM: '', PM2: '', PM1: '', PA: 'X', QAQC: '', ProjAcct: '' },
  { taskCategory: 'PA', taskDescription: 'Closeout document collection', PX: '', SrPM: 'Review', PM2: '', PM1: '', PA: 'X', QAQC: '', ProjAcct: '' },
  { taskCategory: 'PA', taskDescription: 'Warranty tracking and documentation', PX: '', SrPM: '', PM2: '', PM1: '', PA: 'X', QAQC: 'Support', ProjAcct: '' },
  { taskCategory: 'PA', taskDescription: 'O&M manual coordination', PX: '', SrPM: '', PM2: 'Support', PM1: '', PA: 'X', QAQC: '', ProjAcct: '' },
  { taskCategory: 'PA', taskDescription: 'Attic stock coordination', PX: '', SrPM: '', PM2: 'Support', PM1: '', PA: 'X', QAQC: '', ProjAcct: '' },
  { taskCategory: 'PA', taskDescription: 'Final release of retainage processing', PX: '', SrPM: 'Sign-Off', PM2: '', PM1: '', PA: 'X', QAQC: '', ProjAcct: 'Support' },

  // QAQC (5 tasks)
  { taskCategory: 'QAQC', taskDescription: 'Quality control inspections', PX: '', SrPM: 'Review', PM2: 'Support', PM1: '', PA: '', QAQC: 'X', ProjAcct: '' },
  { taskCategory: 'QAQC', taskDescription: 'Mock-up and sample reviews', PX: '', SrPM: '', PM2: 'Support', PM1: '', PA: '', QAQC: 'X', ProjAcct: '' },
  { taskCategory: 'QAQC', taskDescription: 'Third-party testing coordination', PX: '', SrPM: '', PM2: 'Support', PM1: '', PA: 'Support', QAQC: 'X', ProjAcct: '' },
  { taskCategory: 'QAQC', taskDescription: 'Pre-installation conference facilitation', PX: '', SrPM: 'Support', PM2: 'Support', PM1: '', PA: '', QAQC: 'X', ProjAcct: '' },
  { taskCategory: 'QAQC', taskDescription: 'Commissioning coordination', PX: '', SrPM: 'Review', PM2: 'Support', PM1: '', PA: '', QAQC: 'X', ProjAcct: '' },

  // Proj Acct (11 tasks)
  { taskCategory: 'Proj Acct', taskDescription: 'Job cost setup in accounting system', PX: '', SrPM: 'Review', PM2: '', PM1: '', PA: '', QAQC: '', ProjAcct: 'X' },
  { taskCategory: 'Proj Acct', taskDescription: 'Monthly job cost reports', PX: '', SrPM: 'Review', PM2: '', PM1: '', PA: '', QAQC: '', ProjAcct: 'X' },
  { taskCategory: 'Proj Acct', taskDescription: 'Subcontractor payment processing', PX: '', SrPM: 'Sign-Off', PM2: '', PM1: '', PA: 'Support', QAQC: '', ProjAcct: 'X' },
  { taskCategory: 'Proj Acct', taskDescription: 'Owner billing/invoicing', PX: '', SrPM: 'Review', PM2: '', PM1: '', PA: 'Support', QAQC: '', ProjAcct: 'X' },
  { taskCategory: 'Proj Acct', taskDescription: 'Retainage tracking', PX: '', SrPM: '', PM2: '', PM1: '', PA: 'Support', QAQC: '', ProjAcct: 'X' },
  { taskCategory: 'Proj Acct', taskDescription: 'Sales tax reporting and compliance', PX: '', SrPM: '', PM2: '', PM1: '', PA: '', QAQC: '', ProjAcct: 'X' },
  { taskCategory: 'Proj Acct', taskDescription: 'Certified payroll tracking', PX: '', SrPM: '', PM2: '', PM1: '', PA: 'Support', QAQC: '', ProjAcct: 'X' },
  { taskCategory: 'Proj Acct', taskDescription: 'Budget transfer processing', PX: '', SrPM: 'Sign-Off', PM2: '', PM1: '', PA: '', QAQC: '', ProjAcct: 'X' },
  { taskCategory: 'Proj Acct', taskDescription: 'WIP schedule preparation', PX: '', SrPM: 'Review', PM2: '', PM1: '', PA: '', QAQC: '', ProjAcct: 'X' },
  { taskCategory: 'Proj Acct', taskDescription: 'Final project cost reconciliation', PX: 'Review', SrPM: 'Sign-Off', PM2: '', PM1: '', PA: '', QAQC: '', ProjAcct: 'X' },
  { taskCategory: 'Proj Acct', taskDescription: 'Project financial closeout', PX: 'Sign-Off', SrPM: 'Review', PM2: '', PM1: '', PA: 'Support', QAQC: '', ProjAcct: 'X' },

  // Misc/All (4 tasks)
  { taskCategory: 'All', taskDescription: 'Attend weekly project team meetings', PX: 'X', SrPM: 'X', PM2: 'X', PM1: 'X', PA: 'X', QAQC: '', ProjAcct: '' },
  { taskCategory: 'All', taskDescription: 'Monthly safety walk participation', PX: 'X', SrPM: 'X', PM2: 'X', PM1: 'X', PA: '', QAQC: 'X', ProjAcct: '' },
  { taskCategory: 'All', taskDescription: 'Lessons learned documentation', PX: 'X', SrPM: 'X', PM2: 'X', PM1: 'X', PA: '', QAQC: 'X', ProjAcct: '' },
  { taskCategory: 'All', taskDescription: 'Project milestone celebration planning', PX: 'Support', SrPM: 'X', PM2: 'Support', PM1: 'Support', PA: 'X', QAQC: '', ProjAcct: '' },
];

export const DEFAULT_RECURRING_ITEMS: Array<{
  role: string;
  duePattern: string;
  description: string;
}> = [
  { role: 'PM', duePattern: 'Weekly (Monday)', description: 'Update three-week look-ahead schedule' },
  { role: 'PM', duePattern: 'Weekly (Friday)', description: 'Submit weekly progress report to owner' },
  { role: 'PM', duePattern: 'Monthly (1st)', description: 'Prepare owner pay application' },
  { role: 'PM', duePattern: 'Monthly (15th)', description: 'Review and approve subcontractor pay applications' },
  { role: 'PM', duePattern: 'Monthly (20th)', description: 'Complete monthly cost projection update' },
  { role: 'Super', duePattern: 'Daily', description: 'Complete daily field report with photos' },
  { role: 'Super', duePattern: 'Weekly (Monday)', description: 'Conduct site safety inspection' },
  { role: 'PA', duePattern: 'Weekly (Wednesday)', description: 'Update insurance certificate tracker' },
  { role: 'ProjAcct', duePattern: 'Monthly (5th)', description: 'Process subcontractor payments' },
  { role: 'QAQC', duePattern: 'Bi-Weekly', description: 'Conduct quality control field inspection' },
];

export const DEFAULT_OWNER_CONTRACT_ARTICLES: Array<{
  articleNumber: string;
  description: string;
}> = [
  { articleNumber: '1', description: 'General Provisions — Definitions and relationship of parties' },
  { articleNumber: '2', description: 'Owner\'s Responsibilities — Information, surveys, permits, insurance' },
  { articleNumber: '3', description: 'Contractor\'s Responsibilities — Supervision, labor, materials, equipment' },
  { articleNumber: '4', description: 'Subcontractors — Award, management, and responsibility for subcontracted work' },
  { articleNumber: '5', description: 'Contract Time — Commencement, substantial completion, liquidated damages' },
  { articleNumber: '6', description: 'Contract Sum — GMP/Lump Sum, allowances, unit prices' },
  { articleNumber: '7', description: 'Changes in the Work — Change order procedures, pricing, time extensions' },
  { articleNumber: '8', description: 'Payment — Progress payments, retainage, final payment' },
  { articleNumber: '9', description: 'Insurance and Bonds — Liability, property, builder\'s risk, surety' },
  { articleNumber: '10', description: 'Safety — Site safety program, OSHA compliance, hazardous materials' },
  { articleNumber: '11', description: 'Uncovering and Correction of Work — Inspection, testing, remediation' },
  { articleNumber: '12', description: 'Warranty — Duration, scope, exclusions' },
  { articleNumber: '13', description: 'Dispute Resolution — Mediation, arbitration, litigation' },
  { articleNumber: '14', description: 'Termination — For cause, for convenience, payment obligations' },
  { articleNumber: '15', description: 'Indemnification — Scope, limitations, mutual obligations' },
  { articleNumber: '16', description: 'Permits and Fees — Responsibility, cost allocation' },
  { articleNumber: '17', description: 'Sustainability Requirements — LEED, green building, certifications' },
  { articleNumber: '18', description: 'Owner\'s Right to Perform Work — Self-performed work, separate contractors' },
  { articleNumber: '19', description: 'Concealed Conditions — Discovery, notice, cost adjustment' },
  { articleNumber: '20', description: 'Miscellaneous — Governing law, assignment, notice requirements' },
];

export const DEFAULT_SUBCONTRACT_CLAUSES: Array<{
  refNumber: string;
  clauseDescription: string;
}> = [
  { refNumber: 'SC-1', clauseDescription: 'Scope of Work — Detailed description of subcontracted work' },
  { refNumber: 'SC-2', clauseDescription: 'Contract Sum and Payment Terms — Price, retainage, payment schedule' },
  { refNumber: 'SC-3', clauseDescription: 'Schedule and Time — Start date, duration, milestones, delay provisions' },
  { refNumber: 'SC-4', clauseDescription: 'Change Orders — Pricing methodology, approval process, time extensions' },
  { refNumber: 'SC-5', clauseDescription: 'Insurance Requirements — GL, auto, workers comp, umbrella minimums' },
  { refNumber: 'SC-6', clauseDescription: 'Indemnification and Hold Harmless — Mutual obligations and limitations' },
  { refNumber: 'SC-7', clauseDescription: 'Safety Requirements — Site-specific safety plan, OSHA compliance, PPE' },
  { refNumber: 'SC-8', clauseDescription: 'Quality Control — Inspections, testing, mock-ups, standards compliance' },
  { refNumber: 'SC-9', clauseDescription: 'Submittals and Shop Drawings — Requirements, review periods, resubmittals' },
  { refNumber: 'SC-10', clauseDescription: 'Cleanup and Waste Management — Daily cleanup, debris removal, recycling' },
  { refNumber: 'SC-11', clauseDescription: 'Warranty — Duration, scope, callback procedures' },
  { refNumber: 'SC-12', clauseDescription: 'Dispute Resolution — Escalation, mediation, arbitration' },
  { refNumber: 'SC-13', clauseDescription: 'Termination — For cause, for convenience, payment for work completed' },
  { refNumber: 'SC-14', clauseDescription: 'Lien Waivers — Conditional/unconditional, progress and final' },
  { refNumber: 'SC-15', clauseDescription: 'Certified Payroll — Davis-Bacon, prevailing wage compliance' },
  { refNumber: 'SC-16', clauseDescription: 'MWBE/SBE Requirements — Participation goals, documentation, reporting' },
  { refNumber: 'SC-17', clauseDescription: 'Liquidated Damages — Flow-down provisions, daily rates, cap' },
  { refNumber: 'SC-18', clauseDescription: 'Bonds — Payment and performance bond requirements' },
  { refNumber: 'SC-19', clauseDescription: 'As-Built Documentation — Requirements, format, delivery schedule' },
  { refNumber: 'SC-20', clauseDescription: 'Closeout Requirements — Punchlist, O&M manuals, warranties, training' },
];
