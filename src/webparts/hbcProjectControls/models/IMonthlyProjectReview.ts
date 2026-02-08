export type MonthlyReviewStatus =
  | 'NotStarted'
  | 'InProgress'
  | 'PendingPXReview'
  | 'PXReviewComplete'
  | 'PMRevising'
  | 'PendingPXValidation'
  | 'SubmittedToLeadership'
  | 'FollowUpPending'
  | 'Complete';

export interface IMonthlyChecklistItem {
  id: number;
  sectionKey: string;
  sectionTitle: string;
  itemKey: string;
  itemDescription: string;
  pmComment: string;
  pxComment: string;
  pxInitial: string;
}

export interface IMonthlyFollowUp {
  id: number;
  question: string;
  requestedBy: string;
  requestedDate: string;
  pmResponse: string;
  responseDate: string | null;
  pxForwardedDate: string | null;
  status: 'Open' | 'Responded' | 'Forwarded' | 'Closed';
}

export interface IMonthlyProjectReview {
  id: number;
  projectCode: string;
  reviewMonth: string;
  status: MonthlyReviewStatus;
  dueDate: string;
  meetingDate: string | null;
  pmSubmittedDate: string | null;
  pxReviewDate: string | null;
  pxValidationDate: string | null;
  leadershipSubmitDate: string | null;
  completedDate: string | null;
  checklistItems: IMonthlyChecklistItem[];
  followUps: IMonthlyFollowUp[];
  reportDocumentUrls: string[];
  createdBy: string;
  createdAt: string;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
}

export interface IMonthlyChecklistSectionDef {
  key: string;
  title: string;
  items: Array<{ key: string; description: string }>;
}

export const MONTHLY_CHECKLIST_SECTIONS: IMonthlyChecklistSectionDef[] = [
  { key: 'schedule', title: 'Schedule', items: [
    { key: 'schedule-status', description: 'Current schedule status and critical path review' },
    { key: 'schedule-updates', description: 'Schedule updates and look-ahead review' },
  ]},
  { key: 'budget', title: 'Budget & Cost', items: [
    { key: 'budget-status', description: 'Current budget status and cost report review' },
    { key: 'cost-forecast', description: 'Cost-to-complete forecast accuracy' },
    { key: 'change-orders', description: 'Change order status and pending items' },
  ]},
  { key: 'buyout', title: 'Buyout', items: [
    { key: 'buyout-status', description: 'Subcontract buyout status and remaining items' },
    { key: 'buyout-savings', description: 'Buyout savings/overruns tracking' },
  ]},
  { key: 'rfi', title: 'RFIs', items: [
    { key: 'rfi-status', description: 'Open RFI status and aging report' },
    { key: 'rfi-response', description: 'RFI response time tracking' },
  ]},
  { key: 'submittals', title: 'Submittals', items: [
    { key: 'submittal-status', description: 'Submittal log status and critical items' },
  ]},
  { key: 'safety', title: 'Safety', items: [
    { key: 'safety-incidents', description: 'Safety incident review and near-miss reports' },
    { key: 'safety-compliance', description: 'Safety compliance and inspection status' },
  ]},
  { key: 'quality', title: 'Quality', items: [
    { key: 'quality-issues', description: 'Quality concerns and non-conformance reports' },
    { key: 'quality-inspections', description: 'Third-party inspection status' },
  ]},
  { key: 'subcontractors', title: 'Subcontractor Management', items: [
    { key: 'sub-performance', description: 'Subcontractor performance review' },
    { key: 'sub-issues', description: 'Subcontractor issues and back-charges' },
  ]},
  { key: 'owner', title: 'Owner Relations', items: [
    { key: 'owner-communication', description: 'Owner communication and meeting notes' },
    { key: 'owner-satisfaction', description: 'Owner satisfaction and concerns' },
  ]},
  { key: 'cashflow', title: 'Cash Flow', items: [
    { key: 'billing-status', description: 'Monthly billing status and collections' },
    { key: 'retention', description: 'Retention status and release schedule' },
  ]},
  { key: 'risk', title: 'Risk Management', items: [
    { key: 'risk-register', description: 'Risk register review and updates' },
    { key: 'risk-mitigation', description: 'Mitigation plan status' },
  ]},
  { key: 'claims', title: 'Claims & Disputes', items: [
    { key: 'claims-status', description: 'Active claims and dispute status' },
  ]},
  { key: 'staffing', title: 'Staffing', items: [
    { key: 'staffing-plan', description: 'Project staffing plan and needs' },
  ]},
  { key: 'closeout', title: 'Closeout Planning', items: [
    { key: 'closeout-status', description: 'Closeout planning and punch list status' },
  ]},
  { key: 'general', title: 'General Notes', items: [
    { key: 'general-notes', description: 'Additional notes and action items' },
  ]},
];
