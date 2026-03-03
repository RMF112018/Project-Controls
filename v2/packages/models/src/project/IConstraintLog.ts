export type ConstraintStatus = 'Open' | 'Closed';

export const DEFAULT_CONSTRAINT_CATEGORIES = [
  'Permits', 'AHJ Coordination', 'Utility Coordination', 'Design Completion',
  'Material Procurement', 'Subcontractor Mobilization', 'Owner Decisions',
  'Site Access', 'Environmental', 'Other',
] as const;

export type ConstraintCategory = string;

export interface IConstraintLog {
  id: number;
  projectCode: string;
  constraintNumber: number;
  category: ConstraintCategory;
  description: string;
  status: ConstraintStatus;
  assignedTo: string;
  dateIdentified: string;
  dueDate: string;
  dateClosed?: string;
  reference?: string;
  closureDocument?: string;
  budgetImpactCost?: number;
  comments?: string;
}
