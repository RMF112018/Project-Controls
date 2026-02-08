export type RiskCostCategory = 'Buyout' | 'Risk' | 'Savings';
export type RiskCostItemStatus = 'Open' | 'Realized' | 'Mitigated' | 'Closed';

export interface IRiskCostItem {
  id: number;
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
  contractAmount: number;
  buyoutOpportunities: IRiskCostItem[];
  potentialRisks: IRiskCostItem[];
  potentialSavings: IRiskCostItem[];
  createdBy: string;
  createdAt: string;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
}
