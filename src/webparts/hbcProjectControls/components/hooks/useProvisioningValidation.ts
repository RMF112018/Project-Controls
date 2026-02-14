import { useState, useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { ILead, GoNoGoDecision, IValidationError, validateProjectCode } from '@hbc/sp-services';

export interface IValidationWarning {
  field: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface IProvisioningValidationResult {
  isValid: boolean;
  errors: IValidationError[];
  warnings: IValidationWarning[];
}

export interface IUseProvisioningValidation {
  validateForProvisioning: (lead: ILead, projectCode?: string) => Promise<IProvisioningValidationResult>;
  lastResult: IProvisioningValidationResult | null;
}

export function useProvisioningValidation(): IUseProvisioningValidation {
  const { dataService } = useAppContext();
  const [lastResult, setLastResult] = useState<IProvisioningValidationResult | null>(null);

  const validateForProvisioning = useCallback(async (lead: ILead, projectCode?: string): Promise<IProvisioningValidationResult> => {
    const errors: IValidationError[] = [];
    const warnings: IValidationWarning[] = [];

    // Required field checks (reuse validateLeadForm logic inline to avoid form-specific fields like DepartmentOfOrigin)
    if (!lead.Title?.trim()) {
      errors.push({ field: 'Title', message: 'Project name is required' });
    }
    if (!lead.ClientName?.trim()) {
      errors.push({ field: 'ClientName', message: 'Client name is required' });
    }
    if (!lead.Region) {
      errors.push({ field: 'Region', message: 'Region is required' });
    }
    if (!lead.Sector) {
      errors.push({ field: 'Sector', message: 'Sector is required' });
    }
    if (!lead.Division) {
      errors.push({ field: 'Division', message: 'Division is required' });
    }

    // ProjectCode format
    const codeToCheck = projectCode || lead.ProjectCode;
    if (!codeToCheck) {
      errors.push({ field: 'ProjectCode', message: 'Project code is required for provisioning' });
    } else if (!validateProjectCode(codeToCheck)) {
      errors.push({ field: 'ProjectCode', message: 'Project code must match format yy-nnn-0m (e.g., 25-042-01)' });
    }

    // ProjectValue > 0
    if (!lead.ProjectValue || lead.ProjectValue <= 0) {
      errors.push({ field: 'ProjectValue', message: 'Project value must be greater than 0' });
    }

    // Duplicate provisioning check (async)
    if (codeToCheck) {
      try {
        const existingLog = await dataService.getProvisioningStatus(codeToCheck);
        if (existingLog) {
          errors.push({ field: 'ProjectCode', message: `Project ${codeToCheck} has already been provisioned or is in progress` });
        }
      } catch {
        // If check fails, don't block — proceed without duplicate check
      }
    }

    // Warnings (non-blocking)
    if (!lead.AddressCity?.trim() || !lead.AddressState?.trim()) {
      warnings.push({ field: 'Address', message: 'City and State are recommended before provisioning', severity: 'medium' });
    }

    if (lead.GoNoGoDecision && lead.GoNoGoDecision !== GoNoGoDecision.Go && lead.GoNoGoDecision !== GoNoGoDecision.ConditionalGo) {
      warnings.push({ field: 'GoNoGoDecision', message: 'Go/No-Go decision is not Go or Conditional Go', severity: 'high' });
    } else if (!lead.GoNoGoDecision) {
      warnings.push({ field: 'GoNoGoDecision', message: 'No Go/No-Go decision has been recorded', severity: 'high' });
    }

    const result: IProvisioningValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
    setLastResult(result);
    return result;
  }, [dataService]);

  return { validateForProvisioning, lastResult };
}
