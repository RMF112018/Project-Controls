/**
 * Stage 8/11 — Estimating Kickoff Section Configurations (Single Source of Truth)
 *
 * ALL_KICKOFF_SECTION_CONFIGS is the ONE canonical location for section and
 * column definitions. Both EstimatingKickoffPage and DepartmentTrackingPage
 * MUST import from here — no page may define its own configs.
 *
 * Maps 1:1 to reference/Estimating Kickoff Template.xlsx sections + columns.
 */
import type { IKickoffSectionConfig } from '../models/IKickoffConfig';

// ── Section 1: Project Information ──────────────────────────────────
export const KICKOFF_SECTION_PROJECT_INFO: IKickoffSectionConfig = {
  sectionKey: 'project_info',
  title: 'PROJECT INFORMATION',
  hideHeader: true,
  columns: [
    { key: 'task', header: 'Field', editorType: 'readonly', width: '220px' },
    { key: 'value', header: 'Value', editorType: 'text', width: '1fr' },
  ],
  editorTypeOverrides: {
    Title: { editorType: 'readonly' },
    ProjectCode: { editorType: 'readonly' },
    Architect: { editorType: 'text' },
    ProposalDueDateTime: { editorType: 'datetime' },
    ProposalDeliveryMethod: { editorType: 'text' },
    CopiesIfHandDelivered: { editorType: 'number' },
    ProposalType: { editorType: 'text' },
    RFIFormat: { editorType: 'select', options: ['Excel', 'Procore', 'Other'] },
    RFIFormatOther: { editorType: 'text', placeholder: 'Specify RFI format...' },
    'keyPersonnel:PX': { editorType: 'text' },
    PrimaryOwnerContact: { editorType: 'text' },
    OwnerContactPhone: { editorType: 'phone', placeholder: '000-000-0000' },
    OwnerContactEmail: { editorType: 'email', placeholder: 'email@example.com' },
    'keyPersonnel:Lead Estimator': { editorType: 'text' },
  },
  allowCustomRows: false,
  defaultExpanded: true,
};

// ── Section 2: Managing Information ─────────────────────────────────
export const KICKOFF_SECTION_MANAGING: IKickoffSectionConfig = {
  sectionKey: 'managing',
  title: 'MANAGING INFORMATION',
  columns: [
    { key: 'task', header: 'Task', editorType: 'readonly', width: '300px' },
    { key: 'status', header: 'YES / NO', editorType: 'yes-no-na', width: '100px' },
    { key: 'responsibleParty', header: 'Responsible', editorType: 'text', width: '150px' },
    { key: 'deadline', header: 'Deadline/Frequency', editorType: 'text', width: '160px' },
    { key: 'notes', header: 'Notes', editorType: 'text', width: '200px' },
  ],
  allowCustomRows: true,
  allowRowRemoval: true,
  defaultExpanded: true,
};

// ── Section 3: Key Dates ────────────────────────────────────────────
export const KICKOFF_SECTION_KEY_DATES: IKickoffSectionConfig = {
  sectionKey: 'key_dates',
  title: 'Key Dates',
  columns: [
    { key: 'task', header: 'Estimate Preparation', editorType: 'readonly', width: '260px' },
    { key: 'responsibleParty', header: 'Responsible', editorType: 'text', width: '150px' },
    { key: 'deadline', header: 'Deadline', editorType: 'datetime', width: '180px' },
    { key: 'notes', header: 'Notes', editorType: 'textarea', width: '200px' },
  ],
  allowCustomRows: false,
  defaultExpanded: true,
};

// ── Section 4: Final Deliverables – Standard ────────────────────────
export const KICKOFF_SECTION_DELIVERABLES_STANDARD: IKickoffSectionConfig = {
  sectionKey: 'deliverables_standard',
  title: 'Final Deliverables - Standard',
  columns: [
    { key: 'task', header: 'Deliverable', editorType: 'readonly', width: '250px' },
    { key: 'status', header: 'Required', editorType: 'yes-no-na', width: '100px' },
    {
      key: 'deliverableStatus', header: 'Status', editorType: 'status-select',
      width: '120px', options: ['Pending', 'In Progress', 'Complete'],
      dependsOnColumn: 'status', enabledWhenValue: 'yes',
    },
    { key: 'responsibleParty', header: 'Responsible', editorType: 'text', width: '150px' },
    { key: 'deadline', header: 'Deadline', editorType: 'datetime', width: '180px' },
    { key: 'notes', header: 'Notes', editorType: 'textarea', width: '200px' },
  ],
  allowCustomRows: true,
  allowRowRemoval: true,
  defaultExpanded: true,
};

// ── Section 5: Final Deliverables – Non-Standard ────────────────────
export const KICKOFF_SECTION_DELIVERABLES_NONSTANDARD: IKickoffSectionConfig = {
  sectionKey: 'deliverables_nonstandard',
  title: 'Final Deliverables - Non-Standard',
  columns: [
    { key: 'task', header: 'Deliverable', editorType: 'text', width: '200px' },
    { key: 'status', header: 'Required', editorType: 'yes-no-na', width: '100px' },
    {
      key: 'deliverableStatus', header: 'Status', editorType: 'status-select',
      width: '120px', options: ['Pending', 'In Progress', 'Complete'],
      dependsOnColumn: 'status', enabledWhenValue: 'yes',
    },
    { key: 'responsibleParty', header: 'Responsible', editorType: 'text', width: '150px' },
    { key: 'deadline', header: 'Deadline', editorType: 'datetime', width: '180px' },
    { key: 'notes', header: 'Notes', editorType: 'textarea', width: '200px' },
  ],
  allowCustomRows: true,
  maxCustomRows: 10,
  allowRowRemoval: true,
  defaultExpanded: true,
};

/**
 * All 5 sections in Excel template order.
 * This is the DEFINITIVE array — both pages iterate over this.
 */
export const ALL_KICKOFF_SECTION_CONFIGS: IKickoffSectionConfig[] = [
  KICKOFF_SECTION_PROJECT_INFO,
  KICKOFF_SECTION_MANAGING,
  KICKOFF_SECTION_KEY_DATES,
  KICKOFF_SECTION_DELIVERABLES_STANDARD,
  KICKOFF_SECTION_DELIVERABLES_NONSTANDARD,
];
