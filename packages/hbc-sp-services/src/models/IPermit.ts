export type PermitType = 'PRIMARY' | 'SUB' | 'TEMP';

export type PermitStatus =
  | 'Active'
  | 'Pending Application'
  | 'Pending Revision'
  | 'Inactive'
  | 'VOID'
  | 'Expired'
  | 'Closed';

export const PERMIT_STATUS_OPTIONS: PermitStatus[] = [
  'Active', 'Pending Application', 'Pending Revision', 'Inactive', 'VOID', 'Expired', 'Closed',
];

export const PERMIT_TYPE_OPTIONS: PermitType[] = ['PRIMARY', 'SUB', 'TEMP'];

export interface IPermit {
  id: number;
  projectCode: string;
  refNumber: string;           // "1", "02E", "16FA" — string, not numeric
  parentRefNumber?: string;    // SUB permits link to parent PRIMARY ref
  location: string;            // "Site", "Building", "Pool"
  type: PermitType;
  permitNumber: string;        // Permit # from AHJ (e.g. "B-2024-031340-0000", "Not Issued")
  description: string;
  responsibleContractor: string;
  address: string;
  dateRequired?: string;
  dateSubmitted?: string;
  dateReceived?: string;
  dateExpires?: string;
  status: PermitStatus;
  ahj: string;                 // Authority Having Jurisdiction
  comments?: string;
}
