export interface ICostLineItem {
  category: string;
  originalBudget: number;
  approvedChanges: number;
  revisedBudget: number;
  costToDate: number;
  projectedFinal: number;
  variance: number;
}

export interface IEstimateLineItem {
  id: string;
  csiCode: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  status: 'Draft' | 'In Review' | 'Approved' | 'Revised';
}

export interface IGCGRLineItem {
  code: string;
  description: string;
  monthlyBudget: number;
  totalBudget: number;
  actualToDate: number;
  projectedFinal: number;
  variance: number;
}

export interface ICashFlowMonth {
  month: string;
  billingProjection: number;
  expenditureForecast: number;
  netCashFlow: number;
  cumulativeCash: number;
}

export interface IVarianceItem {
  id: string;
  division: string;
  estimatedCost: number;
  actualCost: number;
  variance: number;
  variancePct: number;
  notes: string;
}
