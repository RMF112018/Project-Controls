export type AssignmentType = 'Estimator' | 'Director';

export interface IAssignmentMapping {
  id: number;
  region: string;          // Region value or 'All Regions'
  sector: string;          // Sector label or 'All Sectors'
  assignmentType: AssignmentType;
  assignee: { userId: string; displayName: string; email: string };
}
