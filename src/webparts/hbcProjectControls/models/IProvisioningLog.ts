import { ProvisioningStatus } from './enums';

export const PROVISIONING_STEPS = [
  { step: 1, label: 'Create SharePoint Site' },
  { step: 2, label: 'Apply PnP Template' },
  { step: 3, label: 'Hub Association' },
  { step: 4, label: 'Security Groups & Members' },
  { step: 5, label: 'Copy Templates from Registry' },
  { step: 6, label: 'Copy Lead Data & Documents' },
  { step: 7, label: 'Update Leads_Master with Site URL' },
] as const;

export const TOTAL_PROVISIONING_STEPS = 7;

export interface IProvisioningLog {
  id: number;
  projectCode: string;
  projectName: string;
  leadId: number;
  status: ProvisioningStatus;
  currentStep: number;
  completedSteps: number;
  failedStep?: number;
  errorMessage?: string;
  retryCount: number;
  siteUrl?: string;
  requestedBy: string;
  requestedAt: string;
  completedAt?: string;
}
