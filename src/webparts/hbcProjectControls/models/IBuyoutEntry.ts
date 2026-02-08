export type BuyoutStatus = 'Not Started' | 'In Progress' | 'Awarded' | 'Executed';

export interface IBuyoutEntry {
  id: number;
  projectCode: string;
  divisionCode: string;        // e.g., "02-300", "05-120"
  divisionDescription: string; // e.g., "Staking", "Structural Steel"
  isStandard: boolean;         // true for pre-populated divisions

  // Budgeting
  originalBudget: number;      // Manual entry
  estimatedTax: number;
  totalBudget: number;         // Calculated: originalBudget + estimatedTax

  // Award Information
  subcontractorName?: string;
  contractValue?: number;
  overUnder?: number;          // Calculated: totalBudget - contractValue

  // Compliance (Tracking Only)
  enrolledInSDI: boolean;      // Yes/No
  bondRequired: boolean;       // Yes/No

  // Milestone Dates
  loiSentDate?: string;
  loiReturnedDate?: string;
  contractSentDate?: string;
  contractExecutedDate?: string;
  insuranceCOIReceivedDate?: string;

  // Status
  status: BuyoutStatus;
  notes?: string;
  createdDate: string;
  modifiedDate: string;
}
