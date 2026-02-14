import { ITurnoverPrerequisite, ITurnoverDiscussionItem, ITurnoverExhibit, ITurnoverSignature } from '../models/ITurnoverAgenda';

export const TURNOVER_SIGNATURE_AFFIDAVIT =
  'I certify that I have reviewed the turnover package and accept responsibility for the information transferred. ' +
  'I understand that any discrepancies or omissions should be reported immediately.';

type PrerequisiteTemplate = Pick<ITurnoverPrerequisite, 'label' | 'description' | 'sortOrder'>;

export const DEFAULT_PREREQUISITES: PrerequisiteTemplate[] = [
  {
    sortOrder: 1,
    label: 'Estimate File Complete',
    description: 'Estimate file has been reviewed and finalized by the Lead Estimator.',
  },
  {
    sortOrder: 2,
    label: 'Contract Executed',
    description: 'Owner contract has been fully executed and filed.',
  },
  {
    sortOrder: 3,
    label: 'Job Number Assigned',
    description: 'Official job number has been issued by Accounting.',
  },
  {
    sortOrder: 4,
    label: 'Site Visit Completed',
    description: 'Operations team has completed an initial site visit.',
  },
];

type DiscussionTemplate = Pick<ITurnoverDiscussionItem, 'label' | 'description' | 'sortOrder'>;

export const DEFAULT_DISCUSSION_ITEMS: DiscussionTemplate[] = [
  {
    sortOrder: 1,
    label: 'Scope of Work',
    description: 'Review the full scope of work, inclusions, and exclusions.',
  },
  {
    sortOrder: 2,
    label: 'Budget & Cost Review',
    description: 'Walk through the estimate, GC costs, contingencies, and fee structure.',
  },
  {
    sortOrder: 3,
    label: 'Schedule Overview',
    description: 'Review project milestones, critical dates, and long-lead items.',
  },
  {
    sortOrder: 4,
    label: 'Subcontractor Strategy',
    description: 'Discuss subcontractor selections, bid coverage, and procurement plan.',
  },
  {
    sortOrder: 5,
    label: 'Risk Items',
    description: 'Identify known risks, allowances, exclusions, and potential change orders.',
  },
  {
    sortOrder: 6,
    label: 'Contract Requirements',
    description: 'Review key contract terms, insurance, bonding, and compliance requirements.',
  },
  {
    sortOrder: 7,
    label: 'Safety Considerations',
    description: 'Discuss site-specific safety concerns and safety plan requirements.',
  },
  {
    sortOrder: 8,
    label: 'Quality Requirements',
    description: 'Review quality standards, special inspections, and testing requirements.',
  },
  {
    sortOrder: 9,
    label: 'Client Expectations',
    description: 'Discuss client communication preferences, reporting, and relationship dynamics.',
  },
  {
    sortOrder: 10,
    label: 'Open Items & Action Items',
    description: 'Capture outstanding questions, open items, and next steps for the team.',
  },
];

type ExhibitTemplate = Pick<ITurnoverExhibit, 'label' | 'sortOrder' | 'isDefault'>;

export const DEFAULT_EXHIBITS: ExhibitTemplate[] = [
  { sortOrder: 1, label: 'Executed Contract', isDefault: true },
  { sortOrder: 2, label: 'Final Estimate / GMP', isDefault: true },
  { sortOrder: 3, label: 'Project Schedule', isDefault: true },
  { sortOrder: 4, label: 'Subcontractor Bid Tabulation', isDefault: true },
  { sortOrder: 5, label: 'Allowance Log', isDefault: true },
  { sortOrder: 6, label: 'Value Engineering Log', isDefault: true },
  { sortOrder: 7, label: 'Insurance & Bonding Docs', isDefault: true },
  { sortOrder: 8, label: 'Site Logistics Plan', isDefault: true },
  { sortOrder: 9, label: 'Permit & NOC Status', isDefault: true },
  { sortOrder: 10, label: 'Project Directory', isDefault: true },
];

type SignatureTemplate = Pick<ITurnoverSignature, 'role' | 'sortOrder'>;

export const DEFAULT_SIGNATURES: SignatureTemplate[] = [
  { sortOrder: 1, role: 'Lead Estimator' },
  { sortOrder: 2, role: 'Project Executive' },
  { sortOrder: 3, role: 'Project Manager' },
  { sortOrder: 4, role: 'Superintendent' },
];
