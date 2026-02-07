import { ILead, ILeadFormData } from '../models/ILead';

export interface IValidationError {
  field: string;
  message: string;
}

export function validateLeadForm(data: Partial<ILeadFormData>): IValidationError[] {
  const errors: IValidationError[] = [];

  if (!data.Title?.trim()) {
    errors.push({ field: 'Title', message: 'Project name is required' });
  }
  if (!data.ClientName?.trim()) {
    errors.push({ field: 'ClientName', message: 'Client name is required' });
  }
  if (!data.Region) {
    errors.push({ field: 'Region', message: 'Region is required' });
  }
  if (!data.Sector) {
    errors.push({ field: 'Sector', message: 'Sector is required' });
  }
  if (!data.Division) {
    errors.push({ field: 'Division', message: 'Division is required' });
  }
  if (!data.DepartmentOfOrigin) {
    errors.push({ field: 'DepartmentOfOrigin', message: 'Department of origin is required' });
  }
  if (data.ProjectValue !== undefined && data.ProjectValue < 0) {
    errors.push({ field: 'ProjectValue', message: 'Project value cannot be negative' });
  }
  if (data.AnticipatedFeePct !== undefined && (data.AnticipatedFeePct < 0 || data.AnticipatedFeePct > 100)) {
    errors.push({ field: 'AnticipatedFeePct', message: 'Fee percentage must be between 0 and 100' });
  }
  if (data.AnticipatedGrossMargin !== undefined && (data.AnticipatedGrossMargin < 0 || data.AnticipatedGrossMargin > 100)) {
    errors.push({ field: 'AnticipatedGrossMargin', message: 'Gross margin must be between 0 and 100' });
  }

  return errors;
}

export function validateProjectCode(code: string): boolean {
  // Format: yy-nnn-0m (e.g., 25-042-01)
  return /^\d{2}-\d{3}-\d{2}$/.test(code);
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isRequired(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}
