export type RiskCostCategory = 'Buyout' | 'Risk' | 'Savings';
export type RiskCostItemStatus = 'Open' | 'Realized' | 'Mitigated' | 'Closed';

export interface IRiskCostItem {
  id: number;
  /** FK to parent Risk_Cost_Management record */
  projectCode?: string;
  /** FK to parent Risk_Cost_Management.id */
  riskCostId?: number;
  category: RiskCostCategory;
  letter: string;
  description: string;
  estimatedValue: number;
  status: RiskCostItemStatus;
  notes: string;
  createdDate: string;
  updatedDate: string;
}

export interface IRiskCostManagement {
  id: number;
  projectCode: string;
  contractType: string;
  /** @denormalized — source: Leads_Master.ProjectValue */
  contractAmount: number;
  buyoutOpportunities: IRiskCostItem[];
  potentialRisks: IRiskCostItem[];
  potentialSavings: IRiskCostItem[];
  createdBy: string;
  createdAt: string;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
}
