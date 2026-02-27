export type ProjectHubPermitStatus = 'Approved' | 'Pending' | 'Under Review' | 'Expired' | 'Not Submitted';

export interface ProjectHubPermitEntry {
  id: string;
  permitType: string;
  permitNumber: string;
  issuingAuthority: string;
  submittedDate: string | null;
  approvedDate: string | null;
  expirationDate: string | null;
  status: ProjectHubPermitStatus;
  notes: string;
}

export type ProjectHubConstraintPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type ProjectHubConstraintStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export interface ProjectHubConstraint {
  id: string;
  description: string;
  category: string;
  priority: ProjectHubConstraintPriority;
  status: ProjectHubConstraintStatus;
  owner: string;
  dateIdentified: string;
  targetResolution: string;
  resolvedDate: string | null;
  impact: string;
}

export type ProjectHubBuyoutStatus = 'Not Started' | 'Bidding' | 'Evaluating' | 'Awarded' | 'Executed';

export interface ProjectHubBuyoutPackage {
  id: string;
  tradePackage: string;
  divisionCode: string;
  budgetAmount: number;
  buyoutAmount: number | null;
  savings: number | null;
  status: ProjectHubBuyoutStatus;
  subcontractor: string | null;
  targetDate: string;
}
